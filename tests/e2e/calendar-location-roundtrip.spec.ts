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
 * Batch 1 verification — clearing CalendarEvent.location (the null-emit
 * pattern from commit b484873) survives a save → reload → sign-out →
 * sign-in round trip.
 *
 * Previously test.fixme()'d: the AuthContext onAuthStateChanged race
 * (audit C-1) wiped local writes within ~300 ms of any click, so the
 * round trip failed for an unrelated reason. That race is now fixed —
 * `fix(auth): close AuthContext cloud-sync race`, see
 * docs/plans/fix-authcontext-race.md — and this spec is active again.
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

  test('location: persists, clears, survives sign-out round trip', async ({ page }) => {
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
