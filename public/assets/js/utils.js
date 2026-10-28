/* =====================================================================
   중개광장 — 화면과 무관한 작은 도우미 함수 모음
   ===================================================================== */

/** localStorage 안전 래퍼 — 사생활 보호 모드 등에서 저장이 막혀도 화면은 정상 동작 */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 저장 실패는 무시 — 새로고침하면 초기 상태로 돌아갈 뿐 */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 무시 */
    }
  },
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * 정치싸움판 열림 여부와 다음 전환까지 남은 시간을 한국 시간(UTC+9) 기준으로 계산한다.
 * 사용자 기기의 시간대와 상관없이 같은 결과가 나오도록 UTC 계산만 쓴다.
 * @param {number} nowMs 현재 시각 (Date.now())
 * @param {{start:number,end:number,label:string}[]} slots 여는 시간대
 * @returns {{open:boolean, slot:object|null, msLeft:number, next:object}}
 */
export function battleState(nowMs, slots) {
  const kstMs = nowMs + KST_OFFSET_MS;
  const dayStart = Math.floor(kstMs / DAY_MS) * DAY_MS; // 한국 시간 기준 오늘 0시
  const sinceMidnight = kstMs - dayStart;

  for (const slot of slots) {
    const s = slot.start * HOUR_MS;
    const e = slot.end * HOUR_MS;
    if (sinceMidnight >= s && sinceMidnight < e) {
      return { open: true, slot, msLeft: e - sinceMidnight, next: slot };
    }
  }
  // 닫혀 있으면 오늘 남은 시간대 → 없으면 내일 첫 시간대
  const later = slots.find((slot) => slot.start * HOUR_MS > sinceMidnight);
  const next = later ?? slots[0];
  const nextStart = (later ? 0 : DAY_MS) + next.start * HOUR_MS;
  return { open: false, slot: null, msLeft: nextStart - sinceMidnight, next };
}

/** 남은 밀리초 → "02:15:09" */
export function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** 작성 시각 → "방금 전", "5분 전", "3시간 전", "2일 전", "2026.10.01" */
export function timeAgo(ts, nowMs = Date.now()) {
  const diff = Math.max(0, nowMs - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return formatDate(ts);
}

/** 타임스탬프 → "2026.10.28" */
export function formatDate(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 시각 → "오후 3:05:12" */
export function formatClock(ts) {
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

/** 12345 → "12,345" */
export function formatNumber(n) {
  return Number(n || 0).toLocaleString('ko-KR');
}

/**
 * "2026-11-03", "20261103", "2026.11.03" 같은 날짜 문자열 → 남은 날 수 (오늘이면 0, 지났으면 음수)
 * 날짜를 읽지 못하면 null
 */
export function daysUntil(dateStr, nowMs = Date.now()) {
  if (!dateStr) return null;
  const digits = String(dateStr).replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) return null;
  const target = Date.UTC(+digits.slice(0, 4), +digits.slice(4, 6) - 1, +digits.slice(6, 8));
  const todayKst = Math.floor((nowMs + KST_OFFSET_MS) / DAY_MS) * DAY_MS;
  return Math.round((target - todayKst) / DAY_MS);
}

/** 국가 코드 → 국기 이모지 ("KR" → 🇰🇷). 알 수 없으면 지구본 */
export function flagEmoji(code) {
  if (!/^[A-Z]{2}$/.test(code || '')) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** 겹치지 않는 짧은 아이디 */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** fetch + 시간 제한 + JSON 파싱 — 실패하면 사람이 읽을 수 있는 이유를 담아 던진다 */
export async function fetchJson(url, { timeoutMs = 8000 } = {}) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new Error(err.name === 'TimeoutError' ? '서버 응답이 너무 늦어요.' : '서버에 연결하지 못했어요.');
  }
  if (!res.ok) throw new Error(`서버에 연결하지 못했어요. (오류 ${res.status})`);
  return res.json();
}
