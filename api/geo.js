/* =====================================================================
   GET /api/geo — 접속 국가 코드
   Vercel 이 요청마다 붙여 주는 x-vercel-ip-country 헤더를 그대로 돌려준다.
   (외부 IP 조회 서비스를 쓰지 않아 빠르고, 하루 호출 한도도 없다)
   ===================================================================== */
import { sendJson } from './_lib/respond.js';

export default function handler(req, res) {
  const raw = String(req.headers['x-vercel-ip-country'] ?? '').toUpperCase();
  sendJson(res, { country_code: /^[A-Z]{2}$/.test(raw) ? raw : null });
}
