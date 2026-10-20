import type { Member, Payment } from "./types";

/** যোগদানের মাস থেকে upToKey ("2026-10") পর্যন্ত মোট কত মাস (দুই প্রান্ত সহ) */
export function monthsExpected(joinedOn: string, upToKey: string): number {
  const [jy, jm] = joinedOn.slice(0, 7).split("-").map(Number);
  const [ty, tm] = upToKey.split("-").map(Number);
  return Math.max((ty - jy) * 12 + (tm - jm) + 1, 0);
}

export type DueInfo = { expected: number; paid: number; due: number; amount: number };

export function dueFor(member: Member, payments: Payment[], upToKey: string): DueInfo {
  const joinKey = member.joined_on.slice(0, 7);
  const expected = monthsExpected(member.joined_on, upToKey);
  const paid = payments.filter(
    (p) => p.member_id === member.id && p.month.slice(0, 7) >= joinKey && p.month.slice(0, 7) <= upToKey,
  ).length;
  const due = Math.max(expected - paid, 0);
  return { expected, paid, due, amount: due * member.monthly_fee };
}
