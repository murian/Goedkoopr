// Test the store locations API endpoint
const http = require('http');

console.log('=== TESTING STORE LOCATIONS API ===\n');

// First, let's check what's in the database
const Database = require('better-sqlite3');
const db = new Database('./data/receipts.db', { readonly: true });

console.log('Step 1: Checking database...');
const stores = db.prepare('SELECT id, name, location FROM stores').all();
console.log(`Found ${stores.length} store(s) in database\n`);

if (stores.length > 0) {
  console.log('Stores in database:');
  stores.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}`);
    console.log(`     Location: ${s.location || 'NULL/EMPTY ❌'}`);
    console.log('');
  });
}

db.close();

console.log('\nStep 2: Testing API endpoint...');
console.log('Make sure your dev server is running (npm run dev)\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/stores/locations',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}\n`);

    try {
      const result = JSON.parse(data);

      console.log('API Response:');
      console.log(`  Total stores: ${result.total_stores || 0}`);
      console.log(`  Stores without coords: ${result.stores_without_coords || 0}`);
      console.log('');

      if (result.stores && result.stores.length > 0) {
        console.log('✅ Stores with valid coordinates:');
        result.stores.forEach((s, i) => {
          console.log(`\n  ${i + 1}. ${s.name}`);
          console.log(`     Location: ${s.location}`);
          console.log(`     Coordinates: ${s.latitude}, ${s.longitude}`);
          console.log(`     Receipts: ${s.receipt_count}`);
          console.log(`     Total spent: €${s.total_amount.toFixed(2)}`);
        });
      } else {
        console.log('❌ NO stores with valid coordinates!\n');

        if (result.stores_without_coords > 0) {
          console.log('PROBLEM: All stores failed geocoding!');
          console.log('\nThis means:');
          console.log('  1. Stores exist in database ✓');
          console.log('  2. But location data is missing OR');
          console.log('  3. Geocoding API failed to find the addresses\n');

          console.log('Solutions:');
          console.log('  - Re-upload receipts with clear store addresses');
          console.log('  - Make sure addresses are complete (street + number + city)');
          console.log('  - Check the terminal when uploading for "Location: ..." output');
        } else if (stores.length > 0) {
          console.log('PROBLEM: Stores in database but API returns empty!');
          console.log('\nThis could mean:');
          console.log('  - Stores have no location data in database');
          console.log('  - Check Step 1 output above for store locations');
        }
      }

    } catch (error) {
      console.error('Failed to parse API response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Failed to connect to API:', error.message);
  console.log('\nMake sure:');
  console.log('  1. Dev server is running: npm run dev');
  console.log('  2. Server is running on http://localhost:3000');
  console.log('  3. No firewall blocking the connection');
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.end();
