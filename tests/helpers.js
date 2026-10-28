// 테스트 도우미 — 전역 fetch 를 주소별 가짜 응답으로 바꾼다
export function mockFetch(routes) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    calls.push(href);
    for (const [pattern, reply] of routes) {
      if (href.includes(pattern)) {
        const out = typeof reply === 'function' ? reply(href) : reply;
        if (out instanceof Error) throw out;
        const body = typeof out === 'string' ? out : JSON.stringify(out);
        return new Response(body, { status: 200 });
      }
    }
    return new Response('not found', { status: 404 });
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

/** 열린국회정보 정상 응답 모양 */
export const assemblyOk = (code, rows, total = rows.length) => ({
  [code]: [
    { head: [{ list_total_count: total }, { RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다.' } }] },
    { row: rows },
  ],
});
