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

    // Get MIME type from file or default to image/jpeg
    const mimeType = file.type || 'image/jpeg';

    // Create proper data URI for AI service
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Parse receipt with AI
    const parsedReceipt = await parseReceiptWithAI(base64);

    // Log what the AI extracted for debugging
    console.log(`\n📄 Receipt parsed by AI:`);
    console.log(`   Store: ${parsedReceipt.store_name}`);
    console.log(`   Location: ${parsedReceipt.store_location || 'NOT EXTRACTED ⚠️'}`);
    console.log(`   Date: ${parsedReceipt.receipt_date}`);
    console.log(`   Total: €${parsedReceipt.total_amount}`);
    console.log(`   Items: ${parsedReceipt.items.length}\n`);

    // Save image to disk
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Safely extract file extension with fallback
    const timestamp = Date.now();
    let extension = 'jpg'; // Default extension
    if (file.name && file.name.includes('.')) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      if (ext && /^[a-zA-Z0-9]+$/.test(ext)) {
        extension = ext.toLowerCase();
      }
    }

    const filename = `receipt_${timestamp}.${extension}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Find or create store - match by BOTH name AND location to distinguish different store locations
    const storeLocation = parsedReceipt.store_location?.trim() || null;

    // Validation: Warn if location is missing or too vague
    if (!storeLocation || storeLocation.length < 5) {
      console.warn(`⚠️ WARNING: Store location missing or too vague for "${parsedReceipt.store_name}"`);
      console.warn(`   Extracted location: "${storeLocation || 'EMPTY'}"`);
      console.warn(`   This may cause multiple locations to be grouped together.`);
      console.warn(`   AI should extract: street + number + postal code + city`);
    }

    let store: { id: number | bigint } | undefined;

    if (storeLocation) {
      // Try to find store by both name and location (case-insensitive)
      store = db
        .prepare('SELECT * FROM stores WHERE LOWER(name) = LOWER(?) AND LOWER(location) = LOWER(?)')
        .get(parsedReceipt.store_name, storeLocation) as { id: number | bigint } | undefined;
    }

    if (!store) {
      // If not found, create new store with specific location
      const insertStore = db.prepare(
        'INSERT INTO stores (name, location) VALUES (?, ?)'
      );
      const result = insertStore.run(
        parsedReceipt.store_name,
        storeLocation
      );
      store = { id: result.lastInsertRowid };

      if (storeLocation) {
        console.log(`✓ Created new store: "${parsedReceipt.store_name}" at "${storeLocation}"`);
      } else {
        console.warn(`⚠️ Created new store: "${parsedReceipt.store_name}" with NO LOCATION - locations may be merged!`);
      }
    } else {
      console.log(`✓ Using existing store: "${parsedReceipt.store_name}" at "${storeLocation}"`);
    }

    // Check for duplicate receipts BEFORE inserting (same store, date, and total)
    // Use case-insensitive store name matching since AI may extract with different capitalization
    const duplicateCheck = db.prepare(`
      SELECT r.id, r.receipt_date, r.total_amount, s.name as store_name
      FROM receipts r
      LEFT JOIN stores s ON r.store_id = s.id
      WHERE LOWER(s.name) = LOWER(?)
        AND r.receipt_date = ?
        AND ABS(r.total_amount - ?) < 0.01
      LIMIT 1
    `).get(parsedReceipt.store_name, parsedReceipt.receipt_date, parsedReceipt.total_amount);

    if (duplicateCheck) {
      // Delete the uploaded image file since we won't use it
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      console.warn(`⚠️ DUPLICATE RECEIPT DETECTED and rejected:`);
      console.warn(`   Store: ${parsedReceipt.store_name}`);
      console.warn(`   Date: ${parsedReceipt.receipt_date}`);
      console.warn(`   Amount: €${parsedReceipt.total_amount}`);

      return NextResponse.json(
        {
          error: 'Duplicate receipt detected',
          message: `This receipt has already been uploaded. A receipt from "${parsedReceipt.store_name}" dated ${parsedReceipt.receipt_date} with total €${parsedReceipt.total_amount} already exists in the system.`,
          duplicate: true
        },
        { status: 409 } // 409 Conflict
      );
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
        .prepare('SELECT * FROM products WHERE LOWER(name) = LOWER(?)')
        .get(item.product_name) as { id: number | bigint; name: string; category_id?: number | bigint } | undefined;

      if (item.suggested_category) {
        // Find category (case-insensitive match)
        const category = db
          .prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)')
          .get(item.suggested_category) as { id: number | bigint; name: string } | undefined;

        if (category) {
          if (!product) {
            // Create new product with category
            const insertProduct = db.prepare(
              'INSERT INTO products (name, category_id) VALUES (?, ?)'
            );
            const productResult = insertProduct.run(item.product_name, category.id);
            product = { id: productResult.lastInsertRowid, name: item.product_name };
            console.log(`Created product "${item.product_name}" with category "${category.name}"`);
          } else if (!product.category_id) {
            // Update existing product with category if it doesn't have one
            db.prepare('UPDATE products SET category_id = ? WHERE id = ?').run(
              category.id,
              product.id
            );
            console.log(`Updated product "${item.product_name}" with category "${category.name}"`);
          }
        } else {
          console.warn(`Category "${item.suggested_category}" not found for item "${item.product_name}"`);
          // Fallback to "Other" category
          const otherCategory = db.prepare('SELECT * FROM categories WHERE name = ?').get('Other') as { id: number | bigint; name: string } | undefined;
          if (!product && otherCategory) {
            const insertProduct = db.prepare(
              'INSERT INTO products (name, category_id) VALUES (?, ?)'
            );
            const productResult = insertProduct.run(item.product_name, otherCategory.id);
            product = { id: productResult.lastInsertRowid, name: item.product_name };
            console.log(`Created product "${item.product_name}" with fallback category "Other"`);
          }
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
