import { type Page, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error(
    'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
  );
}

/**
 * Sign in as the dedicated e2e test user. Idempotent: if a previous test
 * left the browser context signed in, this returns once the app is past /login.
 */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/login');

  // Login.tsx labels aren't htmlFor-linked to inputs, so getByLabel won't
  // find them — match by placeholder, which is unique in the sign-in form.
  // Also probe-then-skip: if a previous test's auth state is still hydrated,
  // the email field never appears and we treat the user as already signed in.
  const emailField = page.getByPlaceholder('you@example.com');
  let needsLogin = false;
  try {
    await emailField.waitFor({ state: 'visible', timeout: 3000 });
    needsLogin = true;
  } catch {
    needsLogin = false;
  }

  if (needsLogin) {
    await emailField.fill(TEST_USER_EMAIL!);
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    });
  }

  // Confirm we ended up signed in (not on /login, not on /onboarding).
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
  await expect(page).not.toHaveURL(/\/onboarding/);
}

/**
 * Sign out via the Settings page Sign Out button. Waits for the redirect
 * back to /login.
 */
export async function signOut(page: Page): Promise<void> {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await page.waitForURL(/\/login/, { timeout: 15_000 });
}
