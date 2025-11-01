import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const stores = db
      .prepare('SELECT * FROM stores ORDER BY name ASC')
      .all();

    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
