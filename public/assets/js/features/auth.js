/* =====================================================================
   회원 기능 — 가입(2단계)·로그인·프로필, IP 기반 국적 감지
   ※ 데모라서 회원 정보는 이 브라우저(localStorage)에만 저장된다.
     실서비스에서는 국적·연령대를 반드시 서버에서 확인해야 한다 (사용자가 바꿀 수 없게).
   ===================================================================== */
import { LEANINGS, GENERATIONS, AVATARS, COUNTRY_NAMES, HOME_COUNTRY, SCORE_BADGES } from '../config.js';
import { storage, flagEmoji, fetchJson } from '../utils.js';

const PROFILE_KEY = 'jg_profile_v2';
const DEV_COUNTRY_KEY = 'jg_dev_country';
const PROVIDER_NAMES = { kakao: '카카오', naver: '네이버', google: '구글', email: '이메일' };

const guestProfile = () => ({
  loggedIn: false,
  nickname: '손님',
  avatar: AVATARS[0],
  leaning: 'center',
  generation: 'youth',
  countryCode: HOME_COUNTRY,
  joinedAt: null,
  score: 0,
  provider: null,
  showBadges: false, // true 면 투표 전에도 글쓴이 성향 배지를 바로 본다
});

export function authFeature() {
  return {
    leanings: LEANINGS,
    generations: GENERATIONS,
    avatars: AVATARS,
    countryNames: COUNTRY_NAMES,
    profile: guestProfile(),
    detected: { countryCode: HOME_COUNTRY, source: '기본값' },
    devCountry: '',
    login: { open: false, step: 1, provider: null, email: '', password: '', error: '', draft: {} },
    profileForm: { nickname: '', avatar: '', leaning: '', showBadges: false },

    async initAuth() {
      storage.remove('jg_profile'); // 이전 버전 저장값 정리
      const saved = storage.get(PROFILE_KEY);
      if (saved?.loggedIn) Object.assign(this.profile, saved);
      this.devCountry = storage.get(DEV_COUNTRY_KEY, '') || '';
      await this.detectCountry();
    },

    /**
     * 접속 국가 감지 — 국적은 항상 IP 기준이며 회원이 직접 고칠 수 없다.
     * 1) 개발자 모드 흉내값 → 2) Vercel 서버 헤더(/api/geo) → 3) ipapi.co → 4) 기본값 대한민국
     */
    async detectCountry() {
      let code = null;
      let source = '기본값';
      if (this.devCountry) {
        code = this.devCountry;
        source = '개발자 모드';
      }
      if (!code) {
        try {
          code = (await fetchJson('/api/geo', { timeoutMs: 4000 })).country_code;
          if (code) source = '서버 IP 확인';
        } catch { /* 로컬 미리보기 등 — 다음 방법으로 */ }
      }
      if (!code) {
        try {
          code = (await fetchJson('https://ipapi.co/json/', { timeoutMs: 5000 })).country_code;
          if (code) source = 'ipapi.co';
        } catch { /* 감지 실패 — 기본값 사용 */ }
      }
      code = /^[A-Z]{2}$/.test(code || '') ? code : HOME_COUNTRY;
      this.detected = { countryCode: code, source };
      this.profile.countryCode = code;
      if (this.profile.loggedIn) this.saveProfile();
    },

    /** 개발자 모드: 다른 나라에서 접속한 것처럼 흉내 ('' 이면 실제 IP로) */
    async simulateCountry(code) {
      this.devCountry = code;
      if (code) storage.set(DEV_COUNTRY_KEY, code);
      else storage.remove(DEV_COUNTRY_KEY);
      await this.detectCountry();
      this.toast(code ? `${this.country(code).flag} ${this.country(code).name} 접속으로 흉내 내는 중이에요.` : '실제 접속 위치로 되돌렸어요.');
    },

    /* ---------- 표시용 조회 ---------- */
    leaning(key) {
      return LEANINGS.find((l) => l.key === key) ?? LEANINGS[2];
    },
    generation(key) {
      return GENERATIONS.find((g) => g.key === key) ?? GENERATIONS[0];
    },
    country(code) {
      return {
        code,
        name: COUNTRY_NAMES[code] ?? `기타 국가 (${code})`,
        flag: flagEmoji(code),
        foreign: this.isForeign(code),
      };
    },
    isForeign(code) {
      return Boolean(code) && code !== HOME_COUNTRY;
    },
    providerName(key) {
      return PROVIDER_NAMES[key] ?? '';
    },
    earnedBadges(score) {
      return SCORE_BADGES.filter((b) => score >= b.min);
    },

    /** 로그인한 나를 다른 회원과 같은 모양으로 */
    get meUser() {
      const p = this.profile;
      return {
        id: 'me', nickname: p.nickname, avatar: p.avatar, leaning: p.leaning,
        generation: p.generation, countryCode: p.countryCode, score: p.score, joinedAt: p.joinedAt,
      };
    },

    /** 로그인이 필요한 동작 앞에서 호출 — 로그인 안 했으면 로그인 창을 띄우고 false */
    requireLogin(action = '이 기능') {
      if (this.profile.loggedIn) return true;
      this.toast(`${action}은(는) 로그인 후 이용할 수 있어요.`);
      this.openLogin();
      return false;
    },

    /* ---------- 가입·로그인 (2단계) ---------- */
    openLogin() {
      this.login = {
        open: true, step: 1, provider: null, email: '', password: '', error: '',
        draft: { nickname: '', leaning: '', generation: '' },
      };
    },

    /** 1단계-가: 소셜 로그인 (데모 — 연령대는 소셜 계정 정보를 받은 것처럼 흉내) */
    socialLogin(provider) {
      const keys = GENERATIONS.map((g) => g.key);
      this.login.provider = provider;
      this.login.draft = {
        nickname: '',
        leaning: '',
        generation: keys[Math.floor(Math.random() * keys.length)],
      };
      this.login.step = 2;
    },

    /** 1단계-나: 이메일 가입 — 기본 정보 확인 */
    emailNext() {
      const { email, password, draft } = this.login;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (this.login.error = '이메일 주소를 다시 확인해 주세요.');
      if (password.length < 8) return (this.login.error = '비밀번호는 8자 이상으로 정해 주세요.');
      if (!this.validNickname(draft.nickname)) return (this.login.error = '닉네임은 2~12자로 정해 주세요.');
      this.login.error = '';
      this.login.provider = 'email';
      this.login.step = 2;
    },

    validNickname(name) {
      const n = (name || '').trim();
      return n.length >= 2 && n.length <= 12;
    },

    /** 2단계: 정치 성향(필수) + 연령대 + 국적 확인 → 가입 완료 */
    completeSignup() {
      const d = this.login.draft;
      if (!d.leaning) return (this.login.error = '정치 성향을 골라 주세요.');
      if (!d.generation) return (this.login.error = '연령대를 골라 주세요.');
      const nickname = this.validNickname(d.nickname)
        ? d.nickname.trim()
        : `광장친구${Math.floor(1000 + Math.random() * 9000)}`;
      Object.assign(this.profile, {
        loggedIn: true,
        nickname,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        leaning: d.leaning,
        generation: d.generation,
        countryCode: this.detected.countryCode,
        joinedAt: Date.now(),
        score: 0,
        provider: this.login.provider,
        showBadges: false,
      });
      this.saveProfile();
      this.login.open = false;
      this.toast(`${nickname}님, 중개광장에 오신 걸 환영해요!`, 'success');
    },

    logout() {
      if (!confirm('로그아웃할까요?')) return;
      const { countryCode } = this.profile;
      this.profile = { ...guestProfile(), countryCode };
      storage.remove(PROFILE_KEY);
      this.goto('home');
      this.toast('로그아웃했어요.');
    },

    saveProfile() {
      storage.set(PROFILE_KEY, this.profile);
    },

    /* ---------- 프로필 편집 (편집용 사본 → 저장 시 반영) ---------- */
    loadProfileForm() {
      const { nickname, avatar, leaning, showBadges } = this.profile;
      this.profileForm = { nickname, avatar, leaning, showBadges };
    },
    submitProfileForm() {
      if (!this.validNickname(this.profileForm.nickname)) {
        this.toast('닉네임은 2~12자로 정해 주세요.', 'error');
        return;
      }
      Object.assign(this.profile, { ...this.profileForm, nickname: this.profileForm.nickname.trim() });
      this.saveProfile();
      this.toast('프로필을 저장했어요.', 'success');
    },

    /** 중개인 점수 더하기 — 'me' 면 내 프로필, 아니면 해당 회원 */
    addScore(userId, delta) {
      if (userId === 'me') {
        this.profile.score = Math.max(0, this.profile.score + delta);
        this.saveProfile();
      } else if (this.users[userId]) {
        this.users[userId].score = Math.max(0, this.users[userId].score + delta);
      }
    },
  };
}
