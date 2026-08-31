/**
 * Shopee Category Matcher
 * Maps product titles and JakMall categories into valid Shopee Indonesia Category IDs.
 * Extracted from official Shopee Mass Upload Category Reference (1,722 category paths).
 */

interface CategoryRule {
  keywords: string[];
  categoryId: number;
  categoryName: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  // Lampu & Lighting
  {
    keywords: ['lampu taman', 'solar', 'sensor cahaya', 'lampu dinding', 'lampu tidur', 'lampu meja', 'lampu led', 'bohlam', 'lampu'],
    categoryId: 100719,
    categoryName: 'Perlengkapan Rumah/Lampu',
  },
  // Cangkir, Mug, Gelas, Teh
  {
    keywords: ['cangkir', 'mug', 'gelas', 'teh', 'tea cup', 'infuser', 'tumbler', 'botol minum', 'termos'],
    categoryId: 101240,
    categoryName: 'Perlengkapan Rumah/Peralatan Makan/Cangkir, Mug, & Gelas',
  },
  // Peralatan Makan & Dapur
  {
    keywords: ['sendok', 'garpu', 'sumpit', 'piring', 'mangkok', 'alat makan', 'pisau dapur', 'wajan', 'panci', 'spatula'],
    categoryId: 101244,
    categoryName: 'Perlengkapan Rumah/Peralatan Makan/Alat Makan',
  },
  // Pompa Vakum, Vacuum Bag, Storage Organizer
  {
    keywords: ['pompa vakum', 'vacuum pump', 'vacuum bag', 'kantong vakum', 'tas kompresi', 'storage bag', 'organizer travel', 'travel bag'],
    categoryId: 100325,
    categoryName: 'Koper & Tas Travel/Aksesoris Travel/Organizer Travel',
  },
  // Box & Organizer Rumah
  {
    keywords: ['organizer', 'box penyimpanan', 'keranjang', 'kotak sepatu', 'rak penyimpanan', 'wadah'],
    categoryId: 101254,
    categoryName: 'Perlengkapan Rumah/Organizer Rumah/Box, Tas, & Keranjang Penyimpanan',
  },
  // Elektronik Rumah Tangga
  {
    keywords: ['blender', 'mixer', 'air fryer', 'rice cooker', 'kipas angin', 'humidifier', 'diffuser', 'pembersih udara'],
    categoryId: 100650,
    categoryName: 'Elektronik Rumah Tangga/Peralatan Dapur Kecil',
  },
  // Handphone & Aksesoris
  {
    keywords: ['kabel data', 'charger', 'powerbank', 'casing hp', 'case hp', 'holder hp', 'stand hp', 'tempered glass', 'headset', 'earphone', 'tws'],
    categoryId: 100073,
    categoryName: 'Handphone & Aksesoris/Aksesoris Handphone',
  },
  // Komputer & Aksesoris
  {
    keywords: ['mouse', 'keyboard', 'flashdisk', 'usb hub', 'mousepad', 'webcam', 'headphone gaming', 'laptop stand'],
    categoryId: 100085,
    categoryName: 'Komputer & Aksesoris/Aksesoris Komputer',
  },
  // Otomotif Mobil
  {
    keywords: ['lampu mobil', 'holder mobil', 'charger mobil', 'parfum mobil', 'aksesoris mobil', 'spion mobil'],
    categoryId: 101908,
    categoryName: 'Mobil/Suku Cadang Mobil/Kelistrikan/Lampu Mobil',
  },
  // Olahraga & Outdoor
  {
    keywords: ['senter camping', 'tenda', 'matras camping', 'sepeda', 'lampu sepeda', 'helm sepeda', 'tas ransel outdoor'],
    categoryId: 101829,
    categoryName: 'Olahraga & Outdoor/Alat Rekreasi Olahraga & Aktivitas Outdoor/Camping & Hiking',
  },
  // Alat Pertukangan & Perkakas
  {
    keywords: ['obeng', 'tang', 'bor', 'meteran', 'kunci pas', 'soldering', 'lem tembak', 'toolkit', 'perkakas'],
    categoryId: 100742,
    categoryName: 'Perlengkapan Rumah/Perkakas/Set Perkakas',
  },
];

export class CategoryMatcher {
  /**
   * Matches product title and JakMall category to the most accurate Shopee Category ID.
   * Defaults to 100719 (Perlengkapan Rumah) if no specific keyword matched.
   */
  public static matchCategoryId(title: string, categoryHint?: string): { id: number; name: string } {
    const combined = `${title || ''} ${categoryHint || ''}`.toLowerCase();

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
        return { id: rule.categoryId, name: rule.categoryName };
      }
    }

    // Default fallback: Perlengkapan Rumah (100719)
    return {
      id: 100719,
      name: 'Perlengkapan Rumah/Lampu & Dekorasi',
    };
  }
}
