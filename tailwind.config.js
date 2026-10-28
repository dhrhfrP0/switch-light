// Tailwind 설정 — 색상은 src/styles.css 의 CSS 변수(라이트/다크 공용 토큰)를 참조한다.
// rgb(var(--x) / <alpha-value>) 형태라서 bg-brand/10 같은 투명도 표기도 그대로 쓸 수 있다.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./public/**/*.{html,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),             // 페이지 바탕
        surface: token('surface'),   // 카드·모달 바탕
        sunken: token('sunken'),     // 입력창·댓글 등 한 단계 들어간 면
        line: token('line'),         // 테두리
        ink: {
          DEFAULT: token('ink'),     // 본문 글자 (대비 15:1 이상)
          2: token('ink-2'),         // 보조 글자 (7:1 이상, WCAG AAA)
          3: token('ink-3'),         // 메타 정보 (7:1 이상, WCAG AAA)
        },
        brand: {
          DEFAULT: '#0A5C36',        // 메인 녹색 — 버튼 바탕(흰 글자 대비 8.2:1)
          dark: '#063D24',
          ink: token('brand-ink'),   // 녹색 글자 — 다크모드에서는 밝은 녹색으로 바뀜
          soft: token('brand-soft'), // 연한 녹색 면
        },
        cons: { ink: token('cons-ink'), soft: token('cons-soft'), DEFAULT: '#9F2D2D' },
        prog: { ink: token('prog-ink'), soft: token('prog-soft'), DEFAULT: '#1E4FA8' },
        battle: { ink: token('battle-ink'), soft: token('battle-soft'), DEFAULT: '#A3241F' },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
    },
  },
  plugins: [],
};
