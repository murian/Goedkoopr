'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, AlertTriangle, CheckCircle, Store } from 'lucide-react';

interface StorePrice {
  store_id: number;
  store_name: string;
  store_location: string;
  avg_price: number;
  times_purchased: number;
  last_purchase_date: string;
}

interface ProductComparison {
  product_id: number;
  product_name: string;
  category_name: string;
  times_purchased: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  price_variance: number;
  stores: StorePrice[];
  potential_savings: number;
}

interface PriceComparisonData {
  summary: {
    total_products_compared: number;
    total_potential_savings: number;
    avg_price_variance: number;
  };
  comparisons: ProductComparison[];
}

export default function PriceComparison() {
  const [data, setData] = useState<PriceComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  useEffect(() => {
    fetchPriceComparisons();
  }, []);

  const fetchPriceComparisons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/price-comparison');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch price comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-indigo-600" />
          Price Comparison Insights
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!data || data.comparisons.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-indigo-600" />
          Price Comparison Insights
        </h3>
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No price comparisons available yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload receipts from different stores with the same products to see price insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">Potential Savings</h4>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            €{data.summary.total_potential_savings.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            If you always bought at the cheapest store
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Products Compared</h4>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data.summary.total_products_compared}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Purchased at multiple stores
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Avg Price Difference</h4>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            €{data.summary.avg_price_variance.toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Average variance per product
          </p>
        </div>
      </div>

      {/* Price Comparison List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-indigo-600" />
          Product Price Comparisons
        </h3>

        <div className="space-y-3">
          {data.comparisons.map((product) => {
            const isExpanded = expandedProduct === product.product_id;
            const cheapestStore = product.stores[0];
            const mostExpensiveStore = product.stores[product.stores.length - 1];
            const priceIncreasePercent = ((product.max_price - product.min_price) / product.min_price) * 100;

            return (
              <div
                key={product.product_id}
                className="border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
              >
                {/* Product Header */}
                <div
                  className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-700 cursor-pointer"
                  onClick={() => setExpandedProduct(isExpanded ? null : product.product_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                          {product.product_name}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold">
                          {product.category_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Purchased {product.times_purchased} times</span>
                        <span>•</span>
                        <span>{product.stores.length} stores</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          €{product.price_variance.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-sm font-bold">+{priceIncreasePercent.toFixed(0)}%</span>
                        </div>
                      </div>
                      {product.potential_savings > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                          Save €{product.potential_savings.toFixed(2)} by shopping smart
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Store Details */}
                {isExpanded && (
                  <div className="p-4 bg-white dark:bg-slate-800 border-t-2 border-gray-200 dark:border-slate-700">
                    <div className="space-y-3">
                      {product.stores.map((store, index) => {
                        const isCheapest = index === 0;
                        const isMostExpensive = index === product.stores.length - 1;
                        const savingsVsCheapest = store.avg_price - product.min_price;

                        return (
                          <div
                            key={store.store_id}
                            className={`p-4 rounded-xl border-2 ${
                              isCheapest
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                : isMostExpensive
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Store className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  <h5 className="font-bold text-gray-900 dark:text-white">
                                    {store.store_name}
                                  </h5>
                                  {isCheapest && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                  {isMostExpensive && product.stores.length > 2 && (
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                  {store.store_location}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Bought {store.times_purchased} time{store.times_purchased > 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  €{store.avg_price.toFixed(2)}
                                </p>
                                {!isCheapest && (
                                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                                    +€{savingsVsCheapest.toFixed(2)} more
                                  </p>
                                )}
                                {isCheapest && (
                                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                                    Best price!
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recommendation */}
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        <strong>💡 Smart Shopping Tip:</strong> Buy <strong>{product.product_name}</strong> at{' '}
                        <strong>{cheapestStore.store_name}</strong> to save up to €{product.price_variance.toFixed(2)} per purchase!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
