import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'csv';

    let query = `
      SELECT
        r.receipt_date,
        s.name as store_name,
        s.location as store_location,
        ri.product_name,
        c.name as category,
        ri.quantity,
        ri.unit_price,
        ri.total_price,
        r.currency,
        r.tax_amount,
        r.total_amount as receipt_total
      FROM receipt_items ri
      INNER JOIN receipts r ON ri.receipt_id = r.id
      LEFT JOIN stores s ON r.store_id = s.id
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

    query += ' ORDER BY r.receipt_date DESC, ri.id ASC';

    const data = db.prepare(query).all(...params);

    if (format === 'csv') {
      const csv = Papa.unparse(data);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="expenses_${Date.now()}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="expenses_${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid format. Use csv or json' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
