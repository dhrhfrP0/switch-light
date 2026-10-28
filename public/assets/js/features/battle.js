/* =====================================================================
   정치싸움판 — 한국 시간 오전 9–12시, 오후 6–9시에만 열리는 고강도 토론
   1초마다 열림 여부와 남은 시간을 다시 계산한다.
   ===================================================================== */
import { BATTLE_SLOTS, WEEKLY_TOPIC } from '../config.js';
import { battleState, formatHMS, storage } from '../utils.js';
import { SEED_BATTLE } from '../seed.js';

/** 오늘(한국 시간) 날짜 열쇠 — 주제 투표는 하루 단위로 기록 */
const todayKey = () => `jg_battle_${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}`;

export function battleFeature() {
  return {
    battleTopic: WEEKLY_TOPIC,
    battle: {
      open: false,
      msLeft: 0,
      slotLabel: '',
      next: BATTLE_SLOTS[0],
      override: 'auto', // 개발자 모드: auto | open | closed
      participants: 1247,
      votes: { ...SEED_BATTLE.votes },
      predictions: { ...SEED_BATTLE.predictions },
      genShare: { ...SEED_BATTLE.genShare },
      myVote: null,
      myPrediction: null,
    },

    initBattle() {
      const saved = storage.get(todayKey());
      if (saved) Object.assign(this.battle, saved);
      this.tickBattle();
      setInterval(() => this.tickBattle(), 1000);
      // 실시간 참여자 수 흉내 — 열려 있을 때만 조금씩 움직인다
      setInterval(() => {
        if (!this.battle.open) return;
        this.battle.participants = Math.max(800, this.battle.participants + Math.floor(Math.random() * 9) - 3);
      }, 3000);
    },

    tickBattle() {
      const state = battleState(Date.now(), BATTLE_SLOTS);
      const { override } = this.battle;
      this.battle.open = override === 'auto' ? state.open : override === 'open';
      this.battle.msLeft = state.msLeft;
      this.battle.slotLabel = state.slot?.label ?? '';
      this.battle.next = state.next;
    },

    /** 카운트다운 위 작은 글씨 */
    get battleCountdownLabel() {
      if (this.battle.override !== 'auto') return '개발자 모드로 강제 전환됨';
      const { next } = this.battle;
      const hour12 = next.start % 12 || 12; // 18시 → "오후 6시"
      return this.battle.open ? `${this.battle.slotLabel} 격전 종료까지` : `${next.label} ${hour12}시 열림까지`;
    },
    get battleCountdown() {
      return this.battle.override === 'auto' ? formatHMS(this.battle.msLeft) : '--:--:--';
    },

    persistBattle() {
      const { votes, predictions, myVote, myPrediction } = this.battle;
      storage.set(todayKey(), { votes, predictions, myVote, myPrediction });
    },

    /** 오늘 주제 투표 — 동의 / 반대 / 이해 (다시 누르면 취소) */
    battleVote(kind) {
      if (!this.battle.open) return this.toast('정치싸움판이 닫혀 있어요.');
      if (!this.requireLogin('투표')) return;
      const prev = this.battle.myVote;
      if (prev) this.battle.votes[prev] -= 1;
      this.battle.myVote = prev === kind ? null : kind;
      if (this.battle.myVote) this.battle.votes[kind] += 1;
      if (kind === 'understand' && prev !== kind) this.addScore('me', 1);
      if (prev === 'understand') this.addScore('me', -1);
      this.persistBattle();
    },

    /** 승자 예측 — 어느 쪽 주장이 더 공감을 얻을지 */
    predict(side) {
      if (!this.battle.open) return this.toast('정치싸움판이 닫혀 있어요.');
      if (!this.requireLogin('승자 예측')) return;
      const prev = this.battle.myPrediction;
      if (prev === side) return;
      if (prev) this.battle.predictions[prev] -= 1;
      this.battle.predictions[side] += 1;
      this.battle.myPrediction = side;
      this.persistBattle();
      const label = side === 'a' ? this.battleTopic.sideA.label : this.battleTopic.sideB.label;
      this.toast(`🏆 "${label}" 승리를 예측했어요!`, 'success');
    },

    /** 비율(%) — 합이 0이면 0 */
    pct(part, ...all) {
      const total = all.reduce((sum, n) => sum + n, 0);
      return total ? Math.round((part / total) * 100) : 0;
    },
  };
}
