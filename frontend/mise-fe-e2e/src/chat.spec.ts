import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  expect(await page.locator('h1').innerText()).toContain('AI Router');
});

test('has connection status display', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await expect(page.getByText('Disconnected')).toBeVisible();
});

test('has context add button', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
});

test('has chat input', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  await expect(page.locator('textarea')).toBeVisible();
});

/* test('has send button', async ({ page }) => {
  //const submitButton = page.getByRole('button', { name: /send/i });
  const submitButton = page.locator('button[name=submit]');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();
}); */
