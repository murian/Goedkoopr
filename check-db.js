// Quick database diagnostic script
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'receipts.db');

try {
  console.log('=== DATABASE DIAGNOSTIC ===\n');

  const db = new Database(dbPath, { readonly: true });

  // Check receipts
  const receiptCount = db.prepare('SELECT COUNT(*) as count FROM receipts').get();
  console.log(`📄 Total Receipts: ${receiptCount.count}`);

  // Check stores
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get();
  console.log(`🏪 Total Stores: ${storeCount.count}\n`);

  if (storeCount.count > 0) {
    console.log('=== STORES ===');
    const stores = db.prepare(`
      SELECT
        s.id,
        s.name,
        s.location,
        COUNT(r.id) as receipt_count
      FROM stores s
      LEFT JOIN receipts r ON s.id = r.store_id
      GROUP BY s.id
      ORDER BY receipt_count DESC
    `).all();

    stores.forEach(store => {
      console.log(`  ${store.id}. ${store.name}`);
      console.log(`     Location: ${store.location || 'NOT SET'}`);
      console.log(`     Receipts: ${store.receipt_count}\n`);
    });
  }

  // Check products bought at multiple stores
  console.log('=== PRICE COMPARISON DATA ===');
  const multiStoreProducts = db.prepare(`
    SELECT
      p.name as product_name,
      COUNT(DISTINCT r.store_id) as store_count,
      COUNT(ri.id) as times_purchased,
      MIN(ri.unit_price) as min_price,
      MAX(ri.unit_price) as max_price
    FROM products p
    INNER JOIN receipt_items ri ON p.id = ri.product_id
    INNER JOIN receipts r ON ri.receipt_id = r.id
    GROUP BY p.name
    HAVING store_count > 1
    ORDER BY store_count DESC
    LIMIT 10
  `).all();

  if (multiStoreProducts.length > 0) {
    console.log(`Found ${multiStoreProducts.length} products at multiple stores:\n`);
    multiStoreProducts.forEach(product => {
      console.log(`  • ${product.product_name}`);
      console.log(`    Stores: ${product.store_count} | Purchased: ${product.times_purchased} times`);
      console.log(`    Price range: €${product.min_price.toFixed(2)} - €${product.max_price.toFixed(2)}\n`);
    });
  } else {
    console.log('⚠️  No products found at multiple stores.');
    console.log('   Price comparison requires:');
    console.log('   1. Receipts from at least 2 different stores');
    console.log('   2. The same products purchased at both stores\n');
  }

  // Check if stores have locations
  const storesWithoutLocation = db.prepare(`
    SELECT COUNT(*) as count FROM stores WHERE location IS NULL OR location = ''
  `).get();

  if (storesWithoutLocation.count > 0) {
    console.log(`⚠️  WARNING: ${storesWithoutLocation.count} store(s) without location data`);
    console.log('   Store map requires location information.');
    console.log('   Re-upload receipts to extract addresses.\n');
  }

  db.close();

  console.log('=== RECOMMENDATIONS ===');
  if (receiptCount.count === 0) {
    console.log('❌ Upload receipts to see any data');
  } else if (storeCount.count < 2) {
    console.log('❌ Upload receipts from different stores for price comparison');
  } else if (multiStoreProducts.length === 0) {
    console.log('❌ Upload receipts with overlapping products for price comparison');
  } else if (storesWithoutLocation.count > 0) {
    console.log('⚠️  Re-upload receipts to get store location data for the map');
  } else {
    console.log('✅ Everything looks good! Features should work.');
  }

} catch (error) {
  console.error('Error reading database:', error.message);
  console.log('\n💡 The database might be corrupted or missing.');
  console.log('   Try: rm -rf data/receipts.db and upload receipts again.');
}
