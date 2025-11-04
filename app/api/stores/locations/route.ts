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

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  if (!location || location.trim() === '') return null;

  // Check cache first
  if (geocodeCache.has(location)) {
    return geocodeCache.get(location)!;
  }

  try {
    // Use Nominatim (OpenStreetMap) for free geocoding
    // Add a user agent as required by Nominatim usage policy
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'ReceiptExpenseTracker/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      geocodeCache.set(location, null);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
      geocodeCache.set(location, result);
      return result;
    }

    geocodeCache.set(location, null);
    return null;
  } catch (error) {
    console.error('Error geocoding location:', location, error);
    geocodeCache.set(location, null);
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
