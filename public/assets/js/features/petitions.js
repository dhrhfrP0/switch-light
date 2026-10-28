/* =====================================================================
   정책 참여 — 국회 국민동의청원을 있는 그대로 보여준다 (의견·평가를 덧붙이지 않음)
   /api/petitions 를 1분마다 다시 불러 동의 수를 갱신한다.
   연동이 안 되면(로컬 미리보기·API 키 미설정) 예시 데이터를 "예시" 표시와 함께 보여준다.
   ===================================================================== */
import { PETITION_GOAL, PETITION_HOME, PETITION_POLL_MS } from '../config.js';
import { fetchJson, daysUntil } from '../utils.js';
import { SAMPLE_PETITIONS } from '../seed.js';

export function petitionsFeature() {
  return {
    petitionGoal: PETITION_GOAL,
    petitionHome: PETITION_HOME,
    petitions: {
      items: [],
      source: 'idle',  // idle | live | sample
      loading: false,
      fetchedAt: null,
      reason: '',
      sort: 'agree',   // agree(동의 많은 순) | latest(최신순) | ending(마감 임박순)
      expanded: {},
      bumped: {},      // 동의 수가 막 바뀐 청원 — 잠깐 강조
    },
    petitionTimer: null,

    /** 화면이 "정책 참여"일 때만 1분마다 갱신 (다른 화면이거나 탭이 숨겨지면 쉼) */
    onPetitionRoute(route) {
      clearInterval(this.petitionTimer);
      this.petitionTimer = null;
      if (route !== 'participate') return;
      this.loadPetitions();
      this.petitionTimer = setInterval(() => {
        if (!document.hidden) this.loadPetitions();
      }, PETITION_POLL_MS);
    },

    async loadPetitions() {
      const st = this.petitions;
      st.loading = true;
      try {
        const data = await fetchJson('/api/petitions', { timeoutMs: 15000 });
        if (data.source !== 'live' || !data.items?.length) throw new Error(data.reason || '청원 자료를 받지 못했어요.');
        this.markBumped(data.items);
        Object.assign(st, { items: data.items, source: 'live', fetchedAt: Date.parse(data.fetchedAt) || Date.now(), reason: '' });
      } catch (err) {
        // 실시간 자료를 한 번이라도 받았다면 그대로 두고, 아니면 예시를 보여준다
        if (st.source !== 'live') {
          Object.assign(st, { items: SAMPLE_PETITIONS, source: 'sample', fetchedAt: Date.now(), reason: err.message });
        }
      } finally {
        st.loading = false;
      }
    },

    /** 이전보다 동의 수가 바뀐 청원을 1초 동안 강조 */
    markBumped(nextItems) {
      const prev = new Map(this.petitions.items.map((p) => [p.id, p.agreeCount]));
      for (const p of nextItems) {
        if (prev.has(p.id) && prev.get(p.id) !== p.agreeCount) {
          this.petitions.bumped[p.id] = true;
          setTimeout(() => { this.petitions.bumped[p.id] = false; }, 1000);
        }
      }
    },

    get sortedPetitions() {
      const list = [...this.petitions.items];
      const sort = this.petitions.sort;
      if (sort === 'agree') return list.sort((a, b) => b.agreeCount - a.agreeCount);
      if (sort === 'latest') return list.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
      // 마감 임박순: 아직 안 끝난 것 중 남은 날이 적은 순, 날짜 없는 건 뒤로
      const left = (p) => {
        const d = daysUntil(p.endDate, this.now);
        return d === null || d < 0 ? Infinity : d;
      };
      return list.sort((a, b) => left(a) - left(b));
    },

    petitionProgress(p) {
      return Math.min(100, Math.round((p.agreeCount / PETITION_GOAL) * 100));
    },
    togglePetition(id) {
      this.petitions.expanded[id] = !this.petitions.expanded[id];
    },
  };
}
