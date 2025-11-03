import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'receipts.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  // Stores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER,
      receipt_date DATE NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      image_path TEXT,
      raw_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
    )
  `);

  // Add discount_amount column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE receipts ADD COLUMN discount_amount REAL DEFAULT 0`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Receipt items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      original_price REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  // Add discount columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE receipt_items ADD COLUMN original_price REAL DEFAULT 0`);
  } catch (error) {
    // Column already exists, ignore error
  }
  try {
    db.exec(`ALTER TABLE receipt_items ADD COLUMN discount_amount REAL DEFAULT 0`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Budgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      amount REAL NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly')),
      currency TEXT DEFAULT 'EUR',
      start_date DATE NOT NULL,
      end_date DATE,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Insert default categories (specific categories for grocery items)
  const categories = [
    { name: 'Fruits & Vegetables', color: '#10B981' },
    { name: 'Meat & Fish', color: '#DC2626' },
    { name: 'Dairy & Eggs', color: '#8B5CF6' },
    { name: 'Bakery & Bread', color: '#D97706' },
    { name: 'Beverages', color: '#F59E0B' },
    { name: 'Snacks & Sweets', color: '#EF4444' },
    { name: 'Frozen Foods', color: '#06B6D4' },
    { name: 'Pantry & Canned', color: '#84CC16' },
    { name: 'Condiments & Sauces', color: '#F97316' },
    { name: 'Household & Cleaning', color: '#6366F1' },
    { name: 'Personal Care', color: '#EC4899' },
    { name: 'Pet Supplies', color: '#A855F7' },
    { name: 'Other', color: '#6B7280' }
  ];

  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)'
  );

  for (const category of categories) {
    insertCategory.run(category.name, category.color);
  }

  console.log('Database initialized successfully');
}

export default db;
