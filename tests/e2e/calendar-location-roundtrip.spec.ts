import { test, expect, type Page } from '@playwright/test';
import { signIn, signOut } from './helpers/auth';

const TEST_LOCATION = '123 Main St';

// Sync debounce in firestoreSync.ts is 2000ms. Wait > debounce before reload
// so the cloud doc actually has our latest write before AuthContext reloads
// it on the next page load (otherwise loadFromCloud overwrites the local
// store with a stale cloud doc that doesn't include the new event).
const SYNC_FLUSH_MS = 2_500;

/**
 * Find the event chip and open the detail popover. Switches to the Upcoming
 * view (button label "List") first so the chip is visible regardless of which
 * view + selectedDate the test user happens to have persisted — Upcoming
 * shows events from today forward, which always includes a just-created
 * "now + 1 hour" event.
 */
async function openEventByTitle(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByText(title).first().click();
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
}

/**
 * BLOCKED — calendar-location round-trip cannot pass against current `main`.
 *
 * Batch 1 verification was supposed to confirm that clearing CalendarEvent.location
 * (null-emit pattern from commit b484873) survives a save → reload → sign-out →
 * sign-in round trip. That invariant CAN be proved at the store layer (see
 * src/store/useCalendarStore.test.ts) but the end-to-end version trips on a
 * separate, already-audited bug:
 *
 *   AuthContext.onAuthStateChanged callback isn't cancellation-safe
 *   (audit finding, "high severity" — should probably be re-rated critical
 *   based on the reproduction below).
 *
 * Reproduction observed in production build (`vite preview`):
 *   - User clicks the Add button. addEvent fires, events: [newEvent].
 *   - At click+150ms, polling localStorage shows events.length === 1.
 *   - At click+300ms, polling shows events.length === 0.
 *   - Stack trace of the wipe: AuthContext.resetStore (called by the
 *     async onAuthStateChanged callback). Firebase emits the listener
 *     more than once on initial page load (cached-user fire, then a
 *     verified fire), and each chain runs resetStore() before awaiting
 *     loadFromCloud — so a chain whose resetStore lands AFTER user
 *     interaction wipes the local write. The wipe then propagates to
 *     cloud on the next debounced sync.
 *   - This happens reliably under fast bot-style interaction. Real users
 *     who pause briefly between page-load and click usually finish the
 *     auth chain before interacting and don't see it.
 *
 * Fix shape (for the future AuthContext-cleanup batch):
 *   - Track an in-flight token / AbortController across onAuthStateChanged
 *     callback runs.
 *   - Before resetStore + load + startSync, verify
 *     auth.currentUser?.uid === user.uid; bail if a newer chain is already
 *     in flight.
 *   - Make startSync's old subscriber be unsubscribed before a new one
 *     overwrites unsubXxxRef (currently leaks).
 *
 * Once that's fixed, switch test.fixme back to test, and switch
 * playwright.config.ts's webServer command back to `npm run dev` for
 * faster iteration (per the TODO in tests/e2e/README.md).
 */
test.describe('Calendar event location round-trip (Batch 1 verification)', () => {
  let uniqueTitle: string;

  test.beforeEach(async ({ page }) => {
    uniqueTitle = `E2E location test ${Date.now()}`;
    await signIn(page);
  });

  test.afterEach(async ({ page }) => {
    // Best-effort cleanup. Runs even on test failure so the test user's
    // calendar doesn't accumulate orphan events. The unique-per-run title
    // means we only delete what this test created — a previous run's
    // orphans don't get touched.
    try {
      await page.goto('/calendar');
      await page.getByRole('button', { name: 'List', exact: true }).click();
      const chip = page.getByText(uniqueTitle).first();
      if (await chip.isVisible({ timeout: 3_000 }).catch(() => false)) {
        page.once('dialog', (dialog) => dialog.accept());
        await chip.click();
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await page.waitForTimeout(SYNC_FLUSH_MS);
      }
    } catch {
      // Ignore — afterEach failures shouldn't mask the actual test result.
    }
  });

  test.fixme('location: persists, clears, survives sign-out round trip', async ({ page }) => {
    // 1. Create event with title + location.
    //    Visit /calendar first so the editor's navigate(-1) on save lands
    //    here (the editor uses history-back rather than an explicit route).
    await page.goto('/calendar');
    await page.goto('/calendar/event/edit');
    await page.getByPlaceholder('Event title').fill(uniqueTitle);
    await page.getByPlaceholder('Add location').fill(TEST_LOCATION);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page).toHaveURL(/\/calendar$/);

    await page.waitForTimeout(SYNC_FLUSH_MS);

    // 2. Reload, open event, expect location is populated.
    await page.reload();
    await openEventByTitle(page, uniqueTitle);
    await expect(page.getByText(TEST_LOCATION).first()).toBeVisible();

    // 3. Edit: clear location, save.
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByPlaceholder('Add location')).toHaveValue(TEST_LOCATION);
    await page.getByPlaceholder('Add location').fill('');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/calendar$/);

    await page.waitForTimeout(SYNC_FLUSH_MS);

    // 4. Reload, open event, expect location is gone.
    //    This is the actual Batch 1 invariant: clearing an editor field
    //    must not leave the prior value sitting in the merged doc.
    await page.reload();
    await openEventByTitle(page, uniqueTitle);
    await expect(page.getByText(TEST_LOCATION)).toHaveCount(0);

    // 5. Sign out, sign back in. signOut starts with page.goto('/settings'),
    //    a full navigation that discards any open popover from step 4.
    await signOut(page);
    await signIn(page);

    // 6. Verify cleared state survived the round trip through Firestore.
    await page.goto('/calendar');
    await openEventByTitle(page, uniqueTitle);
    await expect(page.getByText(TEST_LOCATION)).toHaveCount(0);
  });
});
