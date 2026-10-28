/* =====================================================================
   열린국회정보(open.assembly.go.kr) OpenAPI 공용 호출기
   - 인증키: 환경변수 ASSEMBLY_API_KEY (https://open.assembly.go.kr 회원가입 후 무료 발급)
   - 응답 구조: { [코드]: [ { head: [ {list_total_count}, {RESULT:{CODE,MESSAGE}} ] }, { row: [...] } ] }
   - 데이터가 없으면 { RESULT: { CODE: 'INFO-200' } } 만 온다
   ※ api/_lib 아래 파일은 밑줄(_)로 시작해서 Vercel 이 주소(엔드포인트)로 만들지 않는다.
   ===================================================================== */

const BASE_URL = 'https://open.assembly.go.kr/portal/openapi';
const NO_DATA = 'INFO-200';
const OK = 'INFO-000';

export class AssemblyApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AssemblyApiError';
    this.code = code;
  }
}

/**
 * OpenAPI 한 페이지 호출
 * @param {string} code 서비스 코드 (예: 'PTTRCP', 'nknalejkafmvgzmpt')
 * @param {Record<string,string|number>} params 추가 요청 인자
 * @returns {Promise<{ total: number, rows: object[] }>}
 */
export async function fetchAssembly(code, params = {}, { timeoutMs = 7000 } = {}) {
  const key = process.env.ASSEMBLY_API_KEY;
  if (!key) throw new AssemblyApiError('NO_KEY', '열린국회정보 인증키(ASSEMBLY_API_KEY)가 설정되지 않았어요.');

  const query = new URLSearchParams({ KEY: key, Type: 'json', pIndex: '1', pSize: '100' });
  for (const [k, v] of Object.entries(params)) query.set(k, String(v));

  const res = await fetch(`${BASE_URL}/${code}?${query}`, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new AssemblyApiError(`HTTP_${res.status}`, `열린국회정보 응답 오류 (HTTP ${res.status})`);
  const text = await res.text();

  // JSON 을 요청해도 오류는 XML 로 올 때가 있다
  if (text.trimStart().startsWith('<')) {
    const resultCode = text.match(/<CODE>([^<]*)<\/CODE>/)?.[1] ?? 'XML';
    if (resultCode === NO_DATA) return { total: 0, rows: [] };
    const message = text.match(/<MESSAGE>([^<]*)<\/MESSAGE>/)?.[1] ?? 'XML 오류 응답';
    throw new AssemblyApiError(resultCode, message);
  }

  const data = JSON.parse(text);
  const block = data[code] ?? data[Object.keys(data).find((k) => Array.isArray(data[k]))];
  if (!Array.isArray(block)) {
    const result = data.RESULT ?? {};
    if (result.CODE === NO_DATA) return { total: 0, rows: [] };
    throw new AssemblyApiError(result.CODE ?? 'UNKNOWN', result.MESSAGE ?? '알 수 없는 응답 형식');
  }

  const head = block.find((b) => b.head)?.head ?? [];
  const result = head.find((h) => h.RESULT)?.RESULT;
  if (result && result.CODE !== OK) {
    if (result.CODE === NO_DATA) return { total: 0, rows: [] };
    throw new AssemblyApiError(result.CODE, result.MESSAGE);
  }
  return {
    total: Number(head.find((h) => 'list_total_count' in h)?.list_total_count ?? 0),
    rows: block.find((b) => b.row)?.row ?? [],
  };
}

/** 후보 필드 이름 중 처음으로 값이 있는 것 (API 마다 필드 이름이 조금씩 달라서) */
export function pick(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return null;
}

/** "12,345" 같은 문자열도 숫자로 */
export function toNumber(v) {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** "20261103" → "2026-11-03" (이미 형식이 있으면 앞 10자) */
export function toDate(v) {
  if (!v) return '';
  const s = String(v).trim();
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 8 && !/[-.]/.test(s.slice(0, 10))) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return s.slice(0, 10).replace(/\./g, '-');
}

/** HTML 조각 → 읽기 좋은 텍스트 */
export function htmlToText(html) {
  return String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
