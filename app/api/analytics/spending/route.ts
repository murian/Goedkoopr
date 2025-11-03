import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { SpendingByCategory, SpendingOverTime } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'category';

    if (groupBy === 'category') {
      return getSpendingByCategory(startDate, endDate);
    } else if (groupBy === 'time') {
      return getSpendingOverTime(startDate, endDate);
    }

    return NextResponse.json(
      { error: 'Invalid groupBy parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching spending analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending analytics' },
      { status: 500 }
    );
  }
}

function getSpendingByCategory(startDate: string | null, endDate: string | null) {
  let query = `
    SELECT
      c.id as category_id,
      c.name as category_name,
      c.color as category_color,
      SUM(ri.total_price) as total_amount
    FROM receipt_items ri
    INNER JOIN receipts r ON ri.receipt_id = r.id
    LEFT JOIN products p ON ri.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    query += ' AND r.receipt_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND r.receipt_date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY c.id, c.name, c.color ORDER BY total_amount DESC';

  const results = db.prepare(query).all(...params) as any[];

  // Calculate total for percentages - ensure numbers are parsed correctly
  const total = results.reduce((sum, r) => {
    const amount = Number(r.total_amount) || 0;
    return sum + amount;
  }, 0);

  const spending: SpendingByCategory[] = results.map(r => {
    const amount = Number(r.total_amount) || 0;
    return {
      category_id: r.category_id,
      category_name: r.category_name || 'Uncategorized',
      category_color: r.category_color || '#6B7280',
      total_amount: amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    };
  });

  return NextResponse.json(spending);
}

function getSpendingOverTime(startDate: string | null, endDate: string | null) {
  let query = `
    SELECT
      DATE(receipt_date) as date,
      SUM(total_amount) as amount
    FROM receipts
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    query += ' AND receipt_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND receipt_date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY DATE(receipt_date) ORDER BY date ASC';

  const results = db.prepare(query).all(...params) as any[];

  // Ensure amounts are properly parsed as numbers
  const spending: SpendingOverTime[] = results.map(r => ({
    date: r.date,
    amount: Number(r.amount) || 0,
  }));

  return NextResponse.json(spending);
}
