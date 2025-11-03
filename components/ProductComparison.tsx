'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Store, Calendar } from 'lucide-react';
import { ProductPriceComparison } from '@/lib/types';

export default function ProductComparison() {
  const [searchQuery, setSearchQuery] = useState('');
  const [comparison, setComparison] = useState<ProductPriceComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a product name');
      return;
    }

    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      const response = await fetch(
        `/api/products/compare?name=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch comparison');
      }

      const data = await response.json();
      setComparison(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compare product prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Compare Product Prices
      </h2>

      <p className="text-gray-600 dark:text-gray-400">
        Search for a product to compare prices across different supermarkets and find the best deal!
      </p>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter product name (e.g., Milk, Bread, Eggs)..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {comparison.product_name}
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lowest Price</p>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    €{comparison.lowest_price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{comparison.average_price.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Highest Price</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    €{comparison.highest_price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {comparison.highest_price > comparison.lowest_price && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Potential Savings
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  €{(comparison.highest_price - comparison.lowest_price).toFixed(2)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    ({(((comparison.highest_price - comparison.lowest_price) / comparison.highest_price) * 100).toFixed(1)}% off)
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Store Prices */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Prices by Store
            </h4>
            <div className="grid gap-3">
              {comparison.prices
                .sort((a, b) => a.unit_price - b.unit_price)
                .map((price, index) => {
                  const isLowest = price.unit_price === comparison.lowest_price;
                  const isHighest = price.unit_price === comparison.highest_price;

                  return (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border-2 ${
                        isLowest
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                          : isHighest
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Store className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {price.store_name}
                            </span>
                            {isLowest && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                Best Price
                              </span>
                            )}
                          </div>
                          {price.store_location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                              {price.store_location}
                            </p>
                          )}
                          <div className="flex items-center gap-2 ml-6 mt-1">
                            <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-500" />
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Last seen: {new Date(price.last_seen).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            €{price.unit_price.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {price.currency}
                          </p>
                          {!isLowest && comparison.lowest_price > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              +€{(price.unit_price - comparison.lowest_price).toFixed(2)} more
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Tip:</strong> Prices are based on your uploaded receipts. Upload more receipts to get more accurate comparisons!
            </p>
          </div>
        </div>
      )}

      {!comparison && !loading && !error && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Search for a product to compare prices
          </p>
        </div>
      )}
    </div>
  );
}
