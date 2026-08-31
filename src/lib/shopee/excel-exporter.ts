import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';
import { CategoryMatcher } from '@/lib/normalizer/category-matcher';
import fs from 'fs';
import path from 'path';

/**
 * EXACT COLUMN MAPPING (0-indexed) from official Shopee Indonesia Basic Template
 * Based on: Shopee_mass_upload_2026-08-31_basic_template.xlsx
 */
export class ShopeeExcelExporter {
  /**
   * Generates a 100% Shopee compliant Mass Upload workbook.
   * Fixes:
   * 1. Shipping channels: Only sets Reguler (idx 37) to 'Aktif'. Leaves unsupported channels empty
   *    so Shopee does not error with "ID[8001]/ID[8002] channelToggleStr[Nonaktif]".
   * 2. Dangerous goods: Left empty so Shopee defaults to "Tidak Berbahaya".
   * 3. Preserves all official sheets so Shopee accepts the file signature.
   */
  public static generateWorkbook(products: ShopeeProductMapping[]): Buffer {
    const candidates = [
      path.join(process.cwd(), 'src', 'templates', 'shopee_basic_template.xlsx'),
      path.join(process.cwd(), 'Shopee_mass_upload_2026-08-31_basic_template.xlsx'),
    ];

    let templateBuffer: Buffer | null = null;
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          templateBuffer = fs.readFileSync(candidate);
          break;
        }
      } catch {
        // try next
      }
    }

    if (!templateBuffer) {
      throw new Error(
        'Template resmi Shopee tidak ditemukan di src/templates/shopee_basic_template.xlsx'
      );
    }

    const workbook = XLSX.read(templateBuffer, {
      type: 'buffer',
      cellStyles: true,
    });

    const ws = workbook.Sheets['Template'];
    if (!ws) throw new Error('Sheet "Template" tidak ditemukan di file template Shopee.');

    // Filter out invalid products
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
      throw new Error('Tidak ada produk valid untuk diekspor.');
    }

    let nextRowIdx = 6;

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
      // Normalise weight: 0.1 - 50 kg, default 0.3 kg
      const rawKg = (product.weightGrams || 300) / 1000;
      const weightKg = rawKg >= 0.05 && rawKg <= 50 ? parseFloat(rawKg.toFixed(2)) : 0.3;
      const catId = product.categoryId || CategoryMatcher.matchCategoryId(product.title, product.categoryName).id;

      const variationList = product.variations?.[0]?.options || [];
      const hasVariations = variationList.length > 1;

      if (hasVariations) {
        variationList.forEach((variant, idx) => {
          const r = nextRowIdx;

          if (idx === 0) {
            writeCell(r, 0, catId);                                     // Kategori - WAJIB Shopee Category ID
            writeCell(r, 1, product.title.substring(0, 255));           // Nama Produk
            writeCell(r, 2, product.description.substring(0, 3000));    // Deskripsi Produk
            writeCell(r, 8, product.sku);                               // SKU Induk
            writeCell(r, 22, product.mainImage || '');                  // Foto Sampul
            writeCell(r, 23, product.images[1] || '');                  // Foto Produk 1
            writeCell(r, 24, product.images[2] || '');                  // Foto Produk 2
            writeCell(r, 31, weightKg);                                  // Berat (kg)
            writeCell(r, 32, 20);                                        // Panjang (cm)
            writeCell(r, 33, 15);                                        // Lebar (cm)
            writeCell(r, 34, 10);                                        // Tinggi (cm)
            writeCell(r, 37, 'Aktif');                                   // Reguler (Cashless) - ONLY enable supported channel
          }

          writeCell(r, 10, `INT-${product.sku}`);                       // Kode Integrasi Variasi
          writeCell(r, 11, 'Pilihan');                                   // Nama Variasi 1
          writeCell(r, 12, variant.optionName);                         // Varian untuk Variasi 1
          writeCell(r, 16, variant.price || product.finalPrice);        // Harga
          writeCell(r, 17, variant.stock || product.stock || 100);      // Stok
          writeCell(r, 18, variant.sku || `${product.sku}-${idx + 1}`); // Kode Variasi

          nextRowIdx++;
        });
      } else {
        const r = nextRowIdx;

        writeCell(r, 0, catId);                                         // Kategori - WAJIB Shopee Category ID
        writeCell(r, 1, product.title.substring(0, 255));               // Nama Produk - WAJIB
        writeCell(r, 2, product.description.substring(0, 3000));        // Deskripsi - WAJIB
        writeCell(r, 8, product.sku);                                   // SKU Induk
        writeCell(r, 16, product.finalPrice);                           // Harga - WAJIB number
        writeCell(r, 17, product.stock || 100);                         // Stok - number
        writeCell(r, 18, product.sku);                                  // Kode Variasi
        writeCell(r, 22, product.mainImage || '');                      // Foto Sampul - WAJIB
        writeCell(r, 23, product.images[1] || '');                      // Foto Produk 1
        writeCell(r, 24, product.images[2] || '');                      // Foto Produk 2
        writeCell(r, 31, weightKg);                                      // Berat (kg) - WAJIB number
        writeCell(r, 32, 20);                                            // Panjang (cm) - number
        writeCell(r, 33, 15);                                            // Lebar (cm) - number
        writeCell(r, 34, 10);                                            // Tinggi (cm) - number
        writeCell(r, 37, 'Aktif');                                       // Reguler (Cashless) - ONLY enable supported channel

        nextRowIdx++;
      }
    });

    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: nextRowIdx - 1, c: 42 },
    });

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
    });
  }
}
