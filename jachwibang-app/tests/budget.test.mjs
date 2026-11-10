// 가계부 계산 테스트. 실행: npm test  (Node 내장 테스트 러너, 설치할 것 없음)
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sumForMonth } from '../src/lib/budget-math.ts';

const e = (spent_on, amount, is_income = false) => ({ spent_on, amount, is_income });
const list = [
  e('2026-11-01', 450000),
  e('2026-11-01', 300000, true),
  e('2026-11-09', 15900),
  e('2026-11-20', 8000),
  e('2026-10-31', 54000),
  e('2026-01-11', 1000),
];

test('그 달의 지출만 더한다 (수입·다른 달 제외)', () => {
  assert.equal(sumForMonth(list, '2026-11'), 450000 + 15900 + 8000);
});

test('income: true면 수입만 더한다', () => {
  assert.equal(sumForMonth(list, '2026-11', undefined, true), 300000);
});

test('uptoDay까지만 더한다 (지난달 같은 날짜까지 비교용)', () => {
  assert.equal(sumForMonth(list, '2026-11', 10), 450000 + 15900);
});

test('"2026-1"처럼 접두어가 겹치는 달은 섞이지 않는다', () => {
  assert.equal(sumForMonth(list, '2026-01'), 1000);
});

test('기록이 없으면 0', () => {
  assert.equal(sumForMonth([], '2026-11'), 0);
});
