import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const stores = db.prepare(`
      SELECT
        s.*,
        COUNT(r.id) as receipt_count,
        COALESCE(SUM(r.total_amount), 0) as total_spent
      FROM stores s
      LEFT JOIN receipts r ON s.id = r.store_id
      GROUP BY s.id, s.name, s.location
      ORDER BY receipt_count DESC, s.name ASC
    `).all();

    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
