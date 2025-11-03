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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {categoryName}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({items.length} items)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Total Spent */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent in this Category</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            €{totalSpent.toFixed(2)}
          </p>
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
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
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                        {item.product_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Store className="w-4 h-4" />
                          {item.store_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.receipt_date).toLocaleDateString()}
                        </div>
                        <div>
                          Qty: {item.quantity}
                        </div>
                      </div>
                      {item.discount_amount > 0 && (
                        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                          Saved €{item.discount_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
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
