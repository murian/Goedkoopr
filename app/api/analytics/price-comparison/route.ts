import { NextResponse } from 'next/server';
import db from '@/lib/database';

interface ProductPriceComparison {
  product_id: number;
  product_name: string;
  category_name: string;
  times_purchased: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  price_variance: number;
  stores: {
    store_id: number;
    store_name: string;
    store_location: string;
    avg_price: number;
    times_purchased: number;
    last_purchase_date: string;
  }[];
  potential_savings: number; // If bought at cheapest store
}

export async function GET() {
  try {
    // Get products that have been purchased at multiple stores with price variations
    const productsWithVariance = db.prepare(`
      SELECT
        p.id as product_id,
        p.name as product_name,
        c.name as category_name,
        COUNT(DISTINCT ri.id) as times_purchased,
        AVG(ri.unit_price) as avg_price,
        MIN(ri.unit_price) as min_price,
        MAX(ri.unit_price) as max_price,
        (MAX(ri.unit_price) - MIN(ri.unit_price)) as price_variance,
        COUNT(DISTINCT s.id) as store_count
      FROM products p
      INNER JOIN receipt_items ri ON p.id = ri.product_id
      INNER JOIN receipts r ON ri.receipt_id = r.id
      INNER JOIN stores s ON r.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, p.name, c.name
      HAVING store_count > 1 AND price_variance > 0.01
      ORDER BY price_variance DESC
      LIMIT 50
    `).all() as any[];

    // For each product, get detailed store breakdown
    const comparisons: ProductPriceComparison[] = [];

    for (const product of productsWithVariance) {
      const stores = db.prepare(`
        SELECT
          s.id as store_id,
          s.name as store_name,
          s.location as store_location,
          AVG(ri.unit_price) as avg_price,
          COUNT(ri.id) as times_purchased,
          MAX(r.receipt_date) as last_purchase_date
        FROM receipt_items ri
        INNER JOIN receipts r ON ri.receipt_id = r.id
        INNER JOIN stores s ON r.store_id = s.id
        WHERE ri.product_id = ?
        GROUP BY s.id, s.name, s.location
        ORDER BY avg_price ASC
      `).all(product.product_id) as any[];

      // Calculate potential savings (if always bought at cheapest store)
      const minPrice = Number(product.min_price);
      const timesPurchased = Number(product.times_purchased);
      const avgPrice = Number(product.avg_price);
      const potentialSavings = (avgPrice - minPrice) * timesPurchased;

      comparisons.push({
        product_id: product.product_id,
        product_name: product.product_name,
        category_name: product.category_name || 'Uncategorized',
        times_purchased: Number(product.times_purchased),
        avg_price: Number(product.avg_price),
        min_price: Number(product.min_price),
        max_price: Number(product.max_price),
        price_variance: Number(product.price_variance),
        stores: stores.map(s => ({
          store_id: s.store_id,
          store_name: s.store_name,
          store_location: s.store_location || 'Unknown location',
          avg_price: Number(s.avg_price),
          times_purchased: Number(s.times_purchased),
          last_purchase_date: s.last_purchase_date,
        })),
        potential_savings: potentialSavings,
      });
    }

    // Calculate total potential savings
    const totalPotentialSavings = comparisons.reduce(
      (sum, c) => sum + c.potential_savings,
      0
    );

    // Get summary stats
    const summary = {
      total_products_compared: comparisons.length,
      total_potential_savings: totalPotentialSavings,
      avg_price_variance: comparisons.length > 0
        ? comparisons.reduce((sum, c) => sum + c.price_variance, 0) / comparisons.length
        : 0,
    };

    return NextResponse.json({
      summary,
      comparisons,
    });
  } catch (error) {
    console.error('Failed to fetch price comparisons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price comparisons' },
      { status: 500 }
    );
  }
}
