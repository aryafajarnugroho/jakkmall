import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';
import fs from 'fs';
import path from 'path';

export class ShopeeExcelExporter {
  /**
   * Generates a strictly compliant Shopee Indonesia Mass Upload Excel Workbook
   * using the official Shopee Basic Template with embedded tokens & multi-sheet structure.
   */
  public static generateWorkbook(products: ShopeeProductMapping[]): Buffer {
    const templateFilePath = path.join(process.cwd(), 'src/templates/shopee_basic_template.xlsx');

    let workbook: XLSX.WorkBook;
    let templateRows: (string | number)[][] = [];

    if (templateFilePath) {
      // Load the authentic official Shopee workbook template
      workbook = XLSX.readFile(templateFilePath);
      const ws = workbook.Sheets['Template'];
      templateRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      // Keep only rows 1-6 (headers, tokens, format guide)
      templateRows = templateRows.slice(0, 6);
    } else {
      // Fallback: construct standard official Shopee workbook
      workbook = XLSX.utils.book_new();
      templateRows = this.buildFallbackHeaderRows();
    }

    // Append product data rows starting at row 7
    products.forEach((product) => {
      const weightKg = (product.weightGrams / 1000).toFixed(2).replace('.', ',');
      const variationList = product.variations?.[0]?.options || [];

      if (variationList.length > 1) {
        // Multi-variation product
        variationList.forEach((variant, idx) => {
          const row = new Array(43).fill('');
          if (idx === 0) {
            row[0] = ''; // Category left empty or category code (Shopee auto-recommends)
            row[1] = product.title.substring(0, 255);
            row[2] = product.description.substring(0, 3000);
            row[7] = 1; // Min purchase
            row[8] = product.sku;
            row[9] = 'No (ID)';
            row[10] = `INT-${product.sku}`;
            row[11] = 'Model';
            row[12] = variant.optionName;
            row[13] = variant.image || product.mainImage || '';
            row[16] = variant.price || product.finalPrice;
            row[17] = variant.stock || product.stock;
            row[18] = variant.sku || `${product.sku}-${idx + 1}`;
            row[22] = product.mainImage || '';
            row[23] = product.images[1] || '';
            row[24] = product.images[2] || '';
            row[25] = product.images[3] || '';
            row[26] = product.images[4] || '';
            row[31] = weightKg;
            row[35] = 'Aktif'; // Same day
            row[36] = 'Aktif'; // Next day
            row[37] = 'Aktif'; // Reguler
            row[38] = 'Aktif'; // Hemat
            row[39] = 'Aktif'; // Instant
            row[40] = 'Aktif'; // Instant Prioritas
          } else {
            // Subsequent variation rows only require integration code, variation name, option, price, stock, sku
            row[10] = `INT-${product.sku}`;
            row[11] = 'Model';
            row[12] = variant.optionName;
            row[13] = variant.image || product.mainImage || '';
            row[16] = variant.price || product.finalPrice;
            row[17] = variant.stock || product.stock;
            row[18] = variant.sku || `${product.sku}-${idx + 1}`;
          }
          templateRows.push(row);
        });
      } else {
        // Single standard product
        const row = new Array(43).fill('');
        row[0] = ''; // Category
        row[1] = product.title.substring(0, 255);
        row[2] = product.description.substring(0, 3000);
        row[7] = 1; // Min purchase
        row[8] = product.sku;
        row[9] = 'No (ID)';
        row[16] = product.finalPrice;
        row[17] = product.stock || 100;
        row[18] = product.sku;
        row[22] = product.mainImage || '';
        row[23] = product.images[1] || '';
        row[24] = product.images[2] || '';
        row[25] = product.images[3] || '';
        row[26] = product.images[4] || '';
        row[31] = weightKg;
        row[35] = 'Aktif';
        row[36] = 'Aktif';
        row[37] = 'Aktif';
        row[38] = 'Aktif';
        row[39] = 'Aktif';
        row[40] = 'Aktif';
        templateRows.push(row);
      }
    });

    const newWorksheet = XLSX.utils.aoa_to_sheet(templateRows);
    workbook.Sheets['Template'] = newWorksheet;

    if (!workbook.SheetNames.includes('Template')) {
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Template');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private static buildFallbackHeaderRows(): (string | number)[][] {
    const row1 = [
      'ps_category|0|0', 'ps_product_name|1|0', 'ps_product_description|1|0',
      'ps_maximum_purchase_quantity|0|0', 'ps_maximum_purchase_quantity_start_date|0|0',
      'ps_maximum_purchase_quantity_time_period|0|0', 'ps_maximum_purchase_quantity_end_date|0|0',
      'ps_minimum_purchase_quantity|0|0', 'ps_sku_parent_short|0|0', 'ps_dangerous_goods|0|0',
      'et_title_variation_integration_no|0|0', 'et_title_variation_1|0|0',
      'et_title_option_for_variation_1|0|0', 'et_title_image_per_variation|0|3',
      'et_title_variation_2|0|0', 'et_title_option_for_variation_2|0|0',
      'ps_price|1|1', 'ps_stock|0|1', 'ps_sku_short|0|0', 'ps_new_size_chart|0|1',
      'et_title_size_chart|0|3', 'ps_gtin_code|0|0', 'ps_item_cover_image|1|3',
      'ps_item_image_1|0|3', 'ps_item_image_2|0|3', 'ps_item_image_3|0|3',
      'ps_item_image_4|0|3', 'ps_item_image_5|0|3', 'ps_item_image_6|0|3',
      'ps_item_image_7|0|3', 'ps_item_image_8|0|3', 'ps_weight|1|1',
      'ps_length|0|1', 'ps_width|0|1', 'ps_height|0|1', 'channel_id.8001|0|0',
      'channel_id.8002|0|0', 'channel_id.8003|0|0', 'channel_id.8005|0|0',
      'channel_id.8007|0|0', 'channel_id.8008|0|0', 'ps_product_pre_order_dts|0|1',
      'et_title_reason|0|0'
    ];
    const row2 = ['basic', '3b35da8ca9eeb491f02729b66fb6e8f7', '0', '391814440'];
    const row3 = [
      'Kategori', 'Nama Produk', 'Deskripsi Produk', 'Maks. Jumlah Pembelian',
      'Maks. Jumlah Pembelian - Tanggal Mulai', 'Maks. Jumlah Pembelian - Jumlah Hari',
      'Maks. Jumlah Pembelian - Tanggal Berakhir', 'Min. Jumlah Pembelian', 'SKU Induk',
      'Produk Berbahaya', 'Kode Integrasi Variasi', 'Nama Variasi 1', 'Varian untuk Variasi 1',
      'Foto Produk per Varian', 'Nama Variasi 2', 'Varian untuk Variasi 2', 'Harga', 'Stok',
      'Kode Variasi', 'Template Panduan Ukuran', 'Foto Panduan Ukuran', 'GTIN', 'Foto Sampul',
      'Foto Produk 1', 'Foto Produk 2', 'Foto Produk 3', 'Foto Produk 4', 'Foto Produk 5',
      'Foto Produk 6', 'Foto Produk 7', 'Foto Produk 8', 'Berat', 'Panjang', 'Lebar', 'Tinggi',
      'Same Day', 'Next Day', 'Reguler (Cashless)', 'Hemat Kargo', 'Instant', 'Instant Prioritas',
      'Dikirim Dalam Pre-order', 'Alasan Gagal'
    ];
    const row4 = new Array(43).fill('Opsional');
    row4[1] = 'Wajib';
    row4[2] = 'Wajib';
    row4[16] = 'Wajib';
    row4[22] = 'Wajib';
    row4[31] = 'Wajib';
    const row5 = new Array(43).fill('');
    const row6 = new Array(43).fill('');

    return [row1, row2, row3, row4, row5, row6];
  }
}
