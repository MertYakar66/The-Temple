/**
 * authSession — pure decision helper for AuthContext's onAuthStateChanged
 * lifecycle.
 *
 * `resolveAuthAction` classifies a single auth-state emission into the action
 * the controller should take, given the session it currently owns. It is
 * extracted from `AuthContext.tsx` so the Race-B dedup logic is exhaustively
 * unit-testable in isolation (see `authSession.test.ts`).
 *
 * See docs/plans/fix-authcontext-race.md §2.
 */

/**
 * What `AuthContext` should do in response to one `onAuthStateChanged` fire.
 *
 * - `establish` — a newly signed-in user (a cold sign-in, or a user switch):
 *   reset the stores, load that user's cloud data, start sync.
 * - `skip` — do nothing destructive. Covers two cases: a re-fire for the uid
 *   already owned (Firebase's cached-then-verified double emission), and an
 *   unexpected `null` emission that was NOT preceded by an in-app sign-out
 *   (a transient emission, or a session loss not initiated in-app). Neither
 *   may reset or reload — that is the wipe this fix exists to prevent.
 * - `sign-out` — a genuine, in-app-initiated sign-out: tear sync down and
 *   reset the stores.
 */
export type AuthAction = 'establish' | 'skip' | 'sign-out';

/**
 * Decide the action for one auth-state emission. Pure — the result depends
 * only on the three arguments; no side effects, no `Date` / `Math.random`.
 *
 * @param prevUid     uid of the session AuthContext currently owns (in-flight
 *                    or fully established), or `null` if none.
 * @param nextUid     uid carried by the incoming emission, or `null` when the
 *                    emission carries no user.
 * @param intentional whether an in-app `logout()` / `deleteAccount()` set the
 *                    intentional-sign-out flag before this emission.
 */
export function resolveAuthAction(
  prevUid: string | null,
  nextUid: string | null,
  intentional: boolean,
): AuthAction {
  if (nextUid !== null) {
    // A signed-in user. A re-fire for the uid already owned is a no-op;
    // anyone else (including the first sign-in, where prevUid is null) is a
    // genuine session to establish.
    return nextUid === prevUid ? 'skip' : 'establish';
  }
  // No user in the emission. Only an in-app sign-out is authoritative — any
  // other `null` (a transient emission, an external session loss) is treated
  // as noise and must not run anything destructive.
  return intentional ? 'sign-out' : 'skip';
}
