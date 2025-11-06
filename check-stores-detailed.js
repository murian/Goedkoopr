// Detailed store location checker
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'receipts.db');

console.log('=== DETAILED STORE LOCATION CHECK ===\n');
console.log(`Database: ${dbPath}\n`);

try {
  const db = new Database(dbPath, { readonly: true });

  // Check receipts
  const receipts = db.prepare('SELECT * FROM receipts').all();
  console.log(`📄 Total Receipts: ${receipts.length}`);

  if (receipts.length > 0) {
    console.log('\nReceipts:');
    receipts.forEach((r, i) => {
      console.log(`  ${i + 1}. ID: ${r.id}, Store ID: ${r.store_id}, Date: ${r.receipt_date}, Total: €${r.total_amount}`);
    });
  }

  // Check stores
  const stores = db.prepare('SELECT * FROM stores').all();
  console.log(`\n🏪 Total Stores: ${stores.length}`);

  if (stores.length > 0) {
    console.log('\n=== STORES DETAIL ===');
    stores.forEach((s, i) => {
      const receiptsForStore = db.prepare('SELECT COUNT(*) as count FROM receipts WHERE store_id = ?').get(s.id);

      console.log(`\nStore ${i + 1}:`);
      console.log(`  ID: ${s.id}`);
      console.log(`  Name: ${s.name}`);
      console.log(`  Location: ${s.location || 'NULL/EMPTY ❌'}`);
      console.log(`  Location length: ${(s.location || '').length} characters`);
      console.log(`  Receipts: ${receiptsForStore.count}`);

      if (!s.location || s.location.trim() === '') {
        console.log('  ⚠️ WARNING: NO LOCATION DATA - Map cannot show this store!');
      } else if (s.location.length < 10) {
        console.log('  ⚠️ WARNING: Location too vague - may not geocode properly');
      } else {
        console.log('  ✓ Has location data');
      }
    });
  }

  // Check products
  const products = db.prepare('SELECT COUNT(*) as count FROM products').get();
  console.log(`\n📦 Total Products: ${products.count}`);

  // Check receipt items
  const items = db.prepare('SELECT COUNT(*) as count FROM receipt_items').get();
  console.log(`🛒 Total Receipt Items: ${items.count}`);

  db.close();

  console.log('\n=== ANALYSIS ===');

  if (receipts.length === 0) {
    console.log('❌ No receipts found - upload receipts first!');
  } else if (stores.length === 0) {
    console.log('❌ Receipts exist but no stores - database may be corrupted!');
  } else {
    const storesWithLocation = stores.filter(s => s.location && s.location.trim() !== '');
    const storesWithoutLocation = stores.filter(s => !s.location || s.location.trim() === '');

    console.log(`Stores with location data: ${storesWithLocation.length}/${stores.length}`);
    console.log(`Stores without location data: ${storesWithoutLocation.length}/${stores.length}`);

    if (storesWithoutLocation.length > 0) {
      console.log('\n⚠️ PROBLEM: Stores have NO location data!');
      console.log('   The AI did not extract addresses from your receipts.');
      console.log('   \nSolution: Re-upload receipts where store address is visible.');
      console.log('   Make sure the receipt shows the full address:');
      console.log('   Example: "Albert Heijn, Kalverstraat 152, 1012 XE Amsterdam"');
    } else {
      console.log('\n✓ All stores have location data!');
      console.log('  The map should work. If not, the issue is with geocoding.');
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
}
