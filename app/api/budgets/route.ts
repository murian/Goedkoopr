import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { BudgetStatus } from '@/lib/types';

// GET all budgets with spending status
export async function GET(request: NextRequest) {
  try {
    const budgets = db
      .prepare(`
        SELECT b.*, c.name as category_name, c.color as category_color
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.active = 1
        ORDER BY b.created_at DESC
      `)
      .all();

    const budgetStatuses: BudgetStatus[] = [];

    for (const budget of budgets as any[]) {
      const spent = calculateSpentAmount(budget);
      const remaining = budget.amount - spent;
      const percentage = (spent / budget.amount) * 100;

      budgetStatuses.push({
        budget,
        spent,
        remaining,
        percentage,
        is_exceeded: spent > budget.amount,
      });
    }

    return NextResponse.json(budgetStatuses);
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST - Create budget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, amount, period, currency, start_date } = body;

    if (!amount || !period || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate end_date based on period
    const startDate = new Date(start_date);
    let endDate = new Date(startDate);

    switch (period) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const insertBudget = db.prepare(`
      INSERT INTO budgets (category_id, amount, period, currency, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertBudget.run(
      category_id || null,
      amount,
      period,
      currency || 'EUR',
      start_date,
      endDate.toISOString().split('T')[0]
    );

    const budget = db
      .prepare('SELECT * FROM budgets WHERE id = ?')
      .get(result.lastInsertRowid);

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

// PUT - Update budget
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category_id, amount, period, currency, start_date } = body;

    if (!id || !amount || !period || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate end_date based on period
    const startDate = new Date(start_date);
    let endDate = new Date(startDate);

    switch (period) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const updateBudget = db.prepare(`
      UPDATE budgets
      SET category_id = ?, amount = ?, period = ?, currency = ?, start_date = ?, end_date = ?
      WHERE id = ?
    `);

    updateBudget.run(
      category_id || null,
      amount,
      period,
      currency || 'EUR',
      start_date,
      endDate.toISOString().split('T')[0],
      id
    );

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

// DELETE - Remove budget
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting active = 0
    const deleteBudget = db.prepare(`
      UPDATE budgets SET active = 0 WHERE id = ?
    `);

    deleteBudget.run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}

// Helper function to calculate spent amount for a budget
function calculateSpentAmount(budget: any): number {
  let query = `
    SELECT SUM(ri.total_price) as total
    FROM receipt_items ri
    INNER JOIN receipts r ON ri.receipt_id = r.id
    WHERE r.receipt_date >= ? AND r.receipt_date < ?
  `;
  const params: any[] = [budget.start_date, budget.end_date];

  if (budget.category_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = ri.product_id AND p.category_id = ?
    )`;
    params.push(budget.category_id);
  }

  const result = db.prepare(query).get(...params) as any;
  return result?.total || 0;
}
