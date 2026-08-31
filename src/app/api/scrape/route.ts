import { NextRequest, NextResponse } from 'next/server';
import { JakmallScraper } from '@/lib/scraper/jakmall';
import { ProductNormalizer } from '@/lib/normalizer/mapper';
import { JobStore } from '@/lib/storage/job-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, markupPercent, fixedMargin, titlePrefix, titleSuffix } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL produk JakMall wajib diisi.' },
        { status: 400 }
      );
    }

    console.log(`[API /scrape] Processing URL: ${url}`);

    // Step 1: Scrape from JakMall
    const jakmallData = await JakmallScraper.scrape(url.trim());

    // Step 2: Normalize and map to Shopee format
    const shopeeProduct = ProductNormalizer.mapToShopee(jakmallData, {
      markupPercent: typeof markupPercent === 'number' ? markupPercent : 15,
      fixedMargin: typeof fixedMargin === 'number' ? fixedMargin : 2500,
      titlePrefix,
      titleSuffix,
    });

    // Step 3: Validate product is real (not a 404/error page)
    const invalidTitles = ['halaman tidak ditemukan', 'page not found', '404', 'not found'];
    if (invalidTitles.some(t => shopeeProduct.title.toLowerCase().includes(t))) {
      return NextResponse.json({
        success: false,
        error: `URL tidak mengarah ke produk yang valid. Judul yang diekstrak: "${shopeeProduct.title}". Pastikan URL adalah halaman produk JakMall yang benar.`,
      }, { status: 400 });
    }

    if (!shopeeProduct.finalPrice || shopeeProduct.finalPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Harga produk tidak berhasil diekstrak. Coba URL produk JakMall yang lain.',
      }, { status: 400 });
    }

    // Step 4: Save to storage (Supabase or Local)
    await JobStore.save(shopeeProduct);

    return NextResponse.json({
      success: true,
      product: shopeeProduct,
      message: 'Data produk JakMall berhasil diekstraksi dan dipetakan ke format Shopee.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[API /scrape] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal mengekstrak data dari URL yang diberikan.',
      },
      { status: 500 }
    );
  }
}
