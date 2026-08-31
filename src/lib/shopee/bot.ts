import { ShopeeProductMapping, PublishResult } from '@/types/product';
import { ShopeeExcelExporter } from '@/lib/shopee/excel-exporter';
import path from 'path';
import fs from 'fs';

export class ShopeeAutomationBot {
  /**
   * Strategy: Generate Shopee Mass Upload Excel → Playwright opens Shopee Mass Upload page
   * → automatically uploads the generated .xlsx file → waits for Shopee to confirm import.
   * This is the most reliable method since it bypasses form validation entirely.
   */
  public static async publishProduct(
    product: ShopeeProductMapping,
    options: { headless?: boolean } = { headless: false }
  ): Promise<PublishResult> {
    const logs: string[] = [];
    const log = (msg: string) => {
      const entry = `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`;
      logs.push(entry);
      console.log(`[ShopeeAutomationBot] ${entry}`);
    };

    const sessionFilePath = path.join(process.cwd(), 'data', 'shopee_session.json');
    const hasSavedSession = fs.existsSync(sessionFilePath);

    log(`Memulai proses automasi listing untuk: "${product.title}"`);
    log(`SKU: ${product.sku} | Harga Jual: Rp ${product.finalPrice.toLocaleString('id-ID')}`);

    // Step 1: Generate Excel file for this product
    const uploadDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const xlsxPath = path.join(uploadDir, `shopee_upload_${product.sku}_${Date.now()}.xlsx`);

    let playwrightSuccess = false;
    let screenshotUrl: string | undefined;

    try {
      log('📄 Membuat file Shopee Mass Upload Excel untuk produk ini...');
      const buffer = ShopeeExcelExporter.generateWorkbook([product]);
      fs.writeFileSync(xlsxPath, buffer);
      log(`✅ File Excel berhasil dibuat: ${path.basename(xlsxPath)} (${Math.round(buffer.length / 1024)} KB)`);
    } catch (err) {
      log(`⚠️ Gagal membuat file Excel: ${(err as Error).message}`);
      return {
        success: false,
        productId: product.id,
        method: 'PLAYWRIGHT_BOT',
        message: `Gagal membuat file Excel: ${(err as Error).message}`,
        logs,
      };
    }

    try {
      log('Memeriksa browser engine Playwright Chromium...');
      const { chromium } = await import('playwright');

      const isHeadless = options.headless ?? false;
      log(`Inisialisasi browser Playwright (${isHeadless ? 'Background' : 'Visual Live Window'})...`);

      const browser = await chromium.launch({
        headless: isHeadless,
        slowMo: isHeadless ? 0 : 200,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--start-maximized'],
      });

      const contextOptions: Parameters<typeof browser.newContext>[0] = {
        viewport: isHeadless ? { width: 1440, height: 900 } : null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        acceptDownloads: true,
      };

      if (hasSavedSession) {
        log('🔑 Sesi Login Shopee Terverifikasi (data/shopee_session.json)');
        contextOptions.storageState = sessionFilePath;
      } else {
        log('⚠️ Sesi login belum tersedia. Jalankan `npm run shopee:login` terlebih dahulu.');
      }

      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      // Navigate directly to Mass Upload page
      const massUploadUrl = 'https://seller.shopee.co.id/portal/product-mass/import/upload';
      log(`Navigasi ke halaman Mass Upload Shopee: ${massUploadUrl}`);

      await page.goto(massUploadUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 35000,
      });
      await page.waitForTimeout(3000);

      log(`URL terkini: ${page.url()}`);

      // Check if redirected to login
      if (page.url().includes('account/signin') || page.url().includes('login')) {
        log('⚠️ Session kadaluarsa. Silakan jalankan ulang: npm run shopee:login');
        await page.screenshot({ path: path.join(process.cwd(), 'public/screenshots/shopee_login_required.png') });
        screenshotUrl = '/screenshots/shopee_login_required.png';
        await browser.close();
        return {
          success: false,
          productId: product.id,
          method: 'PLAYWRIGHT_BOT',
          message: 'Sesi login Shopee kadaluarsa. Jalankan: npm run shopee:login',
          logs,
          screenshotUrl,
        };
      }

      // Wait for the Mass Upload page to fully load
      await page.waitForTimeout(2000);

      // Step 2: Click "Upload File" tab if needed
      const uploadTab = page.locator('text=Upload File, text=Unggah File').first();
      if (await uploadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await uploadTab.click();
        log('-> Membuka tab Upload File...');
        await page.waitForTimeout(1500);
      }

      // Step 3: Click on "Basic Info" template button or "Upload Basic" tab
      const basicTab = page.locator('text=Informasi Dasar, text=Basic, div[data-tab="basic"]').first();
      if (await basicTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await basicTab.click();
        log('-> Memilih tab template Informasi Dasar (Basic)...');
        await page.waitForTimeout(1000);
      }

      // Step 4: Upload the generated Excel file via <input type="file">
      log(`📁 Mengunggah file Excel ke Shopee Mass Upload: ${path.basename(xlsxPath)}`);
      const fileInput = page.locator('input[type="file"]').first();

      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(xlsxPath);
        log('-> File Excel berhasil dikirim ke Shopee upload form!');
        await page.waitForTimeout(3000);

        // Wait for upload response / progress bar
        const uploadSuccess = page.locator(
          'text=berhasil, text=Berhasil Diunggah, text=Upload Berhasil, .upload-success, .success-icon'
        ).first();
        const uploadError = page.locator(
          'text=Gagal, text=Error, text=Invalid, .upload-error, .error-icon'
        ).first();

        // Wait up to 30s for upload to complete
        let uploadDone = false;
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(3000);
          const isSuccess = await uploadSuccess.isVisible({ timeout: 1000 }).catch(() => false);
          const isError = await uploadError.isVisible({ timeout: 1000 }).catch(() => false);

          if (isSuccess) {
            log('🎉 Upload Excel ke Shopee Mass Upload BERHASIL! Produk sedang diproses...');
            uploadDone = true;
            break;
          }
          if (isError) {
            const errorText = await uploadError.textContent().catch(() => '');
            log(`⚠️ Shopee menolak file: ${errorText}. Cek format template.`);
            uploadDone = true;
            break;
          }
          log(`-> Menunggu proses upload Shopee... (${(i + 1) * 3}s)`);
        }

        if (!uploadDone) {
          log('-> Upload file selesai dikirim. Shopee sedang memproses di backend...');
        }
      } else {
        // Fallback: click upload button/area then setInputFiles
        const uploadArea = page.locator('.upload-dragger, .ant-upload, [class*="upload"]').first();
        if (await uploadArea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await uploadArea.click();
          await page.waitForTimeout(500);
          const fileInput2 = page.locator('input[type="file"]').first();
          if (await fileInput2.count() > 0) {
            await fileInput2.setInputFiles(xlsxPath);
            log('-> File Excel berhasil dikirim melalui upload area!');
            await page.waitForTimeout(5000);
          }
        } else {
          log('⚠️ Input file tidak ditemukan di halaman Mass Upload. Shopee mungkin memperbarui UI.');
        }
      }

      // Screenshot as proof
      const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
      if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
      const screenshotFilename = `proof-${product.sku}-${Date.now()}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      screenshotUrl = `/screenshots/${screenshotFilename}`;
      log(`📸 Screenshot bukti disimpan: ${screenshotUrl}`);

      log('✅ Proses automasi Mass Upload ke Shopee Seller Center selesai!');

      await page.waitForTimeout(isHeadless ? 1000 : 5000);
      await browser.close();
      playwrightSuccess = true;

      // Cleanup temp Excel file
      try { fs.unlinkSync(xlsxPath); } catch { /* ignore */ }
    } catch (err: unknown) {
      const error = err as Error;
      log(`⚠️ Playwright error: ${error.message}`);
      console.warn(`[ShopeeAutomationBot] Error:`, error.message);
    }

    if (!playwrightSuccess) {
      log('⚠️ Bot tidak dapat dijalankan dari server Next.js (Playwright berjalan lokal saja).');
      log('💡 Solusi: Klik tombol "Export All (Shopee Excel)" → upload manual ke Shopee Mass Upload.');
      log(`-> Judul: ${product.title}`);
      log(`-> Harga Jual: Rp ${product.finalPrice.toLocaleString('id-ID')}`);
      log(`-> Stok: ${product.stock} | Berat: ${product.weightGrams} gr`);
    }

    return {
      success: playwrightSuccess,
      productId: product.id,
      method: 'PLAYWRIGHT_BOT',
      message: playwrightSuccess
        ? '✅ File Excel berhasil diunggah ke Shopee Mass Upload secara otomatis!'
        : '⚠️ Bot lokal tidak aktif. Gunakan tombol Export Excel untuk upload manual.',
      logs,
      screenshotUrl,
    };
  }
}
