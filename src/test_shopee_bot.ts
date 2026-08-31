import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

async function downloadTempImage(imageUrl: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, 'temp_product_image.jpg');

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    fs.writeFileSync(tempFile, response.data);
    return tempFile;
  } catch (err) {
    console.warn('Image download failed, creating sample image buffer...');
    // Minimal 1x1 valid JPEG fallback
    const sampleBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
    fs.writeFileSync(tempFile, sampleBuffer);
    return tempFile;
  }
}

async function testFullShopeePublish() {
  const sessionPath = path.join(process.cwd(), 'data', 'shopee_session.json');
  console.log('Testing full Shopee publish with session:', sessionPath);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 250,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });

  const context = await browser.newContext({
    storageState: sessionPath,
    viewport: null,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  console.log('Opening Shopee Seller portal /portal/product/new...');
  await page.goto('https://seller.shopee.co.id/portal/product/new', {
    waitUntil: 'domcontentloaded',
    timeout: 35000,
  });

  await page.waitForTimeout(3500);

  // 1. Title Input
  const titleInput = page.locator('input[placeholder*="Nama Merek" i], input[placeholder*="Tipe Produk" i], input.shopee-input__input').first();
  if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Typing Product Title...');
    await titleInput.fill('TaffHOME Pompa Vakum Baju Elektrik Vacuum Bag Pump 55W - Abu Abu');
    await page.waitForTimeout(2000);

    // Pick first recommended category
    const catItem = page.locator('.category-list-item, .category-recommendation-item, .shopee-cascader__item, .category-card').first();
    if (await catItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Selecting category...');
      await catItem.click();
      await page.waitForTimeout(1500);
    }

    const nextBtn = page.locator('button:has-text("Selanjutnya"), button:has-text("Lanjut")').first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Selanjutnya button...');
      await nextBtn.click();
      await page.waitForTimeout(4000);
    }
  }

  console.log('Now at Product Edit Page:', page.url());

  // 2. Upload Cover Image (Foto Utama)
  try {
    const tempImg = await downloadTempImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop');
    const fileInputs = page.locator('input[type="file"]');
    if (await fileInputs.count() > 0) {
      console.log('Uploading product cover image file...');
      await fileInputs.first().setInputFiles(tempImg);
      await page.waitForTimeout(2500);
      console.log('Cover image uploaded!');
    }
  } catch (err) {
    console.warn('Image upload step note:', err);
  }

  // 3. Description
  const descInput = page.locator('textarea, div[contenteditable="true"]').first();
  if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Filling Description...');
    await descInput.fill('✨ TaffHOME Pompa Vakum Baju Elektrik ✨\n\nProduk 100% Baru & Original. Sangat praktis untuk menghemat ruang koper atau lemari pakaian Anda hingga 75%. Daya hisap kuat 55W.');
    await page.waitForTimeout(1000);
  }

  // 4. Price & Stock
  const priceInput = page.locator('input[placeholder*="Harga" i], input[placeholder*="Price" i]').first();
  if (await priceInput.isVisible({ timeout: 2500 }).catch(() => false)) {
    console.log('Filling Price...');
    await priceInput.fill('85000');
    await page.waitForTimeout(800);
  }

  const stockInput = page.locator('input[placeholder*="Stok" i], input[placeholder*="Stock" i]').first();
  if (await stockInput.isVisible({ timeout: 2500 }).catch(() => false)) {
    console.log('Filling Stock...');
    await stockInput.fill('50');
    await page.waitForTimeout(800);
  }

  // 5. Weight
  const weightInput = page.locator('input[placeholder*="Berat" i], input[placeholder*="Weight" i]').first();
  if (await weightInput.isVisible({ timeout: 2500 }).catch(() => false)) {
    console.log('Filling Weight...');
    await weightInput.fill('0.25');
    await page.waitForTimeout(800);
  }

  // 6. Select "Tidak Ada Merek" (No Brand) if brand dropdown exists
  try {
    const brandSelector = page.locator('.shopee-form-item:has-text("Merek"), .shopee-form-item:has-text("Brand")').locator('.shopee-select, input').first();
    if (await brandSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Clicking Brand selector...');
      await brandSelector.click();
      await page.waitForTimeout(1000);
      const noBrandOption = page.locator('.shopee-select__menu-item:has-text("Tidak Ada Merek"), .shopee-select__menu-item:has-text("No Brand")').first();
      if (await noBrandOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await noBrandOption.click();
        console.log('Selected: Tidak Ada Merek');
      }
    }
  } catch (err) {
    console.warn('Brand select note:', err);
  }

  // 7. Click "Simpan & Tampilkan" (Save and Publish)
  console.log('Looking for Simpan & Tampilkan button...');
  const publishBtn = page.locator('button:has-text("Simpan & Tampilkan"), button:has-text("Simpan dan Tampilkan"), button:has-text("Save and Publish")').first();
  if (await publishBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('Clicking "Simpan & Tampilkan" button to publish product to Shopee!');
    await publishBtn.click();
    await page.waitForTimeout(5000);
  } else {
    // Try Simpan & Arsipkan (Save as Draft)
    const draftBtn = page.locator('button:has-text("Simpan & Arsipkan"), button:has-text("Simpan dan Arsipkan")').first();
    if (await draftBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Clicking "Simpan & Arsipkan" button...');
      await draftBtn.click();
      await page.waitForTimeout(4000);
    }
  }

  await page.screenshot({ path: 'public/screenshots/shopee_published_final_proof.png' });
  console.log('Screenshot saved: public/screenshots/shopee_published_final_proof.png');
  console.log('Keeping browser open for 15s to observe final state...');
  await page.waitForTimeout(15000);
  await browser.close();
  console.log('Finished full publish automation!');
}

testFullShopeePublish().catch(console.error);
