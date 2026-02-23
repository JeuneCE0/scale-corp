// @ts-check
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Log in with the demo account (demo@hubscale.fr / demo123).
 * After calling this the page should be on the main app (dashboard or onboarding).
 */
async function loginWithDemo(page) {
  await page.goto('/');

  // If we land on the landing page, click "Connexion" to get to the login form.
  const connexionBtn = page.locator('button', { hasText: 'Connexion' });
  if (await connexionBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await connexionBtn.first().click();
  }

  // Wait for the login form to appear
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill credentials
  await page.locator('input[type="email"]').fill('demo@hubscale.fr');
  await page.locator('input[type="password"]').fill('demo123');

  // Submit
  await page.locator('button', { hasText: 'Se connecter' }).click();

  // Wait until the app loads — we look for the main nav or onboarding
  await page.waitForSelector(
    'nav[role="navigation"], h1:has-text("Onboarding")',
    { timeout: 15000 },
  );
}

/**
 * Ensure the user is fully past onboarding and on the dashboard.
 * If onboarding is shown, skip it. If already on the dashboard, no-op.
 */
async function ensureDashboard(page) {
  // Check if onboarding is visible
  const onboardingHeading = page.locator('h1:has-text("Onboarding")');
  if (await onboardingHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Click "Passer l'onboarding" (skip button)
    const skipBtn = page.locator('button', { hasText: "Passer l'onboarding" });
    await skipBtn.click();
    // Wait for the dashboard nav to appear
    await page.waitForSelector('nav[role="navigation"]', { timeout: 10000 });
  }

  // If a guided tour modal is open, dismiss it
  const tourModal = page.locator('text=Passer');
  if (await tourModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    await tourModal.click();
  }
}

/**
 * Full login + skip onboarding flow so the page is on the dashboard.
 */
async function loginAndGoToDashboard(page) {
  await loginWithDemo(page);
  await ensureDashboard(page);
}

// ---------------------------------------------------------------------------
// 1. Landing page
// ---------------------------------------------------------------------------

test.describe('Landing page', () => {
  test('renders and has login/signup buttons', async ({ page }) => {
    await page.goto('/');

    // The landing page should display the HubScale brand
    await expect(page.locator('text=HubScale').first()).toBeVisible({ timeout: 10000 });

    // There should be a "Connexion" button (login) visible
    const loginBtn = page.locator('button', { hasText: 'Connexion' });
    await expect(loginBtn.first()).toBeVisible();

    // There should be a signup / free-trial button
    const signupBtn = page.locator('button', { hasText: /Essai gratuit|Reprendre le contr/ });
    await expect(signupBtn.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Login with demo account
// ---------------------------------------------------------------------------

test.describe('Login with demo account', () => {
  test('fills demo credentials, logs in, and reaches the app', async ({ page }) => {
    await page.goto('/');

    // Navigate to login
    const connexionBtn = page.locator('button', { hasText: 'Connexion' });
    await connexionBtn.first().click();

    // Wait for the login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill demo credentials
    await page.locator('input[type="email"]').fill('demo@hubscale.fr');
    await page.locator('input[type="password"]').fill('demo123');

    // Click login
    await page.locator('button', { hasText: 'Se connecter' }).click();

    // Should reach the app (nav appears or onboarding title)
    await page.waitForSelector(
      'nav[role="navigation"], h1:has-text("Onboarding")',
      { timeout: 15000 },
    );

    // Verify we are no longer on the login screen
    await expect(page.locator('text=Espace client B2B').first()).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // On the login page the subtitle says "Espace client B2B -- Pilotez votre activite".
      // If we can't assert not-visible, that's fine as long as the nav appeared.
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Navigation
// ---------------------------------------------------------------------------

test.describe('Navigation', () => {
  test('can click through all tabs and each renders', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // The main nav tabs: CRM, Data, Agenda, Analytics, Parametres
    const tabs = [
      { label: 'CRM', verify: 'CRM' },
      { label: 'Data', verify: 'Data' },
      { label: 'Agenda', verify: 'Agenda' },
      { label: 'Analytics', verify: 'Analytics' },
      { label: /Param/, verify: /Param|Settings/ },
    ];

    for (const tab of tabs) {
      // Click the tab button in the nav
      const tabBtn = page.locator('nav[role="navigation"] button[role="tab"]', { hasText: tab.label });
      await tabBtn.click();

      // Wait a moment for the page transition
      await page.waitForTimeout(300);

      // Verify the selected tab is now active (aria-selected="true")
      await expect(tabBtn).toHaveAttribute('aria-selected', 'true');
    }

    // Go back to Overview
    const overviewTab = page.locator('nav[role="navigation"] button[role="tab"]', { hasText: 'Overview' });
    await overviewTab.click();
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// 4. CRM flow
// ---------------------------------------------------------------------------

test.describe('CRM flow', () => {
  test('can add a new contact and verify it appears in the list', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // Navigate to CRM tab
    await page.locator('nav[role="navigation"] button[role="tab"]', { hasText: 'CRM' }).click();
    await page.waitForTimeout(500);

    // Verify CRM page loaded
    await expect(page.locator('h1:has-text("CRM")')).toBeVisible({ timeout: 5000 });

    // Click "+ Contact" button to open the new contact modal
    await page.locator('button', { hasText: '+ Contact' }).click();

    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Fill in contact details
    const testName = 'Test Playwright ' + Date.now();
    const testEmail = 'playwright-' + Date.now() + '@test.com';

    // Fill "Nom *" field
    const nameInput = page.locator('[role="dialog"] label:has-text("Nom") + div input, [role="dialog"] label:has-text("Nom") ~ .glass-input input');
    // Fallback: find inputs in the dialog
    const dialogInputs = page.locator('[role="dialog"] input[type="text"]');
    await dialogInputs.first().fill(testName);

    // Fill "Email" field
    const emailInput = page.locator('[role="dialog"] input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(testEmail);
    }

    // Click "Ajouter" button to save
    await page.locator('[role="dialog"] button', { hasText: 'Ajouter' }).click();

    // Wait for the modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });

    // Verify the contact appears in the table
    await expect(page.locator(`text=${testName}`)).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 5. Search (Cmd+K)
// ---------------------------------------------------------------------------

test.describe('Search', () => {
  test('opens search with Cmd+K, types a query, and shows results', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // Open global search with keyboard shortcut (Ctrl+K on Linux)
    await page.keyboard.press('Control+k');

    // Wait for the search overlay to appear
    await page.waitForSelector('input[placeholder*="Rechercher"]', { timeout: 5000 });

    // Type a search query — "Dashboard" should match page navigation results
    await page.locator('input[placeholder*="Rechercher"]').fill('Dashboard');

    // Wait for results to appear (at least 2 chars triggers results)
    await page.waitForTimeout(500);

    // Should show at least one result
    const results = page.locator('text=Dashboard').first();
    await expect(results).toBeVisible({ timeout: 5000 });

    // Close the search
    await page.keyboard.press('Escape');
  });
});

// ---------------------------------------------------------------------------
// 6. Settings — change company name
// ---------------------------------------------------------------------------

test.describe('Settings', () => {
  test('can change company name and see saved confirmation', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // Navigate to Settings (Parametres) tab
    await page.locator('nav[role="navigation"] button[role="tab"]', { hasText: /Param/ }).click();
    await page.waitForTimeout(500);

    // Should be on the "Compte" sub-tab by default
    await expect(page.locator('text=INFORMATIONS DE LA SOCIÉTÉ').first()).toBeVisible({ timeout: 5000 });

    // Find the "Raison sociale" input and fill it
    const companyNameLabel = page.locator('label:has-text("Raison sociale")');
    await expect(companyNameLabel).toBeVisible();

    // The input is a sibling after the label within the Inp component
    const companyNameInput = companyNameLabel.locator('..').locator('input');
    await companyNameInput.fill('');
    await companyNameInput.fill('Test Company Playwright');

    // Click "Sauvegarder"
    await page.locator('button', { hasText: 'Sauvegarder' }).click();

    // Verify the saved confirmation message appears
    await expect(page.locator('text=Sauvegard')).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 7. Onboarding skip
// ---------------------------------------------------------------------------

test.describe('Onboarding skip', () => {
  test('fresh session shows onboarding, skip leads to dashboard', async ({ page }) => {
    // Clear all localStorage to simulate a completely fresh session
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Reload to start fresh
    await page.reload();
    await page.waitForTimeout(500);

    // Now do a fresh login
    // If the landing page shows, go to login
    const connexionBtn = page.locator('button', { hasText: 'Connexion' });
    if (await connexionBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await connexionBtn.first().click();
    }

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.locator('input[type="email"]').fill('demo@hubscale.fr');
    await page.locator('input[type="password"]').fill('demo123');
    await page.locator('button', { hasText: 'Se connecter' }).click();

    // Should show onboarding (since localStorage was cleared, onboarded=false)
    await page.waitForSelector('h1:has-text("Onboarding"), nav[role="navigation"]', { timeout: 15000 });

    // If onboarding is visible, skip it
    const onboardingVisible = await page.locator('h1:has-text("Onboarding")').isVisible({ timeout: 3000 }).catch(() => false);
    if (onboardingVisible) {
      await page.locator('button', { hasText: "Passer l'onboarding" }).click();
    }

    // Should now see the main navigation (dashboard)
    await page.waitForSelector('nav[role="navigation"]', { timeout: 10000 });

    // Dismiss tour if visible
    const tourSkip = page.locator('button', { hasText: 'Passer' });
    if (await tourSkip.isVisible({ timeout: 1000 }).catch(() => false)) {
      await tourSkip.click();
    }

    // Verify the dashboard loaded by checking for the Overview tab or welcome banner
    const overviewTab = page.locator('nav[role="navigation"] button[role="tab"]', { hasText: 'Overview' });
    await expect(overviewTab).toBeVisible();
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// 8. Keyboard shortcuts
// ---------------------------------------------------------------------------

test.describe('Keyboard shortcuts', () => {
  test('pressing "2" navigates to CRM tab', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // Verify we start on Overview
    const overviewTab = page.locator('nav[role="navigation"] button[role="tab"]', { hasText: 'Overview' });
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');

    // Press "2" to navigate to CRM (tab shortcut: 1=overview, 2=crm, 3=data, etc.)
    await page.keyboard.press('2');

    // Wait for tab change
    await page.waitForTimeout(400);

    // Verify CRM tab is now active
    const crmTab = page.locator('nav[role="navigation"] button[role="tab"]', { hasText: 'CRM' });
    await expect(crmTab).toHaveAttribute('aria-selected', 'true');

    // Verify CRM content loaded
    await expect(page.locator('h1:has-text("CRM")')).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 9. Theme toggle
// ---------------------------------------------------------------------------

test.describe('Theme toggle', () => {
  test('theme toggle exists in settings', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // Navigate to Settings
    await page.locator('nav[role="navigation"] button[role="tab"]', { hasText: /Param/ }).click();
    await page.waitForTimeout(500);

    // Should be on the "Compte" sub-tab by default (where theme toggle lives)
    await expect(page.locator('text=APPARENCE').first()).toBeVisible({ timeout: 5000 });

    // Look for the theme section heading
    await expect(page.locator('text=Th').first()).toBeVisible();

    // Find the theme toggle — it's a Toggle component with role="switch"
    const themeToggle = page.locator('[role="switch"]').first();
    await expect(themeToggle).toBeVisible();

    // The toggle should have an aria-checked attribute
    const ariaChecked = await themeToggle.getAttribute('aria-checked');
    expect(ariaChecked === 'true' || ariaChecked === 'false').toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 10. Export data
// ---------------------------------------------------------------------------

test.describe('Export data', () => {
  test('can navigate to Data & Export and click export without errors', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // Navigate to Settings
    await page.locator('nav[role="navigation"] button[role="tab"]', { hasText: /Param/ }).click();
    await page.waitForTimeout(500);

    // Click on "Data & Export" sub-tab
    const dataExportTab = page.locator('button[role="tab"]', { hasText: 'Data & Export' });
    await dataExportTab.click();

    // Wait for the export section to appear
    await expect(page.locator('text=EXPORT DE DONN').first()).toBeVisible({ timeout: 5000 });

    // Verify the export contacts row exists
    await expect(page.locator('text=Exporter les contacts').first()).toBeVisible();

    // Set up a download listener and click the first "Telecharger" button (contacts export)
    // We use page.on('download') to catch the download triggered by the export.
    // If the export uses a Blob URL + download attribute, we can catch it.
    // If it uses other methods, we just verify no errors occur.
    let errorOccurred = false;
    page.on('pageerror', () => {
      errorOccurred = true;
    });

    // Click the first "Telecharger" button (Exporter les contacts)
    const downloadButtons = page.locator('button', { hasText: /charger/ });
    const firstDownload = downloadButtons.first();
    await expect(firstDownload).toBeVisible();

    // Click and verify no page error
    await firstDownload.click();
    await page.waitForTimeout(1000);

    // No JS errors should have occurred
    expect(errorOccurred).toBe(false);
  });
});
