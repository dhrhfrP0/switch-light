/* =====================================================================
   중개광장 — 화면 전체에서 쓰는 고정 설정값
   (문구·색·일정 등을 바꿀 때는 이 파일만 고치면 된다)
   ===================================================================== */

/** 정치 성향 5단계 — dot: 색상 원, icon: 상징 아이콘, cls: styles.css 의 배지 클래스 */
export const LEANINGS = [
  { key: 'far_right', label: '극보수', dot: '🔴', icon: '🛡️', cls: 'badge-far-right' },
  { key: 'right',     label: '보수',   dot: '🟠', icon: '⚖️', cls: 'badge-right' },
  { key: 'center',    label: '중립',   dot: '⚪', icon: '⚖️', cls: 'badge-center' },
  { key: 'left',      label: '진보',   dot: '🔵', icon: '🌱', cls: 'badge-left' },
  { key: 'far_left',  label: '극진보', dot: '🟣', icon: '🔥', cls: 'badge-far-left' },
];

/** 세대 구분 — 카카오·네이버 연령대 정보로 자동 분류 (데모에서는 가입 때 고름) */
export const GENERATIONS = [
  { key: 'youth',  label: '청년층',   range: '20~30대',  icon: '🧑' },
  { key: 'middle', label: '중장년층', range: '40~50대',  icon: '👨' },
  { key: 'senior', label: '시니어층', range: '60대 이상', icon: '🧓' },
];

/** 기본 제공 아바타 5종 */
export const AVATARS = ['🦊', '🐻', '🐯', '🐼', '🦁'];

/** 국적 표시용 국가 이름 (국기는 utils.flagEmoji 가 국가 코드로 만든다) */
export const COUNTRY_NAMES = {
  KR: '대한민국', US: '미국', JP: '일본', CN: '중국', GB: '영국', DE: '독일',
  FR: '프랑스', CA: '캐나다', AU: '호주', RU: '러시아', IN: '인도', BR: '브라질',
  MX: '멕시코', IT: '이탈리아', ES: '스페인', NL: '네덜란드', SG: '싱가포르',
  VN: '베트남', TH: '태국', ID: '인도네시아', PH: '필리핀', TW: '대만',
};
export const HOME_COUNTRY = 'KR';

/** 상단 메뉴 — id 는 주소의 #해시와 같다 */
export const MENUS = [
  { id: 'home',         label: '홈',          icon: '🏠' },
  { id: 'conservative', label: '보수마당',     icon: '🛡️' },
  { id: 'progressive',  label: '진보마당',     icon: '🌱' },
  { id: 'plaza',        label: '자유광장',     icon: '🌿' },
  { id: 'battle',       label: '정치싸움판',   icon: '🔥' },
  { id: 'participate',  label: '정책 참여',    icon: '🗳️' },
  { id: 'news',         label: '정책·법 소식', icon: '📰' },
  { id: 'profile',      label: '내 프로필',    icon: '👤' },
];

/** 게시판 구역 설정 — 같은 목록 화면을 구역마다 다른 색·규칙으로 보여준다 */
export const BOARDS = {
  conservative: {
    title: '보수마당', icon: '🛡️', theme: 'theme-cons', titleCls: 'text-cons-ink', writeBtn: 'btn-cons',
    desc: '보수 성향 이야기를 나누는 곳이에요. 글은 내 세대 줄에만 쓸 수 있고, 읽기는 누구나 자유예요.',
    byGeneration: true,
  },
  progressive: {
    title: '진보마당', icon: '🌱', theme: 'theme-prog', titleCls: 'text-prog-ink', writeBtn: 'btn-prog',
    desc: '진보 성향 이야기를 나누는 곳이에요. 글은 내 세대 줄에만 쓸 수 있고, 읽기는 누구나 자유예요.',
    byGeneration: true,
  },
  plaza: {
    title: '자유광장', icon: '🌿', theme: 'theme-plaza', titleCls: 'text-brand-ink', writeBtn: 'btn-primary',
    desc: '세대도 정치 성향도 상관없이 누구나 — 서로 다른 생각이 만나는 광장이에요.',
    byTags: true,
  },
  battle: {
    title: '정치싸움판', icon: '🔥', theme: 'theme-battle', titleCls: 'text-battle-ink', writeBtn: 'btn-danger',
    desc: '매일 오전 9–12시, 오후 6–9시(한국 시간)에만 열리는 세대 격돌 토론장이에요.',
    timeLocked: true,
  },
  search: {
    title: '검색 결과', icon: '🔎', theme: '', titleCls: 'text-ink', writeBtn: 'btn-primary',
    desc: '모든 구역의 글에서 찾았어요.',
    readOnly: true,
  },
};

/** 자유광장 태그 + 글 내용으로 자동 추천할 때 쓰는 낱말 */
export const TAGS = ['보수', '진보', '중립', '정책', '선거', '세대대립', '연금', '부동산', '외교', '경제', '교육', '일자리'];
export const TAG_HINTS = {
  연금: '연금', 국민연금: '연금', 노후: '연금',
  집값: '부동산', 전세: '부동산', 월세: '부동산', 아파트: '부동산', 주거: '부동산',
  선거: '선거', 투표: '선거', 공약: '선거',
  청년: '세대대립', 시니어: '세대대립', 세대: '세대대립', '20대': '세대대립', '60대': '세대대립',
  외교: '외교', 미국: '외교', 중국: '외교', 일본: '외교', 북한: '외교', 동맹: '외교', 안보: '외교',
  경제: '경제', 물가: '경제', 세금: '경제', 재정: '경제', 복지: '경제',
  일자리: '일자리', 취업: '일자리', 고용: '일자리',
  교육: '교육', 학교: '교육', 입시: '교육',
  법안: '정책', 정책: '정책', 개정: '정책', 제도: '정책',
  보수: '보수', 진보: '진보', 중립: '중립',
};

/** 정치싸움판 여는 시간 (한국 시간, 시 단위 — end 는 포함하지 않음) */
export const BATTLE_SLOTS = [
  { start: 9,  end: 12, label: '오전' },
  { start: 18, end: 21, label: '오후' },
];

/** 이번 주 세대 대결 주제 — 홈 주간 배너와 정치싸움판이 함께 쓴다 */
export const WEEKLY_TOPIC = {
  title: '20대 vs 60대 — 연금 개혁, 누가 더 손해인가?',
  desc: '“더 내고 덜 받는다”는 청년과 “평생 성실히 냈다”는 시니어. 서로의 사정을 들어보는 시간입니다.',
  sideA: { key: 'a', label: '청년 측', icon: '🧑' },
  sideB: { key: 'b', label: '시니어 측', icon: '🧓' },
};

/** 국민동의청원 성립 기준 (30일 안에 5만 명 동의) */
export const PETITION_GOAL = 50000;
export const PETITION_HOME = 'https://petitions.assembly.go.kr/';
export const PETITION_POLL_MS = 60_000;

/** 중개인 점수 뱃지 — 점수를 넘기면 프로필에 달린다 */
export const SCORE_BADGES = [
  { min: 1,   icon: '🌱', label: '첫 이해' },
  { min: 10,  icon: '🌉', label: '다리 놓는 사람' },
  { min: 50,  icon: '🤝', label: '광장의 중개인' },
  { min: 200, icon: '🏛️', label: '광장의 어른' },
];

/** 어려운 용어 풀이 — 화면에서 점선 밑줄 낱말을 누르면 보인다 */
export const GLOSSARY = {
  국민동의청원: '국회에 내는 청원이에요. 공개 후 30일 안에 5만 명이 동의하면 국회 위원회가 정식으로 심사해요.',
  입법예고: '법을 새로 만들거나 고치기 전에 국민에게 미리 알리고 의견을 받는 절차예요. 누구나 찬반 의견을 낼 수 있어요.',
  소관위원회: '그 법안이나 청원을 맡아서 살펴보는 국회 상임위원회예요.',
  회부: '청원이나 법안을 담당 위원회로 넘겨 정식으로 심사하게 하는 것이에요.',
  연금개혁: '국민연금을 얼마나 내고 얼마나 받을지 등 제도를 바꾸는 일이에요.',
  크로스포스팅: '세대 마당에 쓴 글을 자유광장에도 함께 올려 다른 세대와 나누는 것이에요.',
  중개인점수: '"이해" 버튼을 누르거나, 내 글·댓글이 "이해"를 받으면 1점씩 올라요.',
};

/** 첫 방문 안내 4장 */
export const GUIDE_SLIDES = [
  { icon: '🌿', title: '자유광장에서 만나요', text: '세대도 정치 성향도 상관없이, 누구나 글을 쓰고 이야기할 수 있어요.' },
  { icon: '👥', title: '내 세대 마당이 있어요', text: '보수마당·진보마당에서는 내 세대 줄에만 글을 쓸 수 있어요. 읽기는 모두 자유예요.' },
  { icon: '🔥', title: '싸움판은 정해진 시간에만', text: '정치싸움판은 매일 오전 9–12시, 오후 6–9시에만 열려요.' },
  { icon: '🤝', title: '생각이 달라도 "이해"를', text: '글쓴이의 성향은 투표한 뒤에 보여요. 편견 없이 읽고, 이해되면 "이해"를 눌러 주세요.' },
];

/** 푸터 안내 글 (간단 버전 — 실서비스 전 법률 검토 필요) */
export const INFO_PAGES = {
  terms: {
    title: '이용약관',
    body: [
      '중개광장은 서로 다른 생각을 존중하는 토론 공간입니다.',
      '인신공격, 혐오 표현, 허위 사실 유포, 개인정보 노출 글은 예고 없이 가려질 수 있습니다.',
      '같은 내용을 반복해서 올리거나 여러 계정으로 투표를 조작하면 이용이 제한됩니다.',
    ],
  },
  privacy: {
    title: '개인정보처리방침',
    body: [
      '수집 항목: 닉네임, 소셜 로그인 식별값, 연령대, 정치 성향(본인 선택), 접속 국가(IP 기반).',
      '접속 국가는 외부 개입을 막기 위해 프로필에 공개되며, IP 주소 자체는 저장·공개하지 않습니다.',
      '정치 성향은 민감정보이므로 본인 동의를 받아 처리하며, 언제든 수정·삭제할 수 있습니다.',
    ],
  },
  contact: {
    title: '문의하기',
    body: [
      '서비스 이용 문의와 신고는 아래 메일로 보내 주세요.',
      'help@junggae.example (데모용 주소 — 실제 운영 주소로 바꿔 주세요)',
    ],
  },
};
