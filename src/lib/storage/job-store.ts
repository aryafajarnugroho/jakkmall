import { ShopeeProductMapping } from '@/types/product';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');

// Helper to convert DB snake_case row to TypeScript camelCase object
function dbRowToProduct(row: Record<string, unknown>): ShopeeProductMapping {
  return {
    id: row.id as string,
    sourceUrl: (row.source_url as string) || '',
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    categoryName: (row.category_name as string) || '',
    categoryId: Number(row.category_id) || 100012,
    basePrice: Number(row.base_price) || 0,
    markupPercent: Number(row.markup_percent) || 15,
    fixedMargin: Number(row.fixed_margin) || 0,
    finalPrice: Number(row.final_price) || 0,
    stock: Number(row.stock) || 0,
    weightGrams: Number(row.weight_grams) || 250,
    condition: (row.condition as string) || 'Baru',
    mainImage: (row.main_image as string) || '',
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    sku: (row.sku as string) || '',
    variations: Array.isArray(row.variations) ? (row.variations as unknown as ShopeeProductMapping['variations']) : [],
    status: (row.status as ShopeeProductMapping['status']) || 'EXTRACTED',
    errorMessage: row.error_message as string | undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
  };
}

// Helper to convert TypeScript camelCase object to DB snake_case row
function productToDbRow(p: ShopeeProductMapping) {
  return {
    id: p.id,
    source_url: p.sourceUrl,
    title: p.title,
    description: p.description,
    category_name: p.categoryName,
    category_id: p.categoryId || 100012,
    base_price: p.basePrice,
    markup_percent: p.markupPercent,
    fixed_margin: p.fixedMargin,
    final_price: p.finalPrice,
    stock: p.stock,
    weight_grams: p.weightGrams,
    condition: p.condition,
    main_image: p.mainImage,
    images: p.images,
    sku: p.sku,
    variations: p.variations,
    status: p.status,
    error_message: p.errorMessage || null,
    updated_at: new Date().toISOString(),
  };
}

export class JobStore {
  private static ensureLocalStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch {
      // In read-only serverless filesystem, ignore mkdir errors
    }
  }

  public static async getAll(): Promise<ShopeeProductMapping[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase DB Error] getAll:', error.message);
        } else if (data) {
          return data.map(dbRowToProduct);
        }
      } catch (err) {
        console.error('[Supabase DB Exception] getAll:', err);
      }
    }

    // Local JSON Fallback
    this.ensureLocalStorage();
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(content || '[]');
      }
    } catch {
      // fallback empty
    }
    return [];
  }

  public static async getById(id: string): Promise<ShopeeProductMapping | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.warn(`[Supabase DB Warning] getById (${id}):`, error.message);
        } else if (data) {
          return dbRowToProduct(data);
        }
      } catch (err) {
        console.error('[Supabase DB Exception] getById:', err);
      }
    }

    // Local JSON Fallback
    const products = await this.getAll();
    return products.find((p) => p.id === id);
  }

  public static async save(product: ShopeeProductMapping): Promise<ShopeeProductMapping> {
    if (isSupabaseConfigured && supabase) {
      try {
        const row = productToDbRow(product);
        const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase DB Error] save:', error.message);
        } else {
          return product;
        }
      } catch (err) {
        console.error('[Supabase DB Exception] save:', err);
      }
    }

    // Local JSON Fallback
    this.ensureLocalStorage();
    try {
      let products: ShopeeProductMapping[] = [];
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        products = JSON.parse(content || '[]');
      }

      const index = products.findIndex((p) => p.id === product.id);
      if (index >= 0) {
        products[index] = { ...product, updatedAt: new Date().toISOString() };
      } else {
        products.unshift(product);
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[JobStore] Local file write skipped/failed:', err);
    }
    return product;
  }

  public static async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.error('[Supabase DB Error] delete:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.error('[Supabase DB Exception] delete:', err);
        return false;
      }
    }

    // Local JSON Fallback
    this.ensureLocalStorage();
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const products: ShopeeProductMapping[] = JSON.parse(content || '[]');
        const filtered = products.filter((p) => p.id !== id);
        if (filtered.length !== products.length) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  public static async updateStatus(
    id: string,
    status: ShopeeProductMapping['status'],
    errorMessage?: string
  ) {
    const product = await this.getById(id);
    if (product) {
      product.status = status;
      if (errorMessage !== undefined) {
        product.errorMessage = errorMessage;
      }
      await this.save(product);
    }
  }
}
