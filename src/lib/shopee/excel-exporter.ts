import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';
import { CategoryMatcher } from '@/lib/normalizer/category-matcher';
import fs from 'fs';
import path from 'path';

/**
 * EXACT COLUMN MAPPING (0-indexed) from official Shopee Indonesia Basic Template
 *
 * Col  0: ps_category                      | Kategori (Number)
 * Col  1: ps_product_name                  | Nama Produk (String, 5-255 chars)
 * Col  2: ps_product_description           | Deskripsi Produk (String, 20-3000 chars)
 * Col  8: ps_sku_parent_short              | SKU Induk (String)
 * Col 10: et_title_variation_integration_no| Kode Integrasi Variasi (String)
 * Col 11: et_title_variation_1             | Nama Variasi 1 (String, max 14 chars)
 * Col 12: et_title_option_for_variation_1  | Varian untuk Variasi 1 (String, max 20 chars)
 * Col 13: et_title_image_per_variation     | Foto Produk per Varian (URL)
 * Col 16: ps_price                         | Harga (Number, 99 - 150000000)
 * Col 17: ps_stock                         | Stok (Number, 0 - 10000000)
 * Col 18: ps_sku_short                     | Kode Variasi (String, max 100 chars)
 * Col 22: ps_item_cover_image              | Foto Sampul (URL)
 * Col 23..30: ps_item_image_1..8           | Foto Produk 1..8 (URLs)
 * Col 31: ps_weight                        | Berat (kg, Number e.g. 0.3, 0.6)
 * Col 32: ps_length                        | Panjang (cm, Number)
 * Col 33: ps_width                         | Lebar (cm, Number)
 * Col 34: ps_height                        | Tinggi (cm, Number)
 * Col 37: channel_id.8003                  | Reguler (Cashless) ('Aktif')
 */
export class ShopeeExcelExporter {
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
      throw new Error('Template resmi Shopee tidak ditemukan.');
    }

    const workbook = XLSX.read(templateBuffer, {
      type: 'buffer',
      cellStyles: true,
    });

    const ws = workbook.Sheets['Template'];
    if (!ws) throw new Error('Sheet "Template" tidak ditemukan di file template Shopee.');

    // Clear all existing data rows and any reason cells (from row index 6 onwards)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AQ100');
    for (let r = 6; r <= Math.max(range.e.r, 200); r++) {
      for (let c = 0; c <= 50; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        delete ws[cellRef];
      }
    }

    // Filter out invalid products
    const validProducts = products.filter(
      (p) =>
        p.title &&
        !['halaman tidak ditemukan', 'page not found', '404', 'not found'].some((t) =>
          p.title.toLowerCase().includes(t)
        ) &&
        p.finalPrice > 0 &&
        p.sku
    );

    if (validProducts.length === 0) {
      throw new Error('Tidak ada produk valid untuk diekspor.');
    }

    let nextRowIdx = 6; // Row 7 in Excel

    const writeCell = (
      row: number,
      col: number,
      value: string | number | null | undefined,
      type?: 's' | 'n'
    ) => {
      if (value === null || value === undefined || value === '') return;
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });

      if (type === 'n' || typeof value === 'number') {
        const num = typeof value === 'number' ? value : Number(value);
        if (!isNaN(num)) {
          ws[cellRef] = { v: num, t: 'n' };
          return;
        }
      }

      ws[cellRef] = { v: String(value).trim(), t: 's' };
    };

    validProducts.forEach((product) => {
      // Normalize weight in grams (50g to 50000g) as required by Shopee Basic Template
      const weightGrams = Math.max(Math.min(Math.round(product.weightGrams || 250), 50000), 50);

      // Ensure valid category ID
      const catMatch = CategoryMatcher.matchCategoryId(product.title, product.categoryName);
      const catId = catMatch.id;

      // Clean title & description
      let cleanTitle = (product.title || '').trim().replace(/\s+/g, ' ');
      if (cleanTitle.length > 255) cleanTitle = cleanTitle.substring(0, 252) + '...';

      let cleanDesc = (product.description || '').trim();
      if (cleanDesc.length < 20) {
        cleanDesc = `${cleanTitle}\n\nProduk berkualitas tinggi siap kirim dengan garansi terjamin.`;
      }
      if (cleanDesc.length > 3000) cleanDesc = cleanDesc.substring(0, 2997) + '...';

      // Images
      const allImages = Array.from(
        new Set([product.mainImage, ...(product.images || [])].filter((img) => img && img.startsWith('http')))
      );
      const coverImage = allImages[0] || product.mainImage || '';

      const parentSku = product.sku.trim();
      const variationList = product.variations?.[0]?.options || [];
      const hasVariations = variationList.length > 1;

      if (hasVariations) {
        // Multi-variation product
        variationList.forEach((variant, idx) => {
          const r = nextRowIdx;
          const varPrice = Math.round(variant.price && variant.price > 0 ? variant.price : product.finalPrice);
          const varStock = typeof variant.stock === 'number' ? variant.stock : (product.stock || 100);

          let varSku = (variant.sku || `${parentSku}-V${idx + 1}`).trim();
          if (varSku === parentSku) {
            varSku = `${parentSku}-V${idx + 1}`;
          }

          const varImage = variant.image && variant.image.startsWith('http') ? variant.image : coverImage;

          let optName = (variant.optionName || `Varian ${idx + 1}`).trim();
          if (optName.length > 20) optName = optName.substring(0, 20);

          // Product metadata on all variation rows
          writeCell(r, 0, catId, 'n');                        // Kategori (Col 0)
          writeCell(r, 1, cleanTitle, 's');                   // Nama Produk (Col 1)
          writeCell(r, 2, cleanDesc, 's');                    // Deskripsi Produk (Col 2)
          writeCell(r, 8, parentSku, 's');                    // SKU Induk (Col 8)

          // Variation attributes
          writeCell(r, 10, `INT-${parentSku}`, 's');          // Kode Integrasi Variasi (Col 10)
          writeCell(r, 11, 'Pilihan', 's');                   // Nama Variasi 1 (Col 11)
          writeCell(r, 12, optName, 's');                     // Varian untuk Variasi 1 (Col 12)
          writeCell(r, 13, varImage, 's');                    // Foto Produk per Varian (Col 13)
          writeCell(r, 16, varPrice, 'n');                    // Harga (Col 16)
          writeCell(r, 17, varStock, 'n');                    // Stok (Col 17)
          writeCell(r, 18, varSku, 's');                      // Kode Variasi (Col 18)

          // Images
          writeCell(r, 22, coverImage, 's');                  // Foto Sampul (Col 22)
          if (idx === 0) {
            for (let imgIdx = 1; imgIdx <= 8; imgIdx++) {
              if (allImages[imgIdx]) {
                writeCell(r, 22 + imgIdx, allImages[imgIdx], 's'); // Foto Produk 1..8 (Col 23..30)
              }
            }
          }

          // Logistics & shipping on EVERY variation row
          writeCell(r, 31, weightGrams, 'n');                 // Berat dalam gram (Col 31)
          writeCell(r, 32, 20, 'n');                          // Panjang (Col 32)
          writeCell(r, 33, 15, 'n');                          // Lebar (Col 33)
          writeCell(r, 34, 10, 'n');                          // Tinggi (Col 34)
          writeCell(r, 37, 'Aktif', 's');                     // Reguler Cashless ONLY

          nextRowIdx++;
        });
      } else {
        // Single product without variations
        const r = nextRowIdx;
        const finalPrice = Math.round(product.finalPrice || 10000);
        const stock = product.stock || 100;

        writeCell(r, 0, catId, 'n');                          // Kategori (Col 0)
        writeCell(r, 1, cleanTitle, 's');                     // Nama Produk (Col 1)
        writeCell(r, 2, cleanDesc, 's');                      // Deskripsi Produk (Col 2)
        writeCell(r, 8, parentSku, 's');                      // SKU Induk (Col 8)

        writeCell(r, 16, finalPrice, 'n');                    // Harga (Col 16)
        writeCell(r, 17, stock, 'n');                         // Stok (Col 17)
        writeCell(r, 18, parentSku, 's');                     // Kode Variasi (Col 18)

        writeCell(r, 22, coverImage, 's');                    // Foto Sampul (Col 22)
        for (let imgIdx = 1; imgIdx <= 8; imgIdx++) {
          if (allImages[imgIdx]) {
            writeCell(r, 22 + imgIdx, allImages[imgIdx], 's'); // Foto Produk 1..8 (Col 23..30)
          }
        }

        // Logistics & shipping
        writeCell(r, 31, weightGrams, 'n');                   // Berat dalam gram (Col 31)
        writeCell(r, 32, 20, 'n');                            // Panjang (Col 32)
        writeCell(r, 33, 15, 'n');                            // Lebar (Col 33)
        writeCell(r, 34, 10, 'n');                            // Tinggi (Col 34)
        writeCell(r, 37, 'Aktif', 's');                       // Reguler Cashless ONLY

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
