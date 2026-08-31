import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/storage/job-store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const product = await JobStore.getById(id);
  if (!product) {
    return NextResponse.json({ success: false, error: 'Produk tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, product });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const deleted = await JobStore.delete(id);
  return NextResponse.json({ success: deleted });
}
