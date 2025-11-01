import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

// GET receipt by ID with items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const receipt = db
      .prepare(`
        SELECT r.*, s.name as store_name, s.location as store_location
        FROM receipts r
        LEFT JOIN stores s ON r.store_id = s.id
        WHERE r.id = ?
      `)
      .get(id);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    const items = db
      .prepare(`
        SELECT ri.*, p.name as product_name, c.name as category_name, c.color as category_color
        FROM receipt_items ri
        LEFT JOIN products p ON ri.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ri.receipt_id = ?
      `)
      .all(id);

    return NextResponse.json({ ...receipt, items });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}

// DELETE receipt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const result = db.prepare('DELETE FROM receipts WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    );
  }
}
