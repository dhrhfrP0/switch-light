/* =====================================================================
   게시판 기능 — 보수마당·진보마당·자유광장·정치싸움판·검색이 함께 쓰는 글 목록
   - 투표(동의/반대/이해)는 글 하나당 한 번 (다시 누르면 취소, 다른 걸 누르면 바뀜)
   - 글쓴이 정치 성향은 투표한 뒤에 공개 (편견 없이 읽게 하기 위함)
   - "이해"·"상대 의견 인정"을 누르거나 받으면 중개인 점수 +1
   ===================================================================== */
import { BOARDS, TAGS, TAG_HINTS } from '../config.js';
import { storage, uid } from '../utils.js';
import { seedUsers, seedPosts } from '../seed.js';

const BOARD_KEY = 'jg_board_v2';
const UNKNOWN_USER = { id: 'unknown', nickname: '탈퇴한 회원', avatar: '👤', leaning: 'center', generation: 'youth', countryCode: 'KR', score: 0 };
const LIMITS = { title: 80, content: 3000, comment: 500, tags: 5 };

export function boardFeature() {
  return {
    boards: BOARDS,
    tags: TAGS,
    limits: LIMITS,
    users: {},
    posts: [],
    myVotes: {},   // { 글id: 'agree' | 'disagree' | 'understand' }
    myAcks: {},    // { 댓글id: true }
    revealed: {},  // { 글id: true } — 투표해서 성향 배지가 공개된 글
    genFilter: 'all',
    activeTags: [],
    searchInput: '',
    searchQuery: '',
    postModal: { open: false, postId: null, comment: '' },
    writer: { open: false, zone: 'plaza', title: '', content: '', tags: [], origin: null },

    initBoard() {
      storage.remove('jg_guide_shown'); // 이전 버전 저장값 정리
      const saved = storage.get(BOARD_KEY);
      if (saved?.version === 2) {
        Object.assign(this, {
          users: saved.users, posts: saved.posts, myVotes: saved.myVotes ?? {},
          myAcks: saved.myAcks ?? {}, revealed: saved.revealed ?? {},
        });
      } else {
        this.users = seedUsers();
        this.posts = seedPosts();
      }
    },

    persistBoard() {
      const { users, posts, myVotes, myAcks, revealed } = this;
      storage.set(BOARD_KEY, { version: 2, users, posts, myVotes, myAcks, revealed });
    },

    /* ---------- 지금 화면의 게시판 ---------- */
    get board() {
      return this.boards[this.route] ?? null;
    },

    /** 현재 게시판에 보일 글 (최신순) */
    get boardPosts() {
      if (this.route === 'search') return this.searchResults;
      const { board } = this;
      if (!board) return [];
      let list = this.posts.filter((p) => p.zone === this.route);
      if (board.byGeneration && this.genFilter !== 'all') list = list.filter((p) => p.generation === this.genFilter);
      if (board.byTags && this.activeTags.length) list = list.filter((p) => p.tags.some((t) => this.activeTags.includes(t)));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    },

    get searchResults() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return [];
      return this.posts
        .filter((p) => `${p.title} ${p.content} ${p.tags.join(' ')}`.toLowerCase().includes(q))
        .sort((a, b) => b.createdAt - a.createdAt);
    },

    /** 세대 탭 옆 글 수 */
    genCount(genKey) {
      return this.posts.filter((p) => p.zone === this.route && (genKey === 'all' || p.generation === genKey)).length;
    },

    /** 반응 점수 — 투표 합 + 댓글 가중치 */
    engagement(p) {
      return p.votes.agree + p.votes.disagree + p.votes.understand + p.comments.length * 5;
    },
    byEngagement(list) {
      return [...list].sort((a, b) => this.engagement(b) - this.engagement(a));
    },

    /** 홈: 오늘의 핫 토픽 3개 (자유광장 글만) */
    get hotTopics() {
      return this.byEngagement(this.posts.filter((p) => p.zone === 'plaza')).slice(0, 3);
    },
    /** 홈: 실시간 인기 토론 5개 (전체) */
    get ranking() {
      return this.byEngagement(this.posts).slice(0, 5);
    },
    /** 홈: 세대별 핫이슈 — 세대 마당에서 반응이 가장 큰 글 */
    get generationHot() {
      return this.generations.map((g) => ({
        gen: g,
        post: this.byEngagement(this.posts.filter((p) => p.generation === g.key))[0] ?? null,
      }));
    },
    get myPosts() {
      return this.posts.filter((p) => p.authorId === 'me').sort((a, b) => b.createdAt - a.createdAt);
    },

    /* ---------- 글쓴이 표시 ---------- */
    author(id) {
      return id === 'me' ? this.meUser : (this.users[id] ?? UNKNOWN_USER);
    },
    /** 템플릿용: 글쓴이 + 성향·세대·국적 정보를 한 번에 */
    authorView(id) {
      const u = this.author(id);
      return { ...u, lean: this.leaning(u.leaning), gen: this.generation(u.generation), nation: this.country(u.countryCode) };
    },
    isMine(p) {
      return p.authorId === 'me' && this.profile.loggedIn;
    },
    /** 성향 배지 공개 여부: 내 글이거나, 투표했거나, "바로 보기" 설정을 켠 경우 */
    isRevealed(p) {
      return this.profile.showBadges || this.isMine(p) || Boolean(this.revealed[p.id]);
    },
    zoneLabel(p) {
      const title = this.boards[p.zone]?.title ?? '';
      return p.generation ? `${title} · ${this.generation(p.generation).label}` : title;
    },

    /* ---------- 상세 보기 ---------- */
    get currentPost() {
      return this.posts.find((p) => p.id === this.postModal.postId) ?? null;
    },
    openPost(id) {
      this.postModal = { open: true, postId: id, comment: '' };
    },

    /* ---------- 투표 ---------- */
    vote(p, kind) {
      if (!this.requireLogin('투표')) return;
      if (this.isMine(p)) return this.toast('내 글에는 투표할 수 없어요.');
      if (p.zone === 'battle' && !this.battle.open) return this.toast('정치싸움판이 닫혀 있어요.');

      const prev = this.myVotes[p.id];
      if (prev) {
        p.votes[prev] = Math.max(0, p.votes[prev] - 1);
        if (prev === 'understand') this.giveUnderstand(p.authorId, -1);
      }
      if (prev === kind) {
        delete this.myVotes[p.id]; // 같은 버튼을 다시 누르면 취소
      } else {
        p.votes[kind] += 1;
        this.myVotes[p.id] = kind;
        if (kind === 'understand') {
          this.giveUnderstand(p.authorId, 1);
          this.toast('🤝 "이해"를 눌렀어요. 중개인 점수 +1', 'success');
        }
      }
      this.revealed[p.id] = true;
      this.persistBoard();
    },

    /** "이해"를 주고받으면 누른 사람·받은 사람 모두 중개인 점수 ±1 */
    giveUnderstand(receiverId, delta) {
      this.addScore('me', delta);
      this.addScore(receiverId, delta);
    },

    /* ---------- 댓글 ---------- */
    addComment() {
      const p = this.currentPost;
      if (!p || !this.requireLogin('댓글 쓰기')) return;
      if (p.zone === 'battle' && !this.battle.open) return this.toast('정치싸움판이 닫혀 있어요.');
      const text = this.postModal.comment.trim().slice(0, LIMITS.comment);
      if (!text) return;
      p.comments.push({ id: uid('c'), authorId: 'me', text, acks: 0, createdAt: Date.now() });
      this.postModal.comment = '';
      this.persistBoard();
    },

    /** 댓글 "상대 의견 인정" — 댓글 하나당 한 번 */
    ackComment(c) {
      if (!this.requireLogin('의견 인정')) return;
      if (c.authorId === 'me') return this.toast('내 댓글은 인정할 수 없어요.');
      if (this.myAcks[c.id]) return this.toast('이미 인정한 의견이에요.');
      c.acks += 1;
      this.myAcks[c.id] = true;
      this.giveUnderstand(c.authorId, 1);
      this.toast('🤝 상대 의견을 인정했어요. 중개인 점수 +1', 'success');
      this.persistBoard();
    },

    deletePost(p) {
      if (!this.isMine(p) || !confirm('이 글을 지울까요? 되돌릴 수 없어요.')) return;
      this.posts = this.posts.filter((x) => x.id !== p.id);
      this.postModal.open = false;
      this.persistBoard();
      this.toast('글을 지웠어요.');
    },

    /* ---------- 글쓰기 ---------- */
    /** 글을 쓸 수 없는 이유 (쓸 수 있으면 빈 문자열) */
    writeBlockReason(zone = this.route) {
      const board = this.boards[zone];
      if (!board || board.readOnly) return '이 화면에서는 글을 쓸 수 없어요.';
      if (board.timeLocked && !this.battle.open) return '정치싸움판이 열리는 시간에만 글을 쓸 수 있어요.';
      if (board.byGeneration && this.profile.loggedIn && this.genFilter !== 'all' && this.genFilter !== this.profile.generation) {
        return '본인 세대 공간입니다. 다른 세대 의견은 자유광장에서 확인하세요.';
      }
      return '';
    },

    newPost(zone = this.route) {
      if (!this.requireLogin('글쓰기')) return;
      const reason = this.writeBlockReason(zone);
      if (reason) return this.toast(reason);
      this.writer = { open: true, zone, title: '', content: '', tags: [], origin: null };
    },

    /** 세대 마당 글을 자유광장에 "○○ 세대 관점"으로 공유 (원문 연결) */
    crossPost(p) {
      if (!p.generation || !this.requireLogin('자유광장 공유')) return;
      const view = `${this.generation(p.generation).label.replace(/층$/, '')} 세대 관점`;
      this.postModal.open = false;
      this.writer = {
        open: true,
        zone: 'plaza',
        title: `[${view}] ${p.title}`.slice(0, LIMITS.title),
        content: '',
        tags: [view, ...p.tags.filter((t) => TAGS.includes(t))].slice(0, LIMITS.tags),
        origin: { postId: p.id, zone: p.zone, generation: p.generation },
      };
    },

    /** 제목·본문 낱말로 태그 자동 추천 */
    get suggestedTags() {
      const text = `${this.writer.title} ${this.writer.content}`;
      const found = new Set();
      for (const [word, tag] of Object.entries(TAG_HINTS)) {
        if (text.includes(word) && !this.writer.tags.includes(tag)) found.add(tag);
      }
      return [...found].slice(0, 4);
    },

    toggleWriterTag(tag) {
      const tags = this.writer.tags;
      if (tags.includes(tag)) this.writer.tags = tags.filter((t) => t !== tag);
      else if (tags.length < LIMITS.tags) tags.push(tag);
      else this.toast(`태그는 ${LIMITS.tags}개까지 달 수 있어요.`);
    },

    submitPost() {
      const w = this.writer;
      const title = w.title.trim();
      const content = w.content.trim();
      if (title.length < 2) return this.toast('제목을 2자 이상 적어 주세요.', 'error');
      if (content.length < 5) return this.toast('내용을 5자 이상 적어 주세요.', 'error');
      const reason = this.writeBlockReason(w.zone);
      if (reason) return this.toast(reason, 'error');

      const board = this.boards[w.zone];
      this.posts.unshift({
        id: uid('p'),
        zone: w.zone,
        generation: board.byGeneration ? this.profile.generation : null,
        authorId: 'me',
        createdAt: Date.now(),
        title: title.slice(0, LIMITS.title),
        content: content.slice(0, LIMITS.content),
        tags: [...w.tags],
        origin: w.origin,
        votes: { agree: 0, disagree: 0, understand: 0 },
        comments: [],
      });
      this.writer.open = false;
      this.persistBoard();
      if (w.zone !== this.route) this.goto(w.zone);
      this.toast('글을 올렸어요.', 'success');
    },

    /* ---------- 필터·검색 ---------- */
    toggleTag(tag) {
      this.activeTags = this.activeTags.includes(tag)
        ? this.activeTags.filter((t) => t !== tag)
        : [...this.activeTags, tag];
    },
    runSearch() {
      const q = this.searchInput.trim();
      if (!q) return this.toast('찾을 낱말을 적어 주세요.');
      this.searchQuery = q;
      this.searchOpen = false;
      this.goto('search');
    },
  };
}
