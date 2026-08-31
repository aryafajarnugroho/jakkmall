import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';
import fs from 'fs';
import path from 'path';

export class ShopeeExcelExporter {
  /**
   * Generates a strictly compliant Shopee Indonesia Mass Upload Excel Workbook
   * by APPENDING rows directly into the original template worksheet cells
   * instead of replacing the sheet — preserving all metadata Shopee validates.
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
          break;
        }
      } catch {
        // try next
      }
    }

    if (!templateBuffer) {
      throw new Error(
        'Template resmi Shopee tidak ditemukan di src/templates/shopee_basic_template.xlsx. ' +
        'Pastikan file template Shopee sudah tersedia di folder project.'
      );
    }

    // Read with full cell preservation — critical for Shopee validator
    const workbook = XLSX.read(templateBuffer, {
      type: 'buffer',
      cellStyles: true,
      cellDates: true,
    });

    const ws = workbook.Sheets['Template'];
    if (!ws) throw new Error('Sheet "Template" tidak ditemukan di file template Shopee.');

    // Find how many rows are already in the sheet (rows 1-6 are headers)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AQ6');
    // Data rows start at row index 6 (row 7 in Excel, 0-indexed)
    let nextRowIdx = Math.max(range.e.r + 1, 6);

    // Filter out invalid/error products
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
        'Tidak ada produk valid untuk diekspor. Hapus produk error dan tambahkan produk dari URL JakMall yang benar.'
      );
    }

    // Helper: write a cell value with correct type into the worksheet
    const writeCell = (
      ws: XLSX.WorkSheet,
      row: number,
      col: number,
      value: string | number | null | undefined
    ) => {
      if (value === null || value === undefined || value === '') return;
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cellType = typeof value === 'number' ? 'n' : 's';
      ws[cellRef] = { v: value, t: cellType };
    };

    validProducts.forEach((product) => {
      // Cap weight: Shopee requires 0.01 - 500 kg
      const rawKg = product.weightGrams / 1000;
      const weightKg = rawKg >= 0.01 && rawKg <= 500 ? parseFloat(rawKg.toFixed(2)) : 0.3;

      const variationList = product.variations?.[0]?.options || [];

      if (variationList.length > 1) {
        variationList.forEach((variant, idx) => {
          const r = nextRowIdx;
          if (idx === 0) {
            writeCell(ws, r, 1, product.title.substring(0, 255));
            writeCell(ws, r, 2, product.description.substring(0, 3000));
            writeCell(ws, r, 7, 1);
            writeCell(ws, r, 8, product.sku);
            writeCell(ws, r, 9, 'No (ID)');
            writeCell(ws, r, 10, `INT-${product.sku}`);
            writeCell(ws, r, 11, 'Model');
            writeCell(ws, r, 12, variant.optionName);
            writeCell(ws, r, 16, variant.price || product.finalPrice);
            writeCell(ws, r, 17, variant.stock || product.stock);
            writeCell(ws, r, 18, variant.sku || `${product.sku}-${idx + 1}`);
            writeCell(ws, r, 22, product.mainImage || '');
            writeCell(ws, r, 23, product.images[1] || '');
            writeCell(ws, r, 31, weightKg);
            writeCell(ws, r, 35, 'Aktif');
            writeCell(ws, r, 36, 'Aktif');
            writeCell(ws, r, 37, 'Aktif');
            writeCell(ws, r, 38, 'Aktif');
            writeCell(ws, r, 39, 'Aktif');
            writeCell(ws, r, 40, 'Aktif');
          } else {
            writeCell(ws, r, 10, `INT-${product.sku}`);
            writeCell(ws, r, 11, 'Model');
            writeCell(ws, r, 12, variant.optionName);
            writeCell(ws, r, 16, variant.price || product.finalPrice);
            writeCell(ws, r, 17, variant.stock || product.stock);
            writeCell(ws, r, 18, variant.sku || `${product.sku}-${idx + 1}`);
          }
          nextRowIdx++;
        });
      } else {
        // Single product (no variation)
        const r = nextRowIdx;
        writeCell(ws, r, 1, product.title.substring(0, 255));
        writeCell(ws, r, 2, product.description.substring(0, 3000));
        writeCell(ws, r, 7, 1);
        writeCell(ws, r, 8, product.sku);
        writeCell(ws, r, 9, 'No (ID)');
        writeCell(ws, r, 16, product.finalPrice);
        writeCell(ws, r, 17, product.stock || 100);
        writeCell(ws, r, 18, product.sku);
        writeCell(ws, r, 22, product.mainImage || '');
        writeCell(ws, r, 23, product.images[1] || '');
        writeCell(ws, r, 24, product.images[2] || '');
        writeCell(ws, r, 31, weightKg);
        writeCell(ws, r, 35, 'Aktif');
        writeCell(ws, r, 36, 'Aktif');
        writeCell(ws, r, 37, 'Aktif');
        writeCell(ws, r, 38, 'Aktif');
        writeCell(ws, r, 39, 'Aktif');
        writeCell(ws, r, 40, 'Aktif');
        nextRowIdx++;
      }
    });

    // Update the sheet's range to include the new data rows
    const newRange = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: nextRowIdx - 1, c: 42 },
    });
    ws['!ref'] = newRange;

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
    });
  }
}
