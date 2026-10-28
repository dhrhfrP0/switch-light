/* =====================================================================
   GET /api/petitions — 국회 국민동의청원 목록 (제목·내용·동의 수·청원 페이지 주소)
   - 의견·평가를 붙이지 않고 국회 자료를 그대로 옮긴다
   - CDN 캐시 60초 → 화면은 1분마다 새 동의 수를 받는다
   - ?debug=1 : 원본 필드 이름 확인용 (필드가 바뀌었을 때 FIELDS 를 고치는 데 사용)

   환경변수
   - ASSEMBLY_API_KEY      (필수) 열린국회정보 인증키
   - PETITION_LIST_CODE    목록 서비스 코드. 기본 'PTTRCP'(청원 접수목록).
                           열린국회정보의 "진행중 국민동의청원 현황" 코드를 넣으면 동의 진행 중인 청원을 보여준다.
   - PETITION_LIST_PARAMS  목록 추가 인자 (쿼리 문자열). 기본 'ERACO=제22대'
   - PETITION_DETAIL_CODE  상세 서비스 코드. 기본 'PTTINFODETAIL' (청원 내용 보강용)
   ===================================================================== */
import { fetchAssembly, pick, toNumber, toDate } from './_lib/assembly.js';
import { sendJson } from './_lib/respond.js';

const MAX_ITEMS = 30;
const DETAIL_LIMIT = 12; // 내용을 보강할 최대 청원 수 (호출 수 제한)
const PETITION_SITE = 'https://petitions.assembly.go.kr';

/** 서비스마다 다른 필드 이름 후보 — 앞에 있을수록 우선 */
export const FIELDS = {
  id: ['PTT_ID', 'PETIT_ID', 'BILL_ID', 'PTT_NO'],
  title: ['PTT_NM', 'PETIT_SJ', 'PETIT_NM', 'BILL_NAME', 'TITLE'],
  agree: ['AGRE_CO', 'AGRE_CNT', 'AGREE_CNT', 'CITZN_AGM_CNT', 'AGM_CNT'],
  content: ['PTT_CN', 'PETIT_CN', 'PETIT_CONT', 'PTT_CONT', 'PETIT_OBJET', 'PTT_PURPS', 'PTT_RSN', 'CONTENT'],
  status: ['PTT_STTUS_NM', 'STTUS_NM', 'PROC_RESULT', 'PROC_STTUS', 'PTT_KIND'],
  start: ['AGRE_BEGIN_DE', 'RCP_DT', 'PROPOSE_DT', 'REG_DT'],
  end: ['AGRE_END_DE', 'END_DT'],
  url: ['LINK_URL', 'URL', 'DETAIL_LINK'],
  kind: ['PTT_KIND'],
};

/** 상세 응답에서 본문 찾기: 후보 필드 → 없으면 가장 긴 글 (주소 제외) */
function findContent(row) {
  const direct = pick(row, FIELDS.content);
  if (direct) return String(direct).trim();
  const longest = Object.values(row ?? {})
    .filter((v) => typeof v === 'string' && v.length >= 60 && !/^https?:\/\//.test(v))
    .sort((a, b) => b.length - a.length)[0];
  return longest?.trim() ?? '';
}

/** 국회 원본 한 줄 → 화면용 청원 */
export function normalizePetition(row) {
  const id = String(pick(row, FIELDS.id) ?? '');
  const url = pick(row, FIELDS.url);
  return {
    id,
    title: String(pick(row, FIELDS.title) ?? '(제목 없음)').trim(),
    content: findContent(row),
    agreeCount: toNumber(pick(row, FIELDS.agree)),
    status: String(pick(row, FIELDS.status) ?? '').trim(),
    kind: String(pick(row, FIELDS.kind) ?? ''),
    startDate: toDate(pick(row, FIELDS.start)),
    endDate: toDate(pick(row, FIELDS.end)),
    url: url && /^https?:\/\//.test(url) ? url : id ? `${PETITION_SITE}/proceed/onGoingAll/${id}` : `${PETITION_SITE}/`,
  };
}

/** 목록 불러오기 — 정렬 순서를 몰라도 최신 청원을 잡도록 첫 쪽과 끝 쪽을 함께 읽는다 */
async function loadRows(code, params) {
  const first = await fetchAssembly(code, { ...params, pIndex: 1, pSize: 100 });
  const lastPage = Math.ceil(first.total / 100);
  if (lastPage <= 1) return first.rows;
  const tail = await fetchAssembly(code, { ...params, pIndex: lastPage, pSize: 100 });
  const rows = [...first.rows, ...tail.rows];
  if (tail.rows.length < 30 && lastPage > 2) rows.push(...(await fetchAssembly(code, { ...params, pIndex: lastPage - 1, pSize: 100 })).rows);
  return rows;
}

/** 내용이 비어 있는 청원은 상세 API 로 본문을 채운다 (실패해도 목록은 그대로) */
async function fillContent(items, detailCode) {
  const targets = items.filter((p) => !p.content && p.id).slice(0, DETAIL_LIMIT);
  await Promise.allSettled(
    targets.map(async (p) => {
      const { rows } = await fetchAssembly(detailCode, { PTT_ID: p.id, pSize: 1 }, { timeoutMs: 4000 });
      const detail = rows[0];
      if (!detail) return;
      p.content = findContent(detail);
      p.agreeCount ||= toNumber(pick(detail, FIELDS.agree));
      p.endDate ||= toDate(pick(detail, FIELDS.end));
    }),
  );
}

export async function getPetitions({ debug = false } = {}) {
  const listCode = process.env.PETITION_LIST_CODE || 'PTTRCP';
  const listParams = Object.fromEntries(new URLSearchParams(process.env.PETITION_LIST_PARAMS ?? 'ERACO=제22대'));
  const detailCode = process.env.PETITION_DETAIL_CODE || 'PTTINFODETAIL';

  const rows = await loadRows(listCode, listParams);
  const seen = new Set();
  let items = rows
    .map(normalizePetition)
    .filter((p) => p.id && !seen.has(p.id) && seen.add(p.id));

  // 종류 정보가 있으면 국민동의청원만 (의원 소개 청원 제외)
  if (items.some((p) => p.kind.includes('국민동의'))) items = items.filter((p) => p.kind.includes('국민동의'));

  items = items.sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, MAX_ITEMS);
  await fillContent(items, detailCode);

  return {
    source: 'live',
    fetchedAt: new Date().toISOString(),
    listCode,
    items: items.map(({ kind, ...rest }) => rest),
    ...(debug && { debug: { listCode, totalRows: rows.length, sampleKeys: Object.keys(rows[0] ?? {}), sampleRow: rows[0] ?? null } }),
  };
}

export default async function handler(req, res) {
  const debug = new URL(req.url, 'http://localhost').searchParams.get('debug') === '1';
  try {
    const body = await getPetitions({ debug });
    sendJson(res, body, debug ? {} : { cacheSeconds: 60, staleSeconds: 300 });
  } catch (err) {
    console.error('[petitions]', err);
    sendJson(res, { source: 'unavailable', reason: err.message, code: err.code ?? null }, { cacheSeconds: 30 });
  }
}
