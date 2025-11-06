#!/bin/bash

# Store Location Troubleshooting Script
echo "=== STORE LOCATION MAP TROUBLESHOOTING ==="
echo ""

# Step 1: Check database
echo "Step 1: Checking database..."
node check-db.js > /tmp/db-check.txt 2>&1

RECEIPT_COUNT=$(grep "Total Receipts:" /tmp/db-check.txt | awk '{print $NF}')
STORE_COUNT=$(grep "Total Stores:" /tmp/db-check.txt | awk '{print $NF}')

echo "  📄 Receipts in database: $RECEIPT_COUNT"
echo "  🏪 Stores in database: $STORE_COUNT"
echo ""

if [ "$RECEIPT_COUNT" = "0" ]; then
    echo "❌ PROBLEM FOUND: No receipts uploaded!"
    echo ""
    echo "To upload receipts:"
    echo "  1. Make sure dev server is running: npm run dev"
    echo "  2. Open browser: http://localhost:3000"
    echo "  3. Look for 'Choose Photo' or 'Upload' button"
    echo "  4. Select a receipt image from your computer"
    echo "  5. Click 'Scan Receipt with AI'"
    echo ""
    exit 1
fi

# Step 2: Check if stores have locations
echo "Step 2: Checking if stores have location data..."

cat > /tmp/check-locations.js << 'EOF'
const Database = require('better-sqlite3');
const db = new Database('./data/receipts.db', { readonly: true });

const stores = db.prepare('SELECT id, name, location FROM stores').all();
const withLocation = stores.filter(s => s.location && s.location.trim() !== '');
const withoutLocation = stores.filter(s => !s.location || s.location.trim() === '');

console.log(`Stores with location: ${withLocation.length}/${stores.length}`);
if (withLocation.length > 0) {
    console.log('\n✓ Stores with locations:');
    withLocation.forEach(s => console.log(`  - ${s.name}: "${s.location}"`));
}

if (withoutLocation.length > 0) {
    console.log('\n❌ Stores WITHOUT locations:');
    withoutLocation.forEach(s => console.log(`  - ${s.name}: NO LOCATION`));
}

db.close();
EOF

node /tmp/check-locations.js
STORES_WITH_LOCATION=$(node /tmp/check-locations.js 2>/dev/null | grep "Stores with location:" | cut -d: -f2 | cut -d/ -f1)

echo ""

if [ "$STORES_WITH_LOCATION" = "0" ]; then
    echo "❌ PROBLEM FOUND: Stores exist but have NO location data!"
    echo ""
    echo "This means the AI did not extract addresses from your receipts."
    echo ""
    echo "Solutions:"
    echo "  1. Re-upload receipts where the store ADDRESS is clearly visible"
    echo "  2. Look for receipts that show: Street + Number + City"
    echo "  3. Example: 'Kalverstraat 152, 1012 XE Amsterdam'"
    echo ""
    echo "Check your terminal when uploading - you should see:"
    echo "  Location: <full address>  (not 'EMPTY' or 'NOT EXTRACTED')"
    echo ""
    exit 1
fi

# Step 3: Test geocoding API
echo "Step 3: Testing geocoding..."

cat > /tmp/test-geocoding.js << 'EOF'
const testLocation = "Kalverstraat 152, 1012 XE Amsterdam";

async function testGeocode() {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(testLocation)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'ReceiptExpenseTracker/1.0' } }
        );
        const data = await response.json();

        if (data && data.length > 0) {
            console.log('✓ Geocoding API works!');
            console.log(`  Test location: ${testLocation}`);
            console.log(`  Coordinates: ${data[0].lat}, ${data[0].lon}`);
        } else {
            console.log('❌ Geocoding returned no results');
        }
    } catch (error) {
        console.log('❌ Geocoding API error:', error.message);
    }
}

testGeocode();
EOF

node /tmp/test-geocoding.js
echo ""

# Step 4: Test API endpoint
echo "Step 4: Testing store locations API..."
echo "  (Make sure dev server is running!)"
echo ""

curl -s http://localhost:3000/api/stores/locations 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
console.log('API Response:');
console.log('  Total stores:', data.total_stores || 0);
console.log('  Stores without coords:', data.stores_without_coords || 0);
if (data.stores && data.stores.length > 0) {
    console.log('\\n✓ Stores with coordinates:');
    data.stores.forEach(s => console.log(\`  - \${s.name}: \${s.latitude}, \${s.longitude}\`));
} else {
    console.log('\\n❌ No stores with valid coordinates');
}
" 2>/dev/null || echo "  ⚠️ API not accessible - is dev server running?"

echo ""
echo "=== DIAGNOSTIC COMPLETE ==="
