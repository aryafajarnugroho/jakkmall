import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SESSION_DIR = path.join(process.cwd(), 'data');
const SESSION_FILE = path.join(SESSION_DIR, 'shopee_session.json');

/**
 * Script untuk login 1 kali ke Shopee Seller Center dan menyimpan sesi login
 */
export async function saveShopeeSession() {
  console.log('====================================================');
  console.log('🚀 Membuka Browser Playwright untuk Login Shopee Seller...');
  console.log('Silakan login di jendela browser yang muncul (Scan QR / Username).');
  console.log('Setelah masuk ke Dashboard Seller, sesi akan otomatis disimpan!');
  console.log('====================================================');

  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  await page.goto('https://seller.shopee.co.id/account/signin', {
    waitUntil: 'domcontentloaded',
  });

  // Tunggu hingga user berhasil login dan dialihkan ke dashboard portal
  console.log('⏳ Menunggu login berhasil...');

  try {
    // Tunggu hingga URL mengarah ke dashboard portal produk atau portal utama
    await page.waitForURL(/seller\.shopee\.co\.id\/portal/i, { timeout: 180000 });
    await page.waitForTimeout(3000);

    // Simpan session state (cookies & localStorage)
    await context.storageState({ path: SESSION_FILE });
    console.log('✅ Sesi Login Shopee Seller Center BERHASIL DISIMPAN ke: data/shopee_session.json');
    console.log('Kini Bot Playwright dapat langsung membuka dan upload produk tanpa meminta login lagi!');
  } catch {
    console.warn('⚠️ Waktu login habis (3 menit). Silakan ulangi jika belum berhasil login.');
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  saveShopeeSession();
}
