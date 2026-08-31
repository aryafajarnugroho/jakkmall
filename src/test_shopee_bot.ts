import { chromium } from 'playwright';
import path from 'path';

async function testShopeeDirectUpload() {
  const sessionPath = path.join(process.cwd(), 'data', 'shopee_session.json');
  console.log('Testing with session:', sessionPath);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });

  const context = await browser.newContext({
    storageState: sessionPath,
    viewport: null,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  console.log('Navigating to Shopee Seller Portal new product...');
  await page.goto('https://seller.shopee.co.id/portal/product/new', {
    waitUntil: 'domcontentloaded',
    timeout: 35000,
  });

  await page.waitForTimeout(4000);
  console.log('Page loaded, URL:', page.url());

  // Step 1: Find Title input
  const titleInput = page.locator('input[placeholder*="Nama Merek" i], input[placeholder*="Tipe Produk" i], input.shopee-input__input').first();
  if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Found title input! Typing...');
    await titleInput.fill('TaffHOME Pompa Vakum Baju Elektrik Vacuum Bag Pump 55W');
    await page.waitForTimeout(2000);

    // Click Category Recommendation or "Selanjutnya" button
    const categoryOption = page.locator('.category-list-item, .category-recommendation-item, .shopee-cascader__item').first();
    if (await categoryOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Selecting recommended category...');
      await categoryOption.click();
      await page.waitForTimeout(1500);
    }

    const nextBtn = page.locator('button:has-text("Selanjutnya"), button:has-text("Lanjut")').first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Selanjutnya button...');
      await nextBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  // Step 2: Main product details page
  console.log('Now at Step 2 URL:', page.url());
  const descTextarea = page.locator('textarea, div[contenteditable="true"]').first();
  if (await descTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Typing description...');
    await descTextarea.fill('TaffHOME Pompa Vakum Baju Elektrik berkualitas tinggi, daya hisap kuat 55W, praktis dan hemat tempat.');
    await page.waitForTimeout(1500);
  }

  // Price & Stock inputs
  const priceInput = page.locator('input[placeholder*="Harga" i], input[placeholder*="Price" i]').first();
  if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Typing price...');
    await priceInput.fill('85000');
    await page.waitForTimeout(1000);
  }

  const stockInput = page.locator('input[placeholder*="Stok" i], input[placeholder*="Stock" i]').first();
  if (await stockInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Typing stock...');
    await stockInput.fill('100');
    await page.waitForTimeout(1000);
  }

  // Weight input
  const weightInput = page.locator('input[placeholder*="Berat" i], input[placeholder*="Weight" i]').first();
  if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Typing weight...');
    await weightInput.fill('0.25');
    await page.waitForTimeout(1000);
  }

  // Screenshot
  await page.screenshot({ path: 'public/screenshots/shopee_live_filled_proof.png' });
  console.log('Saved screenshot: public/screenshots/shopee_live_filled_proof.png');

  console.log('Keeping browser open for 15 seconds so you can see it on your screen...');
  await page.waitForTimeout(15000);
  await browser.close();
  console.log('Test completed successfully!');
}

testShopeeDirectUpload().catch(console.error);
