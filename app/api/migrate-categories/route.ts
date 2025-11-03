import { NextResponse } from 'next/server';
import db from '@/lib/database';

export async function POST() {
  try {
    console.log('Starting category migration...');

    const categoriesToRemove = ['Groceries', 'Other', 'Household', 'Personal Care', 'Snacks', 'Bakery', 'Dairy'];
    let totalProductsUpdated = 0;
    const deletedCategories: string[] = [];

    // Get "Pantry & Canned" as default fallback for unmapped items
    const fallbackCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get('Pantry & Canned') as any;

    if (!fallbackCategory) {
      return NextResponse.json({
        error: 'Fallback category "Pantry & Canned" not found'
      }, { status: 500 });
    }

    for (const categoryName of categoriesToRemove) {
      const oldCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get(categoryName) as any;

      if (oldCategory) {
        // Count products with this category
        const productsCount = db.prepare(
          'SELECT COUNT(*) as count FROM products WHERE category_id = ?'
        ).get(oldCategory.id) as any;

        console.log(`Found ${productsCount.count} products with "${categoryName}" category`);

        if (productsCount.count > 0) {
          // Move all products to fallback category
          const updateProducts = db.prepare(
            'UPDATE products SET category_id = ? WHERE category_id = ?'
          );
          updateProducts.run(fallbackCategory.id, oldCategory.id);
          totalProductsUpdated += productsCount.count;
        }

        // Delete the old category
        const deleteCategory = db.prepare('DELETE FROM categories WHERE id = ?');
        deleteCategory.run(oldCategory.id);
        deletedCategories.push(categoryName);
        console.log(`Deleted category: ${categoryName}`);
      }
    }

    console.log('Migration completed successfully');

    return NextResponse.json({
      message: 'Category migration completed',
      productsUpdated: totalProductsUpdated,
      deletedCategories: deletedCategories,
      note: 'Products moved to "Pantry & Canned". Re-scan receipts for better categorization with new AI.'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
