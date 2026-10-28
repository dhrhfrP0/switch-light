// /api/petitions 테스트 — 국회 응답을 화면용 청원으로 옳게 바꾸는지
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, assemblyOk } from './helpers.js';
import { fetchAssembly } from '../api/_lib/assembly.js';
import { getPetitions, normalizePetition } from '../api/petitions.js';

let mock;
beforeEach(() => { process.env.ASSEMBLY_API_KEY = 'test-key'; });
afterEach(() => { mock?.restore(); delete process.env.ASSEMBLY_API_KEY; });

test('인증키가 없으면 NO_KEY 오류', async () => {
  delete process.env.ASSEMBLY_API_KEY;
  await assert.rejects(fetchAssembly('PTTRCP'), { code: 'NO_KEY' });
});

test('데이터 없음(INFO-200)은 빈 목록', async () => {
  mock = mockFetch([['PTTRCP', { RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' } }]]);
  assert.deepEqual(await fetchAssembly('PTTRCP'), { total: 0, rows: [] });
});

test('XML 오류 응답도 읽는다', async () => {
  mock = mockFetch([['PTTRCP', '<RESULT><CODE>ERROR-290</CODE><MESSAGE>인증키가 유효하지 않습니다.</MESSAGE></RESULT>']]);
  await assert.rejects(fetchAssembly('PTTRCP'), { code: 'ERROR-290', message: '인증키가 유효하지 않습니다.' });
});

test('필드 이름 정규화 + 링크 없으면 청원 페이지 주소를 만든다', () => {
  const p = normalizePetition({ PTT_ID: 'ABC', PTT_NM: ' 제목 ', CITZN_AGM_CNT: '51,234', RCP_DT: '20261020' });
  assert.equal(p.title, '제목');
  assert.equal(p.agreeCount, 51234);
  assert.equal(p.startDate, '2026-10-20');
  assert.equal(p.url, 'https://petitions.assembly.go.kr/proceed/onGoingAll/ABC');
});

test('국민동의청원만 최신순으로, 빈 내용은 상세 API로 채운다', async () => {
  mock = mockFetch([
    ['PTTRCP', assemblyOk('PTTRCP', [
      { PTT_ID: 'old', PTT_NM: '옛 청원', PTT_KIND: '국민동의청원', CITZN_AGM_CNT: 50100, RCP_DT: '2026-09-01', LINK_URL: 'https://petitions.assembly.go.kr/x/old' },
      { PTT_ID: 'new', PTT_NM: '새 청원', PTT_KIND: '국민동의청원', CITZN_AGM_CNT: 50500, RCP_DT: '2026-10-20' },
      { PTT_ID: 'mp', PTT_NM: '의원 소개 청원', PTT_KIND: '의원소개청원', RCP_DT: '2026-10-25' },
    ])],
    ['PTTINFODETAIL', (url) => assemblyOk('PTTINFODETAIL', [{ PTT_ID: 'x', PTT_CN: `본문입니다 ${new URL(url).searchParams.get('PTT_ID')}` }])],
  ]);
  const body = await getPetitions();
  assert.equal(body.source, 'live');
  assert.deepEqual(body.items.map((p) => p.id), ['new', 'old']);
  assert.equal(body.items[0].content, '본문입니다 new');
  assert.equal(body.items[1].url, 'https://petitions.assembly.go.kr/x/old');
  assert.ok(!('kind' in body.items[0]));
  assert.ok(mock.calls[0].includes('ERACO=%EC%A0%9C22%EB%8C%80')); // 기본 인자 '제22대'
});
