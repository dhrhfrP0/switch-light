/* =====================================================================
   정책·법 소식 — 국회 입법예고·정부 정책 자료의 "원문"과 "AI 요약"을 나란히 보여준다
   요약은 서버(/api/policy-news)에서 의견 없이 만들고, 화면은 그대로 보여주기만 한다.
   ===================================================================== */
import { fetchJson } from '../utils.js';
import { SAMPLE_NEWS } from '../seed.js';

export function newsFeature() {
  return {
    news: {
      items: [],
      source: 'idle', // idle | live | sample
      loading: false,
      loaded: false,
      ai: '',         // ok | disabled | error — 요약 상태
      reason: '',
      fetchedAt: null,
      filter: 'all',  // all | bill | policy
      expanded: {},
    },
    newsKinds: [
      { key: 'all', label: '전체' },
      { key: 'bill', label: '국회 입법예고' },
      { key: 'policy', label: '정부 정책' },
    ],

    onNewsRoute(route) {
      if (route === 'news' && !this.news.loaded) this.loadNews();
    },

    async loadNews() {
      const st = this.news;
      st.loading = true;
      try {
        // 서버 캐시가 비어 있으면 AI 요약을 새로 만드느라 시간이 걸릴 수 있다
        const data = await fetchJson('/api/policy-news', { timeoutMs: 70000 });
        if (data.source !== 'live' || !data.items?.length) throw new Error(data.reason || '소식을 받지 못했어요.');
        Object.assign(st, {
          items: data.items, source: 'live', ai: data.ai, reason: data.aiReason || '',
          fetchedAt: Date.parse(data.fetchedAt) || Date.now(),
        });
      } catch (err) {
        if (st.source !== 'live') {
          Object.assign(st, { items: SAMPLE_NEWS, source: 'sample', ai: 'sample', reason: err.message, fetchedAt: Date.now() });
        }
      } finally {
        st.loading = false;
        st.loaded = true;
      }
    },

    get filteredNews() {
      const f = this.news.filter;
      return f === 'all' ? this.news.items : this.news.items.filter((n) => n.kind === f);
    },

    toggleNews(id) {
      this.news.expanded[id] = !this.news.expanded[id];
    },
  };
}
