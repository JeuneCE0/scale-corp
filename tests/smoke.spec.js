// Smoke test: verifies the app renders without white screen
// Run: npx playwright test tests/smoke.spec.js

import { test, expect } from '@playwright/test';

const URL = process.env.TEST_URL || 'https://scale-corp.vercel.app/';

test('login page renders without crash', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Should have visible content (not white screen)
  const root = await page.locator('#root').innerHTML();
  expect(root.length).toBeGreaterThan(100);
  
  // Should show login form elements
  const body = await page.textContent('body');
  expect(body).toMatch(/connexion|email|mot de passe|login/i);
  
  // No React crash errors
  const crashErrors = errors.filter(e => e.includes('Minified React error') || e.includes('rendered more hooks'));
  expect(crashErrors).toHaveLength(0);
});

test('no console errors on load', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource'))
      consoleErrors.push(msg.text());
  });
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Filter out expected API errors (unauthenticated calls)
  const real = consoleErrors.filter(e => !e.includes('GHL') && !e.includes('Revolut') && !e.includes('Stripe') && !e.includes('sync'));
  expect(real).toHaveLength(0);
});
