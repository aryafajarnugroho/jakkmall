import { JakmallProduct, ShopeeProductMapping } from '@/types/product';

export interface NormalizerOptions {
  markupPercent?: number; // e.g. 15 for 15%
  fixedMargin?: number;   // e.g. 5000 for Rp 5.000 admin/packaging fee
  titlePrefix?: string;   // e.g. "[READY STOCK] "
  titleSuffix?: string;
  defaultWeightGrams?: number;
}

export class ProductNormalizer {
  /**
   * Normalize and map a Jakmall Product into a Shopee-ready Product Schema
   */
  public static mapToShopee(
    jakmall: JakmallProduct,
    options: NormalizerOptions = {}
  ): ShopeeProductMapping {
    const markupPercent = options.markupPercent ?? 15;
    const fixedMargin = options.fixedMargin ?? 2500;

    // 1. Title formatting (Shopee max 120 chars, clean symbols)
    let formattedTitle = (options.titlePrefix || '') + jakmall.title.trim() + (options.titleSuffix || '');
    if (formattedTitle.length > 120) {
      formattedTitle = formattedTitle.substring(0, 117) + '...';
    }

    // 2. Price calculation with margin
    const calculatePrice = (base: number) => {
      const calculated = Math.round((base * (1 + markupPercent / 100) + fixedMargin) / 100) * 100;
      return Math.max(calculated, 1000);
    };

    const finalBasePrice = calculatePrice(jakmall.originalPrice);

    // 3. Description enrichment & structure for Shopee
    const formattedDescription = this.formatShopeeDescription(jakmall);

    // 4. Map Variations
    const mappedVariations = [
      {
        name: 'Pilihan Model / Varian',
        options: jakmall.variations.map((v) => ({
          optionName: v.name,
          price: calculatePrice(v.price || jakmall.originalPrice),
          stock: v.stock || 50,
          sku: v.sku || `${jakmall.sku}-${v.name.replace(/\s+/g, '').toUpperCase()}`,
          image: v.image || jakmall.mainImage,
        })),
      },
    ];

    // 5. Gather unique image list (Shopee max 9 images)
    const allImages = Array.from(
      new Set([jakmall.mainImage, ...(jakmall.galleryImages || [])].filter(Boolean))
    ).slice(0, 9);

    const id = 'SP-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    return {
      id,
      sourceUrl: jakmall.sourceUrl,
      title: formattedTitle,
      description: formattedDescription,
      categoryName: jakmall.category || 'Elektronik & Aksesoris',
      categoryId: 100012, // Default Shopee General Category ID
      basePrice: jakmall.originalPrice,
      markupPercent,
      fixedMargin,
      finalPrice: finalBasePrice,
      stock: jakmall.stock || 100,
      weightGrams: jakmall.weightGrams || options.defaultWeightGrams || 250,
      condition: 'Baru',
      mainImage: allImages[0] || '',
      images: allImages,
      sku: jakmall.sku || 'JKM-' + id,
      variations: mappedVariations,
      status: 'EXTRACTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Clean and structure product description to match marketplace best-practice
   */
  private static formatShopeeDescription(jakmall: JakmallProduct): string {
    const raw = jakmall.description || '';
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const intro = `✨ ${jakmall.title} ✨\n\nProduk 100% Baru & Original dengan kualitas terjamin. Garansi retur bila barang rusak saat diterima.`;

    const specsHeader = `\n\n📌 SPESIFIKASI PRODUK:\n`;
    const specsBody = lines.length > 0 ? lines.join('\n') : '- Kualitas Material Premium\n- Fungsi & Fitur Lengkap\n- Awet dan Tahan Lama';

    const shippingInfo = `\n\n📦 KETENTUAN PENGIRIMAN:\n- Ready Stock, siap dikirim di hari yang sama untuk order sebelum jam 16:00 WIB\n- Dilapisi Bubble Wrap tebal (GRATIS) untuk keamanan produk`;

    return `${intro}${specsHeader}${specsBody}${shippingInfo}`;
  }
}
