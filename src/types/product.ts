export interface JakmallVariation {
  id?: string;
  name: string; // e.g. "Hitam", "Ukuran L"
  sku?: string;
  price: number;
  stock: number;
  image?: string;
}

export interface JakmallProduct {
  sourceUrl: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  originalPrice: number;
  discountPrice?: number;
  stock: number;
  weightGrams: number;
  dimension?: {
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  mainImage: string;
  galleryImages: string[];
  variations: JakmallVariation[];
  brand?: string;
  condition: 'NEW' | 'USED';
  rawAttributes?: Record<string, string>;
}

export interface ShopeeProductMapping {
  id: string;
  sourceUrl: string;
  title: string;
  description: string;
  categoryName: string;
  categoryId?: number;
  basePrice: number;
  markupPercent: number;
  fixedMargin: number;
  finalPrice: number;
  stock: number;
  weightGrams: number;
  condition: string;
  mainImage: string;
  images: string[];
  sku: string;
  variations: {
    name: string;
    options: {
      optionName: string;
      price: number;
      stock: number;
      sku: string;
      image?: string;
    }[];
  }[];
  status: 'EXTRACTED' | 'REVIEWED' | 'READY_TO_UPLOAD' | 'UPLOADING' | 'PUBLISHED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapingJobRequest {
  url: string;
  markupPercent?: number;
  fixedMargin?: number;
}

export interface ScrapingJobResult {
  success: boolean;
  product?: ShopeeProductMapping;
  error?: string;
}

export interface PublishRequest {
  productId: string;
  method: 'PLAYWRIGHT_BOT' | 'EXCEL_EXPORT';
  credentials?: {
    shopeeShopName?: string;
  };
}

export interface PublishResult {
  success: boolean;
  productId: string;
  method: 'PLAYWRIGHT_BOT' | 'EXCEL_EXPORT';
  message: string;
  downloadUrl?: string;
  logs: string[];
  screenshotUrl?: string;
}
