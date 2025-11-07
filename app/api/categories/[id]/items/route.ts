import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);

    // Get category info
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all items in this category
    const items = db.prepare(`
      SELECT
        ri.id,
        ri.product_id,
        ri.product_name,
        ri.quantity,
        ri.unit_price,
        ri.total_price,
        ri.original_price,
        ri.discount_amount,
        ri.created_at,
        r.receipt_date,
        r.id as receipt_id,
        s.name as store_name,
        p.category_id,
        c.name as category_name,
        c.color as category_color
      FROM receipt_items ri
      INNER JOIN receipts r ON ri.receipt_id = r.id
      INNER JOIN products p ON ri.product_id = p.id
      LEFT JOIN stores s ON r.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY r.receipt_date DESC, ri.created_at DESC
    `).all(categoryId);

    return NextResponse.json({
      category,
      items,
      total_items: items.length
    });
  } catch (error: any) {
    console.error('Error fetching category items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category items' },
      { status: 500 }
    );
  }
}
