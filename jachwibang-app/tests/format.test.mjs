import assert from 'node:assert/strict';
import { test } from 'node:test';

import { passwordProblem, nicknameProblem } from '../src/lib/account-rules.ts';
import { addDays, timeAgo } from '../src/lib/dates.ts';
import { formatAmountInput, formatShortWon, formatWon, parseAmount } from '../src/lib/format.ts';

test('금액 입력: 숫자만 남기고 9자리까지만', () => {
  assert.equal(parseAmount('12,000원'), 12000);
  assert.equal(parseAmount(''), 0);
  assert.equal(parseAmount('12345678901'), 123456789); // DB int 범위 넘지 않게
  assert.equal(formatAmountInput('1234567'), '1,234,567');
  assert.equal(formatAmountInput('abc'), '');
});

test('금액 표시', () => {
  assert.equal(formatWon(670500), '₩670,500');
  assert.equal(formatShortWon(8000), '8천');
  assert.equal(formatShortWon(12500), '1.3만');
  assert.equal(formatShortWon(450000), '45만');
  assert.equal(formatShortWon(1234567), '123만');
  assert.equal(formatShortWon(500), '500');
});

test('날짜 더하기: 달·윤년 넘어가기', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('몇 분 전 표시', () => {
  const now = new Date('2026-11-10T12:00:00');
  assert.equal(timeAgo('2026-11-10T11:59:30', now), '방금');
  assert.equal(timeAgo('2026-11-10T11:55:00', now), '5분 전');
  assert.equal(timeAgo('2026-11-10T09:00:00', now), '3시간 전');
  assert.equal(timeAgo('2026-11-08T12:00:00', now), '2일 전');
  assert.equal(timeAgo('2026-10-01T12:00:00', now), '10월 1일');
  assert.equal(timeAgo('2025-10-01T12:00:00', now), '2025년 10월 1일');
});

test('가입 규칙: 비밀번호 8자+특수문자, 닉네임 2~12자', () => {
  assert.notEqual(passwordProblem('abc!'), null);
  assert.notEqual(passwordProblem('abcdefgh'), null);
  assert.equal(passwordProblem('abcdefg!'), null);
  assert.notEqual(nicknameProblem(' a '), null);
  assert.equal(nicknameProblem('자취생'), null);
  assert.notEqual(nicknameProblem('가'.repeat(13)), null);
});
