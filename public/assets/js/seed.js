/* =====================================================================
   중개광장 — 데모용 데이터
   - 회원 5명 (세대·국적·성향을 고르게) + 게시물 10개
   - 청원·정책 소식 "예시" 데이터: 실제 연동이 안 될 때만 쓰며, 화면에 예시임을 표시한다
   ===================================================================== */

const MIN = 60 * 1000;

/** 가짜 회원 — id 로 게시물·댓글과 연결된다 */
export function seedUsers(now = Date.now()) {
  return {
    u1: { id: 'u1', nickname: '광장지킴이', avatar: '🐻', leaning: 'center',    generation: 'middle', countryCode: 'KR', score: 142, joinedAt: now - 420 * 24 * 60 * MIN },
    u2: { id: 'u2', nickname: '청년의외침', avatar: '🦊', leaning: 'left',      generation: 'youth',  countryCode: 'KR', score: 87,  joinedAt: now - 200 * 24 * 60 * MIN },
    u3: { id: 'u3', nickname: '전직공무원', avatar: '🦁', leaning: 'right',     generation: 'senior', countryCode: 'KR', score: 211, joinedAt: now - 610 * 24 * 60 * MIN },
    u4: { id: 'u4', nickname: '미국유학생', avatar: '🐯', leaning: 'far_left',  generation: 'youth',  countryCode: 'US', score: 34,  joinedAt: now - 90 * 24 * 60 * MIN },
    u5: { id: 'u5', nickname: '해외근무자', avatar: '🐼', leaning: 'far_right', generation: 'middle', countryCode: 'CN', score: 9,   joinedAt: now - 30 * 24 * 60 * MIN },
  };
}

/** 게시물 10개 — zone: plaza | conservative | progressive | battle, generation: 세대 마당 글만 */
export function seedPosts(now = Date.now()) {
  const ago = (m) => now - m * MIN;
  return [
    {
      id: 'p1', zone: 'plaza', generation: null, authorId: 'u2', createdAt: ago(60),
      title: '세대 간 연금 논쟁, 결국 누구의 책임일까요?',
      content: '20대로서 앞 세대가 만든 제도를 고스란히 떠안는 게 불공평하다고 느껴요.\n하지만 부모님 세대 이야기를 들으면 또 사정이 다르더군요. 여러분 생각은 어떠세요?',
      tags: ['연금', '세대대립', '정책'],
      votes: { agree: 84, disagree: 31, understand: 62 },
      comments: [
        { id: 'c1', authorId: 'u3', text: '우리 때는 우리 때대로 어려웠어요. 그래도 젊은 사람들 걱정은 이해합니다.', acks: 14, createdAt: ago(50) },
        { id: 'c2', authorId: 'u1', text: '양쪽 다 일리가 있습니다. 숫자부터 같이 보고 이야기해 봐요.', acks: 23, createdAt: ago(40) },
      ],
    },
    {
      id: 'p2', zone: 'conservative', generation: 'senior', authorId: 'u3', createdAt: ago(120),
      title: '안보가 흔들리는 시대, 지금 필요한 것',
      content: '평생 이 나라를 위해 일해 온 사람으로서 요즘 안보 상황이 걱정스럽습니다.\n단단한 동맹과 스스로 지키는 힘, 둘 다 필요합니다.',
      tags: ['외교', '보수'],
      votes: { agree: 121, disagree: 18, understand: 34 },
      comments: [
        { id: 'c3', authorId: 'u1', text: '세대가 달라도 안보가 중요하다는 데는 공감합니다.', acks: 9, createdAt: ago(100) },
      ],
    },
    {
      id: 'p3', zone: 'progressive', generation: 'youth', authorId: 'u2', createdAt: ago(180),
      title: '집은 투자 상품이기 전에 사는 곳입니다',
      content: '전세사기와 월세 부담에 시달리는 청년이 너무 많아요.\n주거는 사람이 살아가는 기본 조건이라는 점을 먼저 생각했으면 합니다.',
      tags: ['부동산', '정책'],
      votes: { agree: 97, disagree: 24, understand: 41 },
      comments: [
        { id: 'c4', authorId: 'u4', text: '밖에서 봐도 한국 청년 주거 문제는 정말 심각해 보여요.', acks: 7, createdAt: ago(150) },
      ],
    },
    {
      id: 'p4', zone: 'plaza', generation: null, authorId: 'u1', createdAt: ago(240),
      title: '외교는 보수냐 진보냐가 아니라 나라의 이익입니다',
      content: '미국·중국·일본과의 관계는 진영을 떠나 나라의 이익을 기준으로 봐야 합니다.\n편 가르기 말고 근거로 이야기해 봐요.',
      tags: ['외교', '중립'],
      votes: { agree: 156, disagree: 22, understand: 88 },
      comments: [],
    },
    {
      id: 'p5', zone: 'conservative', generation: 'middle', authorId: 'u5', createdAt: ago(300),
      title: '자녀 세대를 위해 보수가 먼저 해야 할 일',
      content: '40대 가장으로서 청년 세대의 어려움을 외면하면 안 된다고 생각합니다.\n보수도 다음 세대에 대한 책임이 있습니다.',
      tags: ['세대대립', '정책'],
      votes: { agree: 73, disagree: 11, understand: 58 },
      comments: [],
    },
    {
      id: 'p6', zone: 'progressive', generation: 'youth', authorId: 'u4', createdAt: ago(360),
      title: '기후 위기는 청년에게 생존 문제예요',
      content: '지금 정한 정책의 결과를 가장 오래 겪을 사람은 지금의 청년입니다.\n속도와 비용을 어떻게 나눌지 솔직하게 이야기했으면 해요.',
      tags: ['정책', '세대대립'],
      votes: { agree: 64, disagree: 29, understand: 51 },
      comments: [],
    },
    {
      id: 'p7', zone: 'plaza', generation: null, authorId: 'u3', createdAt: ago(420),
      title: 'AI 시대, 정치는 무엇을 준비해야 할까요?',
      content: '기술은 빨리 바뀌는데 제도는 따라가지 못하는 것 같습니다.\n일자리·교육·복지를 어떻게 다시 짜야 할지 세대별 생각이 궁금합니다.',
      tags: ['정책', '일자리', '교육'],
      votes: { agree: 112, disagree: 14, understand: 73 },
      comments: [],
    },
    {
      id: 'p8', zone: 'progressive', generation: 'middle', authorId: 'u1', createdAt: ago(480),
      title: '복지 확대와 나라 살림, 어떻게 균형을 잡을까요?',
      content: '무조건 늘리자도, 무조건 줄이자도 답은 아니라고 봅니다.\n진보 안에서도 솔직한 토론이 필요해요.',
      tags: ['경제', '정책'],
      votes: { agree: 58, disagree: 7, understand: 44 },
      comments: [],
    },
    {
      id: 'p9', zone: 'battle', generation: null, authorId: 'u1', createdAt: ago(30),
      title: '⚔️ 20대 vs 60대 — 연금, 누가 더 손해인가?',
      content: '청년: "우리는 더 내고 덜 받는다!"\n시니어: "우리는 평생 성실히 냈다!"\n여러분의 입장은 어느 쪽인가요? 근거와 함께 남겨 주세요.',
      tags: ['연금', '세대대립'],
      votes: { agree: 42, disagree: 38, understand: 21 },
      comments: [],
    },
    {
      // 크로스 포스팅 예시: 보수마당 시니어 글(p2)을 자유광장에 "시니어 세대 관점"으로 공유
      id: 'p10', zone: 'plaza', generation: null, authorId: 'u3', createdAt: ago(110),
      title: '[시니어 세대 관점] 안보가 흔들리는 시대, 지금 필요한 것',
      content: '보수마당 시니어 줄에 쓴 글을 다른 세대와도 나누고 싶어 자유광장에 올립니다.\n청년 세대는 안보 문제를 어떻게 보시는지 궁금합니다.',
      tags: ['시니어 세대 관점', '외교'],
      origin: { postId: 'p2', zone: 'conservative', generation: 'senior' },
      votes: { agree: 45, disagree: 9, understand: 39 },
      comments: [],
    },
  ];
}

/** 정치싸움판 오늘 주제 투표·예측 시작값 */
export const SEED_BATTLE = {
  votes: { agree: 142, disagree: 128, understand: 67 },
  predictions: { a: 53, b: 49 },
  genShare: { youth: 38, middle: 27, senior: 35 },
};

/* ---------------------------------------------------------------------
   예시 데이터 — /api 연동이 안 될 때(로컬 미리보기·API 키 미설정)만 사용
   제목에 "(예시)"를 붙이고 화면 상단에도 예시임을 알린다.
   --------------------------------------------------------------------- */
export const SAMPLE_PETITIONS = [
  {
    id: 'sample-1', title: '(예시) 동네 공원 야간 조명 확대에 관한 청원',
    content: '실제 청원이 아닌 화면 예시입니다. 연동이 되면 국회 국민동의청원의 제목과 내용이 이 자리에 그대로 표시됩니다.',
    agreeCount: 41230, status: '동의 진행 중', startDate: '', endDate: '', url: 'https://petitions.assembly.go.kr/',
  },
  {
    id: 'sample-2', title: '(예시) 대중교통 경로 할인 기준 조정에 관한 청원',
    content: '실제 청원이 아닌 화면 예시입니다. 동의 수는 실제 연동 시 1분마다 새로 고쳐집니다.',
    agreeCount: 52870, status: '성립 (위원회 회부)', startDate: '', endDate: '', url: 'https://petitions.assembly.go.kr/',
  },
  {
    id: 'sample-3', title: '(예시) 청년 주거 지원 대상 확대에 관한 청원',
    content: '실제 청원이 아닌 화면 예시입니다. "청원 페이지에서 동의하기" 버튼은 국회 청원 누리집으로 연결됩니다.',
    agreeCount: 18450, status: '동의 진행 중', startDate: '', endDate: '', url: 'https://petitions.assembly.go.kr/',
  },
];

export const SAMPLE_NEWS = [
  {
    id: 'sample-n1', kind: 'bill', source: '국회 입법예고', date: '', deadline: '',
    title: '(예시) ○○법 일부개정법률안',
    meta: ['제안자: (예시) ○○○의원 등 10인', '소관위원회: (예시) ○○위원회'],
    original: '실제 자료가 아닌 화면 예시입니다. 연동이 되면 국회 입법예고 원문(제안이유 및 주요내용)이 이 칸에 그대로 표시됩니다.',
    summary: {
      headline: '(예시) 원문을 의견 없이 짧게 정리한 한 줄',
      points: ['원문에 적힌 사실만 쉬운 말로 옮깁니다.', '찬성·반대 같은 평가는 넣지 않습니다.'],
      changes: '무엇이 바뀌는지 원문 그대로 정리합니다.',
      affected: '누구에게 해당되는지 정리합니다.',
      schedule: '시행 시기·의견 마감일을 정리합니다.',
    },
    url: 'https://pal.assembly.go.kr/', opinionUrl: 'https://pal.assembly.go.kr/',
  },
  {
    id: 'sample-n2', kind: 'policy', source: '정책브리핑', date: '', deadline: '',
    title: '(예시) 정부 정책 보도자료 제목',
    meta: ['발표 기관: (예시) ○○부'],
    original: '실제 자료가 아닌 화면 예시입니다. 연동이 되면 정부 정책브리핑의 보도자료 본문 발췌가 이 칸에 표시됩니다.',
    summary: null,
    url: 'https://www.korea.kr/', opinionUrl: '',
  },
];
