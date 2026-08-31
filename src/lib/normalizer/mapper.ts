import { JakmallProduct, ShopeeProductMapping } from '@/types/product';
import { CategoryMatcher } from '@/lib/normalizer/category-matcher';

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

    // 1. Title formatting (Shopee max 120 chars, clean symbols, NO EMOJIS)
    let formattedTitle = this.removeEmojis((options.titlePrefix || '') + jakmall.title.trim() + (options.titleSuffix || ''));
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

    const matchedCat = CategoryMatcher.matchCategoryId(formattedTitle, jakmall.category);

    return {
      id,
      sourceUrl: jakmall.sourceUrl,
      title: formattedTitle,
      description: formattedDescription,
      categoryName: matchedCat.name,
      categoryId: matchedCat.id,
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
   * Remove any unicode emojis and special symbols
   */
  public static removeEmojis(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}-\u{2B55}\u{E0020}-\u{E007F}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FAFF}]/gu, '')
      .replace(/[\u2728\u2705\u274C\u2757\u2753\u26A0\u26A1\u2600\u2601\u2602\u2603\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638\u2639\u263A\u2640\u2642\u2648\u2649\u264A\u264B\u264C\u264D\u264E\u264F\u2650\u2651\u2652\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2693\u2694\u2695\u2696\u2697\u2698\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0\u26F1\u26F2\u26F3\u26F4\u26F5\u26F7\u26F8\u26F9\u26FA\u26FD]/g, '')
      .trim();
  }

  /**
   * Clean and structure product description to match marketplace best-practice without ANY emojis
   */
  private static formatShopeeDescription(jakmall: JakmallProduct): string {
    const raw = jakmall.description || '';
    const cleanRaw = this.removeEmojis(raw);
    const cleanTitle = this.removeEmojis(jakmall.title);

    const lines = cleanRaw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const intro = `${cleanTitle}\n\nProduk 100% Baru & Original dengan kualitas terjamin. Garansi retur bila barang rusak saat diterima.`;

    const specsHeader = `\n\nSPESIFIKASI PRODUK:\n`;
    const specsBody = lines.length > 0 ? lines.join('\n') : '- Kualitas Material Premium\n- Fungsi & Fitur Lengkap\n- Awet dan Tahan Lama';

    const shippingInfo = `\n\nKETENTUAN PENGIRIMAN:\n- Ready Stock, siap dikirim di hari yang sama untuk order sebelum jam 16:00 WIB\n- Dilapisi Bubble Wrap tebal (GRATIS) untuk keamanan produk`;

    return `${intro}${specsHeader}${specsBody}${shippingInfo}`;
  }
}
