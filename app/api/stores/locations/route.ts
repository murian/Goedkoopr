import { NextResponse } from 'next/server';
import db from '@/lib/database';

interface StoreLocation {
  id: number;
  name: string;
  location: string;
  receipt_count: number;
  total_amount: number;
  latitude: number | null;
  longitude: number | null;
}

// Simple cache for geocoded locations to avoid repeated API calls
const geocodeCache = new Map<string, { lat: number; lon: number } | null>();

function cleanAddressForGeocoding(address: string): string {
  let cleaned = address;

  // Remove "Store XXXX" or "Branch XXXX" prefixes
  cleaned = cleaned.replace(/Store\s+\d+,?\s*/i, '');
  cleaned = cleaned.replace(/Branch\s+\d+,?\s*/i, '');
  cleaned = cleaned.replace(/Fili[aä]al\s+\d+,?\s*/i, '');

  // Remove building number ranges like "1065-1070" - keep just the first number
  cleaned = cleaned.replace(/(\d+)-\d+/g, '$1');

  // Clean up extra commas and spaces
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  if (!location || location.trim() === '') return null;

  // Clean the address first
  const cleanedLocation = cleanAddressForGeocoding(location);

  console.log(`🌍 Geocoding: "${location}" → "${cleanedLocation}"`);

  // Check cache first (using cleaned version)
  if (geocodeCache.has(cleanedLocation)) {
    const cached = geocodeCache.get(cleanedLocation)!;
    if (cached) {
      console.log(`   ✓ Cache hit: ${cached.lat}, ${cached.lon}`);
    } else {
      console.log(`   ✗ Cache hit: previously failed`);
    }
    return cached;
  }

  try {
    // Try with cleaned address first
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedLocation)}&format=json&limit=1&countrycodes=nl`,
      {
        headers: {
          'User-Agent': 'ReceiptExpenseTracker/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('   ✗ Geocoding failed:', response.statusText);
      geocodeCache.set(cleanedLocation, null);
      return null;
    }

    let data = await response.json();

    // If no results, try with just street and city (remove house number)
    if (!data || data.length === 0) {
      const simplifiedAddress = cleanedLocation.replace(/\d+[a-z]?,?\s*/g, '').trim();
      console.log(`   ⚠️ No results, trying simplified: "${simplifiedAddress}"`);

      // Wait 1 second to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simplifiedAddress)}&format=json&limit=1&countrycodes=nl`,
        {
          headers: {
            'User-Agent': 'ReceiptExpenseTracker/1.0',
          },
        }
      );

      if (response.ok) {
        data = await response.json();
      }
    }

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
      console.log(`   ✓ SUCCESS: ${result.lat}, ${result.lon}`);
      console.log(`   Found: ${data[0].display_name}`);
      geocodeCache.set(cleanedLocation, result);
      return result;
    }

    console.log(`   ✗ No results found`);
    geocodeCache.set(cleanedLocation, null);
    return null;
  } catch (error) {
    console.error('   ✗ Error geocoding:', error);
    geocodeCache.set(cleanedLocation, null);
    return null;
  }
}

export async function GET() {
  try {
    // Get all stores with their receipt counts and total spending
    const stores = db.prepare(`
      SELECT
        s.id,
        s.name,
        s.location,
        COUNT(r.id) as receipt_count,
        COALESCE(SUM(r.total_amount), 0) as total_amount
      FROM stores s
      LEFT JOIN receipts r ON s.id = r.store_id
      GROUP BY s.id, s.name, s.location
      HAVING receipt_count > 0
      ORDER BY receipt_count DESC
    `).all() as any[];

    // Geocode locations and build response
    const storeLocations: StoreLocation[] = await Promise.all(
      stores.map(async (store) => {
        let latitude = null;
        let longitude = null;

        if (store.location) {
          const coords = await geocodeLocation(store.location);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lon;
          }
        }

        return {
          id: store.id,
          name: store.name,
          location: store.location || 'Unknown',
          receipt_count: Number(store.receipt_count) || 0,
          total_amount: Number(store.total_amount) || 0,
          latitude,
          longitude,
        };
      })
    );

    // Filter out stores without valid coordinates
    const validLocations = storeLocations.filter(
      (store) => store.latitude !== null && store.longitude !== null
    );

    return NextResponse.json({
      stores: validLocations,
      total_stores: validLocations.length,
      stores_without_coords: storeLocations.length - validLocations.length,
    });
  } catch (error) {
    console.error('Failed to fetch store locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store locations' },
      { status: 500 }
    );
  }
}
