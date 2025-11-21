import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { ProductPriceComparison } from '@/lib/types';

interface PriceItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  currency: string;
  receipt_date: string;
  store_name: string;
  store_location: string | null;
}

// GET - Compare product prices across stores
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productName = searchParams.get('name');

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Find all items with similar product names across different stores
    const items = db
      .prepare(`
        SELECT
          ri.product_name,
          ri.unit_price,
          ri.quantity,
          r.currency,
          r.receipt_date,
          s.name as store_name,
          s.location as store_location
        FROM receipt_items ri
        INNER JOIN receipts r ON ri.receipt_id = r.id
        INNER JOIN stores s ON r.store_id = s.id
        WHERE ri.product_name LIKE ?
        ORDER BY r.receipt_date DESC
      `)
      .all(`%${productName}%`) as PriceItem[];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Group by store and get latest price
    const storeMap = new Map();

    for (const item of items) {
      const key = `${item.store_name}_${item.store_location || ''}`;
      if (!storeMap.has(key) || new Date(item.receipt_date) > new Date(storeMap.get(key).last_seen)) {
        storeMap.set(key, {
          store_name: item.store_name,
          store_location: item.store_location,
          unit_price: item.unit_price,
          currency: item.currency,
          last_seen: item.receipt_date,
        });
      }
    }

    const prices = Array.from(storeMap.values());
    const priceValues = prices.map(p => p.unit_price);

    const comparison: ProductPriceComparison = {
      product_name: items[0].product_name,
      prices,
      lowest_price: Math.min(...priceValues),
      highest_price: Math.max(...priceValues),
      average_price: priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
    };

    return NextResponse.json(comparison);
  } catch (error: any) {
    console.error('Error comparing product prices:', error);
    return NextResponse.json(
      { error: 'Failed to compare product prices' },
      { status: 500 }
    );
  }
}
