// 시간 계산 도우미 테스트 — 정치싸움판 열림 여부는 기기 시간대와 상관없이 한국 시간 기준이어야 한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { battleState, formatHMS, daysUntil, flagEmoji } from '../public/assets/js/utils.js';
import { BATTLE_SLOTS } from '../public/assets/js/config.js';

/** 한국 시간 "YYYY-MM-DD HH:MM" → UTC 밀리초 */
const kst = (s) => Date.parse(`${s.replace(' ', 'T')}:00+09:00`);

test('오전 9시 정각에 열리고 12시 정각에 닫힌다', () => {
  assert.equal(battleState(kst('2026-10-28 08:59'), BATTLE_SLOTS).open, false);
  const open = battleState(kst('2026-10-28 09:00'), BATTLE_SLOTS);
  assert.equal(open.open, true);
  assert.equal(open.slot.label, '오전');
  assert.equal(formatHMS(open.msLeft), '03:00:00');
  assert.equal(battleState(kst('2026-10-28 12:00'), BATTLE_SLOTS).open, false);
});

test('닫혀 있으면 다음 열림까지 남은 시간을 준다', () => {
  const noon = battleState(kst('2026-10-28 12:30'), BATTLE_SLOTS);
  assert.equal(noon.next.start, 18);
  assert.equal(formatHMS(noon.msLeft), '05:30:00');
  // 밤 10시 → 다음 날 오전 9시
  const night = battleState(kst('2026-10-28 22:00'), BATTLE_SLOTS);
  assert.equal(night.next.start, 9);
  assert.equal(formatHMS(night.msLeft), '11:00:00');
});

test('오후 6–9시도 열린다', () => {
  assert.equal(battleState(kst('2026-10-28 20:59'), BATTLE_SLOTS).open, true);
  assert.equal(battleState(kst('2026-10-28 21:00'), BATTLE_SLOTS).open, false);
});

test('마감일까지 남은 날 (한국 날짜 기준)', () => {
  const now = kst('2026-10-28 23:30');
  assert.equal(daysUntil('2026-10-28', now), 0);
  assert.equal(daysUntil('20261031', now), 3);
  assert.equal(daysUntil('2026.10.27', now), -1);
  assert.equal(daysUntil('', now), null);
});

test('국가 코드 → 국기', () => {
  assert.equal(flagEmoji('KR'), '🇰🇷');
  assert.equal(flagEmoji('xx'), '🌐');
});
