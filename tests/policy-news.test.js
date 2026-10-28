// /api/policy-news 테스트 — 원문 수집과 AI 요약 합치기 (AI 는 가짜 클라이언트로 대신)
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, assemblyOk } from './helpers.js';
import { getPolicyNews, parseRss, summarize } from '../api/policy-news.js';

const LONG_REASON = '제안이유 및 주요내용 현행법은 ○○에 관한 규정을 두고 있으나 대상이 좁아 이를 넓히려는 것임. '.repeat(3);
const RSS = `<?xml version="1.0"?><rss><channel>
  <item><title><![CDATA[정책 발표 하나]]></title><link>https://www.korea.kr/news/1</link>
    <description><![CDATA[<p>정부는 오늘 ○○ 제도를 바꾼다고 밝혔다. 대상은 만 65세 이상이며 내년 1월부터 시행된다. 신청은 주민센터에서 할 수 있다. 자세한 기준은 누리집에 공개된 안내문을 따른다.</p>]]></description>
    <pubDate>Tue, 27 Oct 2026 09:00:00 +0900</pubDate><dc:creator>테스트부</dc:creator></item>
</channel></rss>`;

/** 가짜 Claude 클라이언트 — 받은 요청을 기록하고 정해진 응답을 돌려준다 */
const fakeClient = (reply) => {
  const requests = [];
  return {
    requests,
    beta: { messages: { create: async (req) => { requests.push(req); return typeof reply === 'function' ? reply(req) : reply; } } },
  };
};

let mock;
beforeEach(() => {
  process.env.ASSEMBLY_API_KEY = 'test-key';
  mock = mockFetch([
    ['nknalejkafmvgzmpt', assemblyOk('nknalejkafmvgzmpt', [
      { BILL_ID: 'B1', BILL_NO: '2200100', BILL_NAME: '○○법 일부개정법률안', PROPOSER: '홍길동의원 등 10인', CURR_COMMITTEE: '행정안전위원회', NOTI_ED_DT: '2026-11-05', LINK_URL: 'https://pal.assembly.go.kr/bill/B1' },
      { BILL_ID: 'B2', BILL_NO: '2200099', BILL_NAME: '△△법 일부개정법률안', LINK_URL: 'https://pal.assembly.go.kr/bill/B2' },
    ])],
    ['pal.assembly.go.kr/bill/B1', `<html><body><div>메뉴</div><div class="cont">${LONG_REASON}</div></body></html>`],
    ['pal.assembly.go.kr/bill/B2', '<html><body>본문 없음</body></html>'],
    ['korea.kr/rss', RSS],
  ]);
});
afterEach(() => { mock.restore(); delete process.env.ASSEMBLY_API_KEY; delete process.env.ANTHROPIC_API_KEY; });

test('RSS 파싱 (CDATA·작성 기관)', () => {
  const [item] = parseRss(RSS);
  assert.equal(item.title, '정책 발표 하나');
  assert.equal(item.link, 'https://www.korea.kr/news/1');
  assert.equal(item.creator, '테스트부');
});

test('AI 키가 없으면 원문만 (ai: disabled)', async () => {
  const body = await getPolicyNews();
  assert.equal(body.source, 'live');
  assert.equal(body.ai, 'disabled');
  assert.equal(body.items.length, 3);
  const bill = body.items.find((n) => n.id === 'bill-B1');
  assert.ok(bill.original.startsWith('제안이유'));
  assert.equal(bill.deadline, '2026-11-05');
  assert.equal(bill.opinionUrl, 'https://pal.assembly.go.kr/bill/B1');
  assert.ok(body.items.every((n) => n.summary === null));
});

test('요약은 원문이 충분한 자료만, 한 번의 호출로, 구조화 출력으로 요청한다', async () => {
  const client = fakeClient((req) => {
    const docs = JSON.parse(req.messages[0].content.match(/<documents>\n([\s\S]*)\n<\/documents>/)[1]);
    return {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ summaries: docs.map((d) => ({ id: d.id, headline: `${d.title} 요약`, points: ['사실'], changes: '-', affected: '-', schedule: '-' })) }) }],
    };
  });
  const body = await getPolicyNews({ client });
  assert.equal(body.ai, 'ok');
  assert.equal(client.requests.length, 1);
  const req = client.requests[0];
  assert.equal(req.model, 'claude-opus-5-5');
  assert.equal(req.output_config.format.type, 'json_schema');
  assert.equal(req.output_config.effort, 'low');
  assert.equal(req.fallbacks, 'default');
  assert.deepEqual(req.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(req.system[0].cache_control.type, 'ephemeral');
  // 원문이 짧은 B2 는 요약 대상이 아니다
  assert.equal(body.items.find((n) => n.id === 'bill-B2').summary, null);
  assert.equal(body.items.find((n) => n.id === 'bill-B1').summary.headline, '○○법 일부개정법률안 요약');
  assert.ok(body.items.find((n) => n.kind === 'policy').summary);
});

test('거절·깨진 응답이면 요약 없이 원문만', async () => {
  const items = [{ id: 'a', original: LONG_REASON }];
  const refused = await summarize(items, { client: fakeClient({ stop_reason: 'refusal', content: [] }) });
  assert.equal(refused.status, 'error');
  const broken = await summarize(items, { client: fakeClient({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{깨짐' }] }) });
  assert.equal(broken.status, 'error');
  assert.equal(broken.reason, 'AI 요약 결과를 읽지 못했어요.');
});

test('Haiku 처럼 서버 측 대체 모델이 없는 모델에는 fallbacks 를 보내지 않는다', async () => {
  process.env.CLAUDE_MODEL = 'claude-haiku-5-5';
  const client = fakeClient({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"summaries":[]}' }] });
  await summarize([{ id: 'a', original: LONG_REASON }], { client });
  delete process.env.CLAUDE_MODEL;
  assert.equal(client.requests[0].fallbacks, undefined);
  assert.equal(client.requests[0].betas, undefined);
});

test('모든 원본이 실패하면 unavailable', async () => {
  mock.restore();
  mock = mockFetch([]);
  const body = await getPolicyNews();
  assert.equal(body.source, 'unavailable');
  assert.match(body.reason, /HTTP 404/);
});
