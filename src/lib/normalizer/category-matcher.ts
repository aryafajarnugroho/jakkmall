/**
 * Shopee Category Matcher
 * Maps product titles and JakMall categories into valid Shopee Indonesia Category IDs.
 * Extracted directly from official Shopee Mass Upload Category Reference (1,716 verified active category IDs).
 */

export interface CategoryRule {
  keywords: string[];
  categoryId: number;
  categoryName: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  // Cangkir, Mug, Gelas, Teh, Botol Minum
  {
    keywords: ['cangkir', 'mug', 'gelas', 'teh', 'tea cup', 'infuser', 'tumbler', 'botol minum', 'termos'],
    categoryId: 101240,
    categoryName: 'Perlengkapan Rumah/Peralatan Makan/Cangkir, Mug, & Gelas',
  },
  // Peralatan Makan
  {
    keywords: ['sendok', 'garpu', 'sumpit', 'piring', 'mangkok', 'alat makan', 'sedotan'],
    categoryId: 101244,
    categoryName: 'Perlengkapan Rumah/Peralatan Makan/Alat Makan',
  },
  // Perlengkapan Dapur & Masak
  {
    keywords: ['wajan', 'panci', 'spatula', 'pisau dapur', 'talenan', 'penggorengan', 'teflon'],
    categoryId: 101235,
    categoryName: 'Perlengkapan Rumah/Perlengkapan Dapur/Peralatan Masak',
  },
  // Lampu & Lighting
  {
    keywords: ['lampu taman', 'solar', 'sensor cahaya', 'lampu dinding', 'lampu tidur', 'lampu meja', 'lampu led', 'bohlam', 'lampu', 'senter'],
    categoryId: 100719,
    categoryName: 'Perlengkapan Rumah/Lampu',
  },
  // Smartwatch & Wearables
  {
    keywords: ['smartwatch', 'smart watch', 'fitness tracker', 'smartband', 'smart band', 'strap smartwatch', 'wearable'],
    categoryId: 100270,
    categoryName: 'Handphone & Aksesoris/Perangkat Wearable/Smartwatch & Fitness Tracker',
  },
  // Kabel Data & Charger
  {
    keywords: ['kabel data', 'kabel charger', 'type-c', 'type c', 'lightning', 'micro usb', 'fast charging', 'charger', 'adaptor', 'head charger'],
    categoryId: 100482,
    categoryName: 'Handphone & Aksesoris/Aksesoris/Kabel, Charger, & Konverter/Kabel Data & Charger',
  },
  // Powerbank & Baterai HP
  {
    keywords: ['powerbank', 'power bank', 'baterai hp', 'baterai cadangan'],
    categoryId: 100486,
    categoryName: 'Handphone & Aksesoris/Aksesoris/Powerbank & Baterai/Powerbank',
  },
  // Audio, TWS, Earphone & Headphone
  {
    keywords: ['tws', 'earphone', 'headphone', 'headset', 'earbuds', 'handsfree', 'in-ear', 'earbud'],
    categoryId: 100540,
    categoryName: 'Audio/Earphone & Headphone/Earphone & Headphone Bluetooth & Nirkabel',
  },
  // Speaker Bluetooth / Portable
  {
    keywords: ['speaker', 'soundbar', 'loudspeaker', 'audio box'],
    categoryId: 100545,
    categoryName: 'Audio/Speaker/Speaker Bluetooth & Portabel',
  },
  // Casing & Cover HP
  {
    keywords: ['casing hp', 'case hp', 'casing handphone', 'cover hp', 'silikon hp', 'softcase', 'hardcase'],
    categoryId: 100492,
    categoryName: 'Handphone & Aksesoris/Aksesoris/Casing & Cover/Casing & Cover Handphone',
  },
  // Holder & Stand HP / Tablet
  {
    keywords: ['holder hp', 'stand hp', 'phone holder', 'tripod hp', 'ring light', 'tongsis'],
    categoryId: 100499,
    categoryName: 'Handphone & Aksesoris/Aksesoris/Aksesoris Handphone & Tablet Lainnya',
  },
  // Mouse & Keyboard Komputer
  {
    keywords: ['mouse gaming', 'mouse wireless', 'mouse', 'mousepad', 'mouse pad'],
    categoryId: 101998,
    categoryName: 'Komputer & Aksesoris/Keyboard & Mouse/Mouse',
  },
  {
    keywords: ['keyboard gaming', 'keyboard mechanical', 'keyboard wireless', 'keyboard'],
    categoryId: 101999,
    categoryName: 'Komputer & Aksesoris/Keyboard & Mouse/Keyboard',
  },
  // USB Hub & Card Reader / Storage
  {
    keywords: ['usb hub', 'card reader', 'flashdisk', 'otg', 'splitter usb'],
    categoryId: 101987,
    categoryName: 'Komputer & Aksesoris/Aksesoris Desktop & Laptop/USB HUB & Card Reader',
  },
  // Stand Laptop & Cooling Pad
  {
    keywords: ['stand laptop', 'cooling pad', 'cooler laptop', 'dudukan laptop', 'meja laptop'],
    categoryId: 101991,
    categoryName: 'Komputer & Aksesoris/Aksesoris Desktop & Laptop/Meja & Stand Laptop',
  },
  // Box & Organizer Rumah
  {
    keywords: ['organizer', 'box penyimpanan', 'keranjang', 'kotak sepatu', 'rak penyimpanan', 'wadah', 'storage box', 'vacuum bag', 'tas kompresi'],
    categoryId: 101254,
    categoryName: 'Perlengkapan Rumah/Organizer Rumah/Box, Tas, & Keranjang Penyimpanan',
  },
  // Elektronik Dapur
  {
    keywords: ['blender', 'mixer', 'juicer', 'air fryer', 'rice cooker', 'penggorengan udara', 'food processor'],
    categoryId: 100193,
    categoryName: 'Elektronik/Perangkat Dapur/Juicer, Blender & Mesin Kacang Kedelai',
  },
  // Humidifier & Diffuser
  {
    keywords: ['humidifier', 'diffuser', 'aromaterapi', 'air purifier', 'pembersih udara'],
    categoryId: 100223,
    categoryName: 'Elektronik/Perangkat Ruangan/Penjernih & Pelembap Udara/Humidifier',
  },
  // Alat Pertukangan / Perkakas
  {
    keywords: ['obeng', 'tang', 'bor', 'meteran', 'kunci pas', 'soldering', 'lem tembak', 'toolkit', 'perkakas', 'kunci shock'],
    categoryId: 101800,
    categoryName: 'Perlengkapan Rumah/Alat Pertukangan & Renovasi Rumah/Perkakas/Bor, Obeng & Aksesoris',
  },
  // Aksesoris Mobil & Motor
  {
    keywords: ['lampu mobil', 'holder mobil', 'charger mobil', 'parfum mobil', 'aksesoris mobil', 'spion mobil', 'pompa ban'],
    categoryId: 101908,
    categoryName: 'Mobil/Suku Cadang Mobil/Kelistrikan/Lampu Mobil',
  },
  // Camping & Outdoor
  {
    keywords: ['senter camping', 'tenda', 'matras camping', 'sepeda', 'lampu sepeda', 'helm sepeda', 'tas ransel outdoor', 'survival'],
    categoryId: 101829,
    categoryName: 'Olahraga & Outdoor/Alat Rekreasi Olahraga & Aktivitas Outdoor/Camping & Hiking/Lampu & Senter Camping',
  },
];

export class CategoryMatcher {
  /**
   * Matches product title and JakMall category to the most accurate valid Shopee Category ID.
   * Defaults to 101240 or 100719 (Perlengkapan Rumah) if no specific keyword matched.
   */
  public static matchCategoryId(title: string, categoryHint?: string): { id: number; name: string } {
    const combined = `${title || ''} ${categoryHint || ''}`.toLowerCase();

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
        return { id: rule.categoryId, name: rule.categoryName };
      }
    }

    // Default fallback: Perlengkapan Rumah (100719 - Perlengkapan Rumah/Lampu)
    return {
      id: 100719,
      name: 'Perlengkapan Rumah/Lampu',
    };
  }
}
