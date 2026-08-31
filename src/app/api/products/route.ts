import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/storage/job-store';

export async function GET() {
  try {
    const products = await JobStore.getAll();
    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const product = await req.json();
    if (!product || !product.id) {
      return NextResponse.json({ success: false, error: 'Product ID wajib disertakan.' }, { status: 400 });
    }

    const saved = await JobStore.save(product);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
