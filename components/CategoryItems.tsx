'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, Calendar, Store } from 'lucide-react';

interface CategoryItemsProps {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  onClose: () => void;
}

interface CategoryItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  original_price: number;
  discount_amount: number;
  created_at: string;
  receipt_date: string;
  receipt_id: number;
  store_name: string;
}

export default function CategoryItems({ categoryId, categoryName, categoryColor, onClose }: CategoryItemsProps) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchCategoryItems();
  }, [categoryId]);

  const fetchCategoryItems = async () => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/items`);
      if (!response.ok) throw new Error('Failed to fetch items');

      const data = await response.json();
      setItems(data.items);

      const total = data.items.reduce((sum: number, item: CategoryItem) => sum + item.total_price, 0);
      setTotalSpent(total);
    } catch (error) {
      console.error('Failed to fetch category items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColor }}
              />
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                {categoryName}
              </h2>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                ({items.length})
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Total Spent */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Total Spent</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            €{totalSpent.toFixed(2)}
          </p>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No items found in this category
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 pb-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight flex-1">
                        {item.product_name}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          €{item.total_price.toFixed(2)}
                        </p>
                        {item.original_price > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                            €{item.original_price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Store className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{item.store_name}</span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(item.receipt_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Qty: {item.quantity}</span>
                        <span>€{item.unit_price.toFixed(2)} each</span>
                      </div>
                      {item.discount_amount > 0 && (
                        <div className="text-green-600 dark:text-green-400 font-semibold">
                          -€{item.discount_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                        {item.product_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Store className="w-4 h-4" />
                          <span>{item.store_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(item.receipt_date).toLocaleDateString()}</span>
                        </div>
                        <div className="font-medium">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      {item.discount_amount > 0 && (
                        <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-semibold">
                          Saved €{item.discount_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        €{item.total_price.toFixed(2)}
                      </p>
                      {item.original_price > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-through">
                          €{item.original_price.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        €{item.unit_price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
