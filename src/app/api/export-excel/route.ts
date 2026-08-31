import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/storage/job-store';
import { ShopeeExcelExporter } from '@/lib/shopee/excel-exporter';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let products = await JobStore.getAll();
    if (id) {
      products = products.filter((p) => p.id === id);
    }

    if (products.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada produk untuk diekspor.' }, { status: 400 });
    }

    const buffer = ShopeeExcelExporter.generateWorkbook(products);

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="shopee_mass_upload_${Date.now()}.xlsx"`,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
