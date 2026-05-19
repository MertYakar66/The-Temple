import { describe, it, expect } from 'vitest';
import { resolveAuthAction, type AuthAction } from './authSession';

/**
 * Table test for the pure auth-transition decision. Exhaustive over the
 * four logical input branches × the intentional-flag variations — this is
 * the cheap, isolated coverage of the Race-B dedup logic.
 * See docs/plans/fix-authcontext-race.md §5.2.
 */
describe('resolveAuthAction', () => {
  const cases: Array<{
    name: string;
    prevUid: string | null;
    nextUid: string | null;
    intentional: boolean;
    expected: AuthAction;
  }> = [
    {
      name: 'first sign-in (no session owned) → establish',
      prevUid: null, nextUid: 'X', intentional: false, expected: 'establish',
    },
    {
      name: 'first sign-in ignores a stale intentional flag → establish',
      prevUid: null, nextUid: 'X', intentional: true, expected: 'establish',
    },
    {
      name: 'same-uid re-fire (cached→verified emission) → skip',
      prevUid: 'X', nextUid: 'X', intentional: false, expected: 'skip',
    },
    {
      name: 'same-uid re-fire ignores a stale intentional flag → skip',
      prevUid: 'X', nextUid: 'X', intentional: true, expected: 'skip',
    },
    {
      name: 'user switch X→Y → establish',
      prevUid: 'X', nextUid: 'Y', intentional: false, expected: 'establish',
    },
    {
      name: 'user switch X→Y ignores a stale intentional flag → establish',
      prevUid: 'X', nextUid: 'Y', intentional: true, expected: 'establish',
    },
    {
      name: 'in-app sign-out (null + intentional flag) → sign-out',
      prevUid: 'X', nextUid: null, intentional: true, expected: 'sign-out',
    },
    {
      name: 'unexpected null (transient emission, not in-app) → skip',
      prevUid: 'X', nextUid: null, intentional: false, expected: 'skip',
    },
    {
      name: 'cold load with no cached user → skip',
      prevUid: null, nextUid: null, intentional: false, expected: 'skip',
    },
    {
      name: 'null + intentional with nothing owned (degenerate, harmless) → sign-out',
      prevUid: null, nextUid: null, intentional: true, expected: 'sign-out',
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      expect(resolveAuthAction(c.prevUid, c.nextUid, c.intentional)).toBe(c.expected);
    });
  }

  it('is pure — repeated calls with identical args return the same action', () => {
    expect(resolveAuthAction('X', 'X', false)).toBe('skip');
    expect(resolveAuthAction('X', 'X', false)).toBe('skip');
    expect(resolveAuthAction('A', 'B', false)).toBe('establish');
    expect(resolveAuthAction('A', 'B', false)).toBe('establish');
  });
});
