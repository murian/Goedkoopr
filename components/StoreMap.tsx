'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, ShoppingBag } from 'lucide-react';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface StoreLocation {
  id: number;
  name: string;
  location: string;
  receipt_count: number;
  total_amount: number;
  latitude: number;
  longitude: number;
}

export default function StoreMap() {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreLocations();
  }, []);

  const fetchStoreLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stores/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch store locations');
      }
      const data = await response.json();
      setStores(data.stores || []);

      if (data.stores_without_coords > 0) {
        console.log(`Note: ${data.stores_without_coords} stores could not be geocoded`);
      }
    } catch (error) {
      console.error('Error fetching store locations:', error);
      setError('Failed to load store locations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-indigo-600" />
          Store Locations
        </h3>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-indigo-600" />
          Store Locations
        </h3>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-indigo-600" />
          Store Locations
        </h3>
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No store locations available yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload receipts with store locations to see them on the map
          </p>
        </div>
      </div>
    );
  }

  // Calculate center of all stores
  const centerLat = stores.reduce((sum, store) => sum + store.latitude, 0) / stores.length;
  const centerLon = stores.reduce((sum, store) => sum + store.longitude, 0) / stores.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <MapPin className="w-6 h-6 text-indigo-600" />
          Store Locations
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">{stores.length}</span> {stores.length === 1 ? 'store' : 'stores'}
        </div>
      </div>

      {/* Store Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-700/50 dark:to-slate-700/50 rounded-xl p-4 border border-indigo-100 dark:border-slate-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{store.name}</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{store.location}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Receipts</p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{store.receipt_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-500">Total Spent</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">€{store.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border-2 border-indigo-100 dark:border-slate-700 shadow-inner">
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={12}
          style={{ height: '400px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stores.map((store) => (
            <Marker key={store.id} position={[store.latitude, store.longitude]}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    {store.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{store.location}</p>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Receipts</p>
                      <p className="text-base font-bold text-indigo-600">{store.receipt_count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-base font-bold text-purple-600">€{store.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
