/* =====================================================================
   서버 함수 응답 도우미 — CDN 캐시 시간을 정해 같은 요청이 몰려도 원본·AI 호출을 아낀다
   ===================================================================== */

/**
 * JSON 응답
 * @param {import('http').ServerResponse} res
 * @param {object} body
 * @param {{ cacheSeconds?: number, staleSeconds?: number, status?: number }} options
 *   cacheSeconds: Vercel CDN 이 이 시간 동안 같은 응답을 재사용 (0 이면 캐시 안 함)
 *   staleSeconds: 캐시가 지난 뒤에도 새 응답을 만드는 동안 옛 응답을 먼저 보여줄 시간
 */
export function sendJson(res, body, { cacheSeconds = 0, staleSeconds = 0, status = 200 } = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    cacheSeconds > 0 ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}` : 'no-store',
  );
  res.end(JSON.stringify(body));
}
