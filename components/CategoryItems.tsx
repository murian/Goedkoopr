'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, Calendar, Store, Edit2, Check } from 'lucide-react';

interface CategoryItemsProps {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  onClose: () => void;
}

interface CategoryItem {
  id: number;
  product_name: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  original_price: number;
  discount_amount: number;
  created_at: string;
  receipt_date: string;
  receipt_id: number;
  store_name: string;
  category_id: number;
  category_name: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function CategoryItems({ categoryId, categoryName, categoryColor, onClose }: CategoryItemsProps) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategoryItems();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleEditClick = (item: CategoryItem) => {
    setEditingItemId(item.product_id);
    setSelectedCategoryId(item.category_id);
  };

  const handleCategoryChange = async (productId: number, newCategoryId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: newCategoryId }),
      });

      if (!response.ok) throw new Error('Failed to update category');

      // Refresh the items list
      await fetchCategoryItems();
      setEditingItemId(null);
      setSelectedCategoryId(null);
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category. Please try again.');
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

                    <div className="flex items-center justify-between text-xs mb-2">
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

                    {/* Category Edit - Mobile */}
                    {editingItemId === item.product_id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={selectedCategoryId || ''}
                          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                          className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => selectedCategoryId && handleCategoryChange(item.product_id, selectedCategoryId)}
                          className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="p-1.5 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2">
                        <div
                          className="text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1"
                          style={{ backgroundColor: `${item.category_name ? categories.find(c => c.id === item.category_id)?.color || '#9ca3af' : '#9ca3af'}20` }}
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.category_name || 'Uncategorized'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Change category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start justify-between">
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

                    {/* Category Edit - Desktop */}
                    {editingItemId === item.product_id ? (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Category:</span>
                        <select
                          value={selectedCategoryId || ''}
                          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                          className="flex-1 text-sm px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => selectedCategoryId && handleCategoryChange(item.product_id, selectedCategoryId)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="px-3 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-3">
                        <div
                          className="text-sm px-3 py-1.5 rounded-lg inline-flex items-center gap-2"
                          style={{ backgroundColor: `${item.category_name ? categories.find(c => c.id === item.category_id)?.color || '#9ca3af' : '#9ca3af'}20` }}
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.category_name || 'Uncategorized'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Change category"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Change Category</span>
                        </button>
                      </div>
                    )}
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
