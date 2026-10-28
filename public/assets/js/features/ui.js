/* =====================================================================
   화면 공통 기능 — 주소(#해시) 이동, 알림 토스트, 다크모드, 첫 방문 안내, 안내 창
   ===================================================================== */
import { MENUS, GUIDE_SLIDES, INFO_PAGES, GLOSSARY } from '../config.js';
import { storage, timeAgo, formatDate, formatClock, formatNumber, daysUntil } from '../utils.js';

const EXTRA_ROUTES = ['search']; // 메뉴에는 없지만 들어갈 수 있는 화면

export function uiFeature() {
  return {
    menus: MENUS,
    route: 'home',
    mobileNavOpen: false,
    searchOpen: false,
    darkMode: false,
    toasts: [],
    guide: { open: false, idx: 0, slides: GUIDE_SLIDES },
    info: { open: false, key: 'terms' },
    infoPages: INFO_PAGES,
    glossary: GLOSSARY,
    now: Date.now(), // 1초마다 갱신 — "n분 전" 표시와 카운트다운이 함께 쓴다

    initUi() {
      this.darkMode = document.documentElement.classList.contains('dark');
      window.addEventListener('hashchange', () => this.applyHash());
      this.applyHash();
      setInterval(() => { this.now = Date.now(); }, 1000);
      if (!storage.get('jg_guide_seen', false)) setTimeout(() => this.openGuide(), 600);
    },

    /* ---------- 화면 이동 ---------- */
    applyHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      const known = this.menus.some((m) => m.id === id) || EXTRA_ROUTES.includes(id);
      // 검색 화면은 검색어가 있을 때만 의미가 있다
      this.route = known && !(id === 'search' && !this.searchQuery) ? id : 'home';
    },
    goto(id) {
      this.mobileNavOpen = false;
      if (location.hash.slice(1) === id) this.applyHash();
      else location.hash = id;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    isRoute(id) {
      return this.route === id;
    },

    /* ---------- 알림 토스트 (alert 대신) ---------- */
    toast(message, tone = 'info') {
      const id = Date.now() + Math.random();
      this.toasts = [...this.toasts.slice(-2), { id, message, tone }]; // 화면을 가리지 않게 최대 3개
      setTimeout(() => { this.toasts = this.toasts.filter((t) => t.id !== id); }, 3500);
    },

    /* ---------- 다크모드 (기본은 라이트) ---------- */
    toggleDark() {
      this.darkMode = !this.darkMode;
      document.documentElement.classList.toggle('dark', this.darkMode);
      storage.set('jg_dark', this.darkMode);
    },

    /* ---------- 첫 방문 안내 4장 ---------- */
    openGuide() {
      this.guide.idx = 0;
      this.guide.open = true;
    },
    closeGuide() {
      this.guide.open = false;
      storage.set('jg_guide_seen', true);
    },

    /* ---------- 푸터 안내 창 ---------- */
    openInfo(key) {
      this.info = { open: true, key };
    },

    /** 개발자 모드: 이 브라우저에 저장된 데모 기록(jg_ 로 시작하는 값)을 모두 지운다 */
    resetDemo() {
      if (!confirm('데모 기록(회원·글·투표)을 모두 지울까요?')) return;
      try {
        Object.keys(localStorage).filter((k) => k.startsWith('jg_')).forEach((k) => localStorage.removeItem(k));
      } catch { /* 저장소를 못 쓰는 환경 — 새로고침만 */ }
      location.reload();
    },

    /** Esc 키 — 가장 위에 떠 있는 창부터 닫는다 */
    closeTopModal() {
      if (this.info.open) this.info.open = false;
      else if (this.guide.open) this.closeGuide();
      else if (this.writer.open) this.writer.open = false;
      else if (this.login.open) this.login.open = false;
      else if (this.postModal.open) this.postModal.open = false;
      else this.mobileNavOpen = false;
    },

    /* ---------- 표시 형식 도우미 (템플릿에서 사용) ---------- */
    ago(ts) {
      return timeAgo(ts, this.now);
    },
    date(ts) {
      return formatDate(ts);
    },
    clock(ts) {
      return ts ? formatClock(ts) : '';
    },
    num(n) {
      return formatNumber(n);
    },
    /** 마감일 → "D-3", "오늘 마감", "마감" (날짜를 못 읽으면 빈 문자열) */
    dday(dateStr) {
      const d = daysUntil(dateStr, this.now);
      if (d === null) return '';
      if (d > 0) return `D-${d}`;
      return d === 0 ? '오늘 마감' : '마감';
    },
  };
}
