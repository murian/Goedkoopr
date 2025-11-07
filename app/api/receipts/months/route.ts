import { NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET() {
  try {
    // Get distinct year-month combinations from receipts
    const query = `
      SELECT DISTINCT
        strftime('%Y-%m', receipt_date) as month
      FROM receipts
      ORDER BY month DESC
    `;

    const rows = db.prepare(query).all() as { month: string }[];

    // Format the months nicely
    const months = rows.map(row => {
      const [year, month] = row.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        value: row.month,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    });

    return NextResponse.json({ months });
  } catch (error) {
    console.error('Failed to fetch months:', error);
    return NextResponse.json({ error: 'Failed to fetch months', months: [] }, { status: 500 });
  }
}
