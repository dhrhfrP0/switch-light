/* =====================================================================
   중개광장 — 시작 파일
   기능별 모듈(features/*)을 하나의 Alpine 컴포넌트 "app" 으로 합친다.
   ===================================================================== */
import Alpine from '../vendor/alpine.esm.js'; // npm run build 가 node_modules 에서 복사해 둔다
import { MENUS, BOARDS } from './config.js';
import { uiFeature } from './features/ui.js';
import { authFeature } from './features/auth.js';
import { boardFeature } from './features/board.js';
import { battleFeature } from './features/battle.js';
import { petitionsFeature } from './features/petitions.js';
import { newsFeature } from './features/news.js';

/**
 * 여러 기능 객체를 하나로 합친다.
 * 전개 연산자({...a})를 쓰면 get 계산 속성이 값으로 굳어 버리므로,
 * 속성 설명자(descriptor)를 그대로 옮겨 계산 속성을 살린다.
 */
function compose(...parts) {
  const target = {};
  for (const part of parts) Object.defineProperties(target, Object.getOwnPropertyDescriptors(part));
  return target;
}

Alpine.data('app', () =>
  compose(
    uiFeature(),
    authFeature(),
    boardFeature(),
    battleFeature(),
    petitionsFeature(),
    newsFeature(),
    {
      init() {
        this.initUi();
        this.initAuth();
        this.initBoard();
        this.initBattle();
        this.$watch('route', (route) => this.onRouteChange(route));
        this.onRouteChange(this.route);
      },

      /** 화면이 바뀔 때마다: 필터 초기화, 화면별 자료 불러오기, 탭 제목 변경 */
      onRouteChange(route) {
        this.genFilter = 'all';
        if (route === 'profile' && this.profile.loggedIn) this.loadProfileForm();
        this.onPetitionRoute(route);
        this.onNewsRoute(route);
        const label = MENUS.find((m) => m.id === route)?.label ?? BOARDS[route]?.title;
        document.title = route === 'home' || !label ? '중개광장 — 세대도, 정치도, 함께' : `${label} · 중개광장`;
      },
    },
  ),
);

/* ---------- 누르는 순간 물결 효과 (버튼·칩 공통) ---------- */
document.addEventListener('pointerdown', (event) => {
  const el = event.target.closest('.btn, .chip');
  if (!el || el.disabled) return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ink = document.createElement('span');
  ink.className = 'ripple-ink';
  ink.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
  el.appendChild(ink);
  ink.addEventListener('animationend', () => ink.remove());
});

window.Alpine = Alpine; // 브라우저 개발자 도구에서 살펴보기용
Alpine.start();
