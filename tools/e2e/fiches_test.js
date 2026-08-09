const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    await dialog.accept();
  });

  try {
    console.log('Opening app...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

    // Login
    await page.fill('input[type="email"]', 'admin@ctk.ci');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Navigate to Fiches Suivi
    await page.click('button:has-text("Fiches Suivi")');
    await page.waitForTimeout(500);

    // Click first Nouveau button to open new fiche
    const nouveau = await page.$('button[title="Nouveau"]');
    if (!nouveau) {
      console.log('No Nouveau button found - aborting');
      await browser.close();
      process.exit(2);
    }
    await nouveau.click();
    await page.waitForTimeout(500);

    // Fill motif
    const motifXpath = '//label[contains(., "Motif et douleur")]/following::textarea[1]';
    const motifElem = await page.$(motifXpath);
    if (motifElem) await motifElem.fill('Test motif automatique');

    // Fill diagnostic
    const diagXpath = '//label[text() = "Diagnostic"]/following::input[1]';
    const diagElem = await page.$(diagXpath);
    if (diagElem) await diagElem.fill('Test diagnostic automatique');

    // Click Enregistrer
    await page.click('button:has-text("Enregistrer")');
    console.log('Clicked Enregistrer, waiting for possible alerts...');
    await page.waitForTimeout(1500);

    // Reload page to simulate reconnection
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Navigate back to Fiches Suivi
    await page.click('button:has-text("Fiches Suivi")');
    await page.waitForTimeout(500);

    // Click Voir (first)
    const voir = await page.$('button[title="Voir"]');
    if (!voir) {
      console.log('Voir button not found after reload - possible issue');
      await browser.close();
      process.exit(3);
    }

    // Listen for alert message text by intercepting dialog events
    let alertSeen = false;
    page.on('dialog', async dialog => {
      console.log('Alert after reload:', dialog.message());
      alertSeen = true;
      await dialog.accept();
    });

    await voir.click();
    await page.waitForTimeout(1000);

    if (alertSeen) {
      console.log('Alert "Aucune fiche existante pour ce patient" was shown - persistence failed');
      process.exit(4);
    } else {
      console.log('No alert seen on Voir - fiche persisted successfully');
    }

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test script error:', err);
    await browser.close();
    process.exit(1);
  }
})();
