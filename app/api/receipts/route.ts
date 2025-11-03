import { NextRequest, NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/database';
import { parseReceiptWithAI } from '@/lib/ai-service';
import fs from 'fs';
import path from 'path';

// Initialize database on first API call
initDatabase();

// GET all receipts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeId = searchParams.get('storeId');

    let query = `
      SELECT r.*, s.name as store_name
      FROM receipts r
      LEFT JOIN stores s ON r.store_id = s.id
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

    if (storeId) {
      query += ' AND r.store_id = ?';
      params.push(parseInt(storeId));
    }

    query += ' ORDER BY r.receipt_date DESC, r.created_at DESC';

    const receipts = db.prepare(query).all(...params);

    return NextResponse.json(receipts);
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}

// POST - Upload and parse receipt
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Parse receipt with AI
    const parsedReceipt = await parseReceiptWithAI(base64);

    // Save image to disk
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `receipt_${timestamp}.${file.name.split('.').pop()}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Find or create store
    let store = db
      .prepare('SELECT * FROM stores WHERE name = ?')
      .get(parsedReceipt.store_name);

    if (!store) {
      const insertStore = db.prepare(
        'INSERT INTO stores (name, location) VALUES (?, ?)'
      );
      const result = insertStore.run(
        parsedReceipt.store_name,
        parsedReceipt.store_location || null
      );
      store = { id: result.lastInsertRowid };
    }

    // Insert receipt
    const insertReceipt = db.prepare(`
      INSERT INTO receipts (store_id, receipt_date, total_amount, currency, tax_amount, discount_amount, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const receiptResult = insertReceipt.run(
      store.id,
      parsedReceipt.receipt_date,
      parsedReceipt.total_amount,
      parsedReceipt.currency,
      parsedReceipt.tax_amount,
      parsedReceipt.discount_amount || 0,
      `/uploads/${filename}`
    );

    const receiptId = receiptResult.lastInsertRowid;

    // Insert receipt items
    const insertItem = db.prepare(`
      INSERT INTO receipt_items (receipt_id, product_name, quantity, unit_price, total_price, original_price, discount_amount, product_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of parsedReceipt.items) {
      // Find or create product
      let product = db
        .prepare('SELECT * FROM products WHERE name = ?')
        .get(item.product_name);

      if (!product && item.suggested_category) {
        const category = db
          .prepare('SELECT * FROM categories WHERE name = ?')
          .get(item.suggested_category);

        if (category) {
          const insertProduct = db.prepare(
            'INSERT INTO products (name, category_id) VALUES (?, ?)'
          );
          const productResult = insertProduct.run(item.product_name, category.id);
          product = { id: productResult.lastInsertRowid };
        }
      }

      insertItem.run(
        receiptId,
        item.product_name,
        item.quantity,
        item.unit_price,
        item.total_price,
        item.original_price || 0,
        item.discount_amount || 0,
        product?.id || null
      );
    }

    // Fetch the created receipt with items
    const receipt = db
      .prepare('SELECT r.*, s.name as store_name FROM receipts r LEFT JOIN stores s ON r.store_id = s.id WHERE r.id = ?')
      .get(receiptId);

    const items = db
      .prepare('SELECT * FROM receipt_items WHERE receipt_id = ?')
      .all(receiptId);

    return NextResponse.json({ receipt, items });
  } catch (error: any) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
