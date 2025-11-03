import { NextResponse } from 'next/server';
import db from '@/lib/database';

export async function POST() {
  try {
    console.log('Starting category migration...');

    // Get the old "Groceries" category
    const oldGroceries = db.prepare('SELECT id FROM categories WHERE name = ?').get('Groceries') as any;

    if (!oldGroceries) {
      return NextResponse.json({
        message: 'No "Groceries" category found to migrate',
        migrated: 0
      });
    }

    // Get "Other" category as fallback
    const otherCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get('Other') as any;

    if (!otherCategory) {
      return NextResponse.json({
        error: 'Other category not found'
      }, { status: 500 });
    }

    // Count products with Groceries category
    const productsCount = db.prepare(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?'
    ).get(oldGroceries.id) as any;

    console.log(`Found ${productsCount.count} products with "Groceries" category`);

    // Move all products from "Groceries" to "Other"
    const updateProducts = db.prepare(
      'UPDATE products SET category_id = ? WHERE category_id = ?'
    );
    updateProducts.run(otherCategory.id, oldGroceries.id);

    // Delete the old "Groceries" category
    const deleteCategory = db.prepare('DELETE FROM categories WHERE id = ?');
    deleteCategory.run(oldGroceries.id);

    console.log('Migration completed successfully');

    return NextResponse.json({
      message: 'Category migration completed',
      productsUpdated: productsCount.count,
      deletedCategory: 'Groceries'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
