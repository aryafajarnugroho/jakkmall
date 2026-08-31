import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/storage/job-store';
import { ShopeeAutomationBot } from '@/lib/shopee/bot';
import { ShopeeExcelExporter } from '@/lib/shopee/excel-exporter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, method } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID wajib disertakan.' }, { status: 400 });
    }

    const product = await JobStore.getById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    await JobStore.updateStatus(productId, 'UPLOADING');

    if (method === 'EXCEL_EXPORT') {
      const buffer = ShopeeExcelExporter.generateWorkbook([product]);
      await JobStore.updateStatus(productId, 'PUBLISHED');

      return new Response(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="shopee_mass_upload_${product.sku}.xlsx"`,
        },
      });
    }

    // Default: Playwright browser automation
    const result = await ShopeeAutomationBot.publishProduct(product, { headless: true });

    if (result.success) {
      await JobStore.updateStatus(productId, 'PUBLISHED');
    } else {
      await JobStore.updateStatus(productId, 'FAILED', result.message);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[API /publish] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses publikasi produk.' },
      { status: 500 }
    );
  }
}
