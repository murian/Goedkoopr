// Test geocoding for the actual store addresses
const https = require('https');

const addresses = [
  "Oostelijke Handelskade 1065-1070, Amsterdam",
  "Store 3427, Oostelijke Handelskade 1005, 1019 BW Amsterdam",
  "Oostelijke Handelskade 1005, Amsterdam",  // Simplified version
  "Oostelijke Handelskade, Amsterdam"  // Even more simplified
];

async function geocode(address) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    const options = {
      headers: {
        'User-Agent': 'ReceiptExpenseTracker/1.0'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          resolve({ error: error.message });
        }
      });
    }).on('error', (error) => {
      resolve({ error: error.message });
    });
  });
}

async function testAll() {
  console.log('=== GEOCODING TEST ===\n');
  console.log('Testing different address formats...\n');

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    console.log(`${i + 1}. Testing: "${address}"`);

    const result = await geocode(address);

    if (result.error) {
      console.log(`   ❌ Error: ${result.error}\n`);
    } else if (result.length > 0) {
      console.log(`   ✅ SUCCESS!`);
      console.log(`   Coordinates: ${result[0].lat}, ${result[0].lon}`);
      console.log(`   Display name: ${result[0].display_name}\n`);
    } else {
      console.log(`   ❌ No results found\n`);
    }

    // Wait 1 second between requests (Nominatim rate limit)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('=== ANALYSIS ===\n');
  console.log('If all tests failed:');
  console.log('  - Geocoding API might be down or rate-limited');
  console.log('  - Try alternative: Google Geocoding API');
  console.log('  - Or: Manually add coordinates to database\n');

  console.log('If simplified addresses worked:');
  console.log('  - We need to clean/simplify addresses before geocoding');
  console.log('  - Remove store numbers and extra details\n');
}

testAll().catch(console.error);
