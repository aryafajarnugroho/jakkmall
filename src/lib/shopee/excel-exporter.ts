import * as XLSX from 'xlsx';
import { ShopeeProductMapping } from '@/types/product';

export class ShopeeExcelExporter {
  /**
   * Generates a Shopee Seller Center compatible Mass Upload Excel Workbook
   */
  public static generateWorkbook(products: ShopeeProductMapping[]): Buffer {
    // Official Shopee Mass Upload Standard Columns
    const headers = [
      'Kategori ID',
      'Nama Produk',
      'Deskripsi Produk',
      'SKU Induk',
      'Harga',
      'Stok',
      'Berat (Gram)',
      'Foto Utama',
      'Foto 1',
      'Foto 2',
      'Foto 3',
      'Foto 4',
      'Nama Integrasi Variasi',
      'Pilihan Variasi 1',
      'Harga Variasi 1',
      'Stok Variasi 1',
      'SKU Variasi 1',
      'Kondisi',
      'Pre-Order',
      'Dikirim Dalam (Hari)',
    ];

    const rows: (string | number)[][] = [];

    products.forEach((product) => {
      const variationList = product.variations?.[0]?.options || [];

      if (variationList.length > 0) {
        variationList.forEach((variant, index) => {
          rows.push([
            product.categoryId || 100012,
            product.title,
            product.description,
            product.sku,
            variant.price || product.finalPrice,
            variant.stock || product.stock,
            product.weightGrams,
            product.mainImage || '',
            product.images[1] || '',
            product.images[2] || '',
            product.images[3] || '',
            product.images[4] || '',
            'Model',
            variant.optionName,
            variant.price,
            variant.stock,
            variant.sku,
            product.condition || 'Baru',
            'Tidak',
            2,
          ]);
        });
      } else {
        rows.push([
          product.categoryId || 100012,
          product.title,
          product.description,
          product.sku,
          product.finalPrice,
          product.stock,
          product.weightGrams,
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
          product.condition || 'Baru',
          'Tidak',
          2,
        ]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shopee Mass Upload');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
