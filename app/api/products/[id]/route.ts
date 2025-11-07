import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

// PATCH - Update product category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { category_id } = await request.json();
    const productId = params.id;

    if (!category_id) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(category_id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update product category
    const updateProduct = db.prepare(
      'UPDATE products SET category_id = ? WHERE id = ?'
    );

    updateProduct.run(category_id, productId);

    // Get updated product
    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId);

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error updating product category:', error);
    return NextResponse.json(
      { error: 'Failed to update product category' },
      { status: 500 }
    );
  }
}
