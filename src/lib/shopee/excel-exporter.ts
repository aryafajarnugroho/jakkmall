import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';

export class ShopeeExcelExporter {
  /**
   * Generates a strictly compliant Shopee Indonesia Mass Upload Excel Workbook
   */
  public static generateWorkbook(products: ShopeeProductMapping[]): Buffer {
    // Row 1: Shopee Technical Field Keys
    const row1_keys = [
      'ps_category_list_id',
      'ps_item_name',
      'ps_item_description',
      'ps_item_sku',
      'ps_price',
      'ps_stock',
      'ps_weight',
      'ps_img_1',
      'ps_img_2',
      'ps_img_3',
      'ps_img_4',
      'ps_img_5',
      'ps_tier_variation_1_name',
      'ps_tier_variation_1_option',
      'ps_tier_variation_1_price',
      'ps_tier_variation_1_stock',
      'ps_tier_variation_1_sku',
    ];

    // Row 2: Shopee Indonesian Column Headers
    const row2_labels = [
      '*Kategori',
      '*Nama Produk',
      '*Deskripsi Produk',
      'SKU Induk',
      '*Harga',
      '*Stok',
      '*Berat (kg)',
      '*Foto Sampul',
      'Foto Produk 1',
      'Foto Produk 2',
      'Foto Produk 3',
      'Foto Produk 4',
      'Nama Variasi 1',
      'Pilihan untuk Variasi 1',
      'Harga Variasi',
      'Stok Variasi',
      'Kode Variasi',
    ];

    // Row 3: Mandatory vs Optional Indicator
    const row3_requirements = [
      'Wajib',
      'Wajib',
      'Wajib',
      'Opsional',
      'Wajib',
      'Wajib',
      'Wajib',
      'Wajib',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
    ];

    const dataRows: (string | number)[][] = [];

    products.forEach((product) => {
      // Weight in kg (Shopee format accepts grams converted or decimal kg)
      const weightKg = Number((product.weightGrams / 1000).toFixed(2)) || 0.25;
      const variationList = product.variations?.[0]?.options || [];

      if (variationList.length > 1) {
        // Multi variation rows
        variationList.forEach((variant, idx) => {
          dataRows.push([
            idx === 0 ? (product.categoryId || 100012) : '',
            idx === 0 ? product.title : '',
            idx === 0 ? product.description : '',
            idx === 0 ? product.sku : '',
            '', // base price empty when variations exist
            '', // base stock empty when variations exist
            idx === 0 ? weightKg : '',
            idx === 0 ? (product.mainImage || '') : '',
            idx === 0 ? (product.images[1] || '') : '',
            idx === 0 ? (product.images[2] || '') : '',
            idx === 0 ? (product.images[3] || '') : '',
            idx === 0 ? (product.images[4] || '') : '',
            'Model',
            variant.optionName,
            variant.price || product.finalPrice,
            variant.stock || product.stock,
            variant.sku || `${product.sku}-${idx + 1}`,
          ]);
        });
      } else {
        // Single product row without sub-variations
        dataRows.push([
          product.categoryId || 100012,
          product.title,
          product.description,
          product.sku,
          product.finalPrice,
          product.stock,
          weightKg,
          product.mainImage || '',
          product.images[1] || '',
          product.images[2] || '',
          product.images[3] || '',
          product.images[4] || '',
          '',
          '',
          '',
          '',
          '',
        ]);
      }
    });

    const fullSheetData = [row1_keys, row2_labels, row3_requirements, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

    const workbook = XLSX.utils.book_new();
    // Shopee requires sheet name to be "template" or "Template"
    XLSX.utils.book_append_sheet(workbook, worksheet, 'template');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
