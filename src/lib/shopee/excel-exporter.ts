import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';
import fs from 'fs';
import path from 'path';

/**
 * EXACT COLUMN MAPPING (0-indexed) from official Shopee Indonesia Basic Template
 * Based on: Shopee_mass_upload_2026-08-31_basic_template.xlsx
 *
 * idx 0  = Kategori                        (ps_category)            - Opsional
 * idx 1  = Nama Produk                     (ps_product_name)        - WAJIB
 * idx 2  = Deskripsi Produk                (ps_product_description) - WAJIB
 * idx 3  = Maks. Jumlah Pembelian          (ps_maximum_purchase_quantity) - Opsional
 * idx 4  = Maks. Jumlah Pembelian - Tgl Mulai                      - Wajib Bersyarat
 * idx 5  = Maks. Jumlah Pembelian - Jumlah Hari                    - Wajib Bersyarat
 * idx 6  = Maks. Jumlah Pembelian - Tgl Berakhir                   - Wajib Bersyarat
 * idx 7  = Min. Jumlah Pembelian                                    - Opsional
 * idx 8  = SKU Induk                       (ps_sku_parent_short)    - Opsional
 * idx 9  = Produk Berbahaya                (ps_dangerous_goods)     - Opsional
 * idx 10 = Kode Integrasi Variasi          (et_title_variation_integration_no) - Wajib Bersyarat
 * idx 11 = Nama Variasi 1                  (et_title_variation_1)   - Wajib Bersyarat
 * idx 12 = Varian untuk Variasi 1          (et_title_option_for_variation_1)   - Wajib Bersyarat
 * idx 13 = Foto Produk per Varian          (et_title_image_per_variation)      - Wajib Bersyarat
 * idx 14 = Nama Variasi 2                  (et_title_variation_2)   - Wajib Bersyarat
 * idx 15 = Varian untuk Variasi 2          (et_title_option_for_variation_2)   - Wajib Bersyarat
 * idx 16 = Harga                           (ps_price)               - WAJIB (number)
 * idx 17 = Stok                            (ps_stock)               - Wajib Bersyarat (number)
 * idx 18 = Kode Variasi                    (ps_sku_short)           - Opsional
 * idx 19 = Template Panduan Ukuran         (ps_new_size_chart)      - Wajib Bersyarat
 * idx 20 = Foto Panduan Ukuran             (et_title_size_chart)    - Wajib Bersyarat
 * idx 21 = GTIN                            (ps_gtin_code)           - Opsional
 * idx 22 = Foto Sampul                     (ps_item_cover_image)    - WAJIB (URL)
 * idx 23 = Foto Produk 1                   (ps_item_image_1)        - Opsional
 * idx 24 = Foto Produk 2                   (ps_item_image_2)        - Opsional
 * idx 25 = Foto Produk 3                   (ps_item_image_3)        - Opsional
 * idx 26 = Foto Produk 4                   (ps_item_image_4)        - Opsional
 * idx 27 = Foto Produk 5                   (ps_item_image_5)        - Opsional
 * idx 28 = Foto Produk 6                   (ps_item_image_6)        - Opsional
 * idx 29 = Foto Produk 7                   (ps_item_image_7)        - Opsional
 * idx 30 = Foto Produk 8                   (ps_item_image_8)        - Opsional
 * idx 31 = Berat (kg)                      (ps_weight)              - WAJIB (number, 0.01-500)
 * idx 32 = Panjang (cm)                    (ps_length)              - Wajib Bersyarat (number)
 * idx 33 = Lebar (cm)                      (ps_width)               - Wajib Bersyarat (number)
 * idx 34 = Tinggi (cm)                     (ps_height)              - Wajib Bersyarat (number)
 * idx 35 = Same Day                        (channel_id.8001)        - Wajib Bersyarat (Aktif/Nonaktif)
 * idx 36 = Next Day                        (channel_id.8002)        - Wajib Bersyarat (Aktif/Nonaktif)
 * idx 37 = Reguler (Cashless)              (channel_id.8003)        - Wajib Bersyarat (Aktif/Nonaktif)
 * idx 38 = Hemat Kargo                     (channel_id.8005)        - Wajib Bersyarat (Aktif/Nonaktif)
 * idx 39 = Instant                         (channel_id.8007)        - Wajib Bersyarat (Aktif/Nonaktif)
 * idx 40 = Instant Prioritas               (channel_id.8008)        - Wajib Bersyarat (Aktif/Nonaktif)
 * idx 41 = Dikirim Dalam Pre-order         (ps_product_pre_order_dts) - Wajib Bersyarat
 * idx 42 = Alasan Gagal                    (et_title_reason)        - Opsional (read-only)
 */

export class ShopeeExcelExporter {
  /**
   * Generates a clean, 100% Shopee Indonesia compliant Mass Upload file.
   * STRICT GUARANTEE: Output file ONLY contains 1 single sheet named "Template".
   */
  public static generateWorkbook(products: ShopeeProductMapping[]): Buffer {
    // Find the official Shopee template
    const candidates = [
      path.join(process.cwd(), 'src', 'templates', 'shopee_basic_template.xlsx'),
      path.join(process.cwd(), 'Shopee_mass_upload_2026-08-31_basic_template.xlsx'),
    ];

    let templateBuffer: Buffer | null = null;
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          templateBuffer = fs.readFileSync(candidate);
          console.log('[ShopeeExcelExporter] Using template:', candidate);
          break;
        }
      } catch {
        // try next
      }
    }

    if (!templateBuffer) {
      throw new Error(
        'Template resmi Shopee tidak ditemukan. ' +
        'Pastikan file ada di: src/templates/shopee_basic_template.xlsx'
      );
    }

    // Read original template
    const srcWorkbook = XLSX.read(templateBuffer, {
      type: 'buffer',
      cellStyles: true,
    });

    const ws = srcWorkbook.Sheets['Template'];
    if (!ws) throw new Error('Sheet "Template" tidak ditemukan di file template Shopee.');

    // Filter out invalid/error products before exporting
    const validProducts = products.filter(
      (p) =>
        p.title &&
        !['halaman tidak ditemukan', 'page not found', '404'].some((t) =>
          p.title.toLowerCase().includes(t)
        ) &&
        p.finalPrice > 0 &&
        p.sku
    );

    if (validProducts.length === 0) {
      throw new Error(
        'Tidak ada produk valid untuk diekspor. ' +
        'Hapus produk error dan tambahkan produk dari URL JakMall yang benar.'
      );
    }

    // Data rows start at row index 6 (= Row 7 in Excel, after 6 header rows)
    let nextRowIdx = 6;

    // Helper: write a cell with correct type
    const writeCell = (
      row: number,
      col: number,
      value: string | number | null | undefined
    ) => {
      if (value === null || value === undefined || value === '') return;
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      ws[cellRef] = {
        v: value,
        t: typeof value === 'number' ? 'n' : 's',
      };
    };

    validProducts.forEach((product) => {
      // Cap weight: Shopee requires 0.01 - 500 kg. Default 0.3 kg if invalid.
      const rawKg = product.weightGrams / 1000;
      const weightKg = rawKg >= 0.01 && rawKg <= 500 ? parseFloat(rawKg.toFixed(2)) : 0.3;

      const variationList = product.variations?.[0]?.options || [];
      const hasVariations = variationList.length > 1;

      if (hasVariations) {
        // Multi-variation product — one row per variant
        variationList.forEach((variant, idx) => {
          const r = nextRowIdx;

          if (idx === 0) {
            // First row: all product info + first variant
            writeCell(r, 1, product.title.substring(0, 255));           // Nama Produk
            writeCell(r, 2, product.description.substring(0, 3000));    // Deskripsi Produk
            writeCell(r, 8, product.sku);                               // SKU Induk
            writeCell(r, 9, 'No (ID)');                                 // Produk Berbahaya
            writeCell(r, 22, product.mainImage || '');                  // Foto Sampul
            writeCell(r, 23, product.images[1] || '');                  // Foto Produk 1
            writeCell(r, 24, product.images[2] || '');                  // Foto Produk 2
            writeCell(r, 31, weightKg);                                  // Berat (kg) - number
            writeCell(r, 32, 20);                                        // Panjang (cm) - number
            writeCell(r, 33, 15);                                        // Lebar (cm) - number
            writeCell(r, 34, 10);                                        // Tinggi (cm) - number
            writeCell(r, 35, 'Nonaktif');                                // Same Day
            writeCell(r, 36, 'Nonaktif');                                // Next Day
            writeCell(r, 37, 'Aktif');                                   // Reguler (Cashless)
            writeCell(r, 38, 'Aktif');                                   // Hemat Kargo
            writeCell(r, 39, 'Nonaktif');                                // Instant
            writeCell(r, 40, 'Nonaktif');                                // Instant Prioritas
          }

          // Each variant row: integration code + variant info + price/stock
          writeCell(r, 10, `INT-${product.sku}`);                       // Kode Integrasi Variasi
          writeCell(r, 11, 'Pilihan');                                   // Nama Variasi 1
          writeCell(r, 12, variant.optionName);                         // Varian untuk Variasi 1
          writeCell(r, 16, variant.price || product.finalPrice);        // Harga - number
          writeCell(r, 17, variant.stock || product.stock || 100);      // Stok - number
          writeCell(r, 18, variant.sku || `${product.sku}-${idx + 1}`); // Kode Variasi

          nextRowIdx++;
        });
      } else {
        // Single product (no variation)
        const r = nextRowIdx;

        writeCell(r, 1, product.title.substring(0, 255));               // Nama Produk - WAJIB
        writeCell(r, 2, product.description.substring(0, 3000));        // Deskripsi - WAJIB
        writeCell(r, 8, product.sku);                                   // SKU Induk
        writeCell(r, 9, 'No (ID)');                                     // Produk Berbahaya
        writeCell(r, 16, product.finalPrice);                           // Harga - WAJIB number
        writeCell(r, 17, product.stock || 100);                         // Stok - number
        writeCell(r, 18, product.sku);                                  // Kode Variasi
        writeCell(r, 22, product.mainImage || '');                      // Foto Sampul - WAJIB
        writeCell(r, 23, product.images[1] || '');                      // Foto Produk 1
        writeCell(r, 24, product.images[2] || '');                      // Foto Produk 2
        writeCell(r, 25, product.images[3] || '');                      // Foto Produk 3
        writeCell(r, 31, weightKg);                                      // Berat (kg) - WAJIB number
        writeCell(r, 32, 20);                                            // Panjang (cm) - number
        writeCell(r, 33, 15);                                            // Lebar (cm) - number
        writeCell(r, 34, 10);                                            // Tinggi (cm) - number
        writeCell(r, 35, 'Nonaktif');                                    // Same Day
        writeCell(r, 36, 'Nonaktif');                                    // Next Day
        writeCell(r, 37, 'Aktif');                                       // Reguler (Cashless)
        writeCell(r, 38, 'Aktif');                                       // Hemat Kargo
        writeCell(r, 39, 'Nonaktif');                                    // Instant
        writeCell(r, 40, 'Nonaktif');                                    // Instant Prioritas

        nextRowIdx++;
      }
    });

    // Update worksheet range to include the new data rows
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: nextRowIdx - 1, c: 42 },
    });

    // CREATE BRAND NEW WORKBOOK containing ONLY the Template sheet
    // This physically removes all other sheet parts (Panduan, Contoh, etc.) from the xlsx zip structure
    const outputWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outputWorkbook, ws, 'Template');

    return XLSX.write(outputWorkbook, {
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
    });
  }
}
