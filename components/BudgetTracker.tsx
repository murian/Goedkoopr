'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { BudgetStatus, Category } from '@/lib/types';

export default function BudgetTracker() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    currency: 'EUR',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
      ]);

      const budgetsData = await budgetsRes.json();
      const categoriesData = await categoriesRes.json();

      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          category_id: '',
          amount: '',
          period: 'monthly',
          currency: 'EUR',
          start_date: new Date().toISOString().split('T')[0],
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budget Tracker
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Budget
        </button>
      </div>

      {/* Create Budget Form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Budget
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category (optional)
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period *
                </label>
                <select
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Budget
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No budgets set yet.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Create your first budget to track your spending!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {budgets.map((budgetStatus) => {
            const budget = budgetStatus.budget;
            const isExceeded = budgetStatus.is_exceeded;
            const percentage = Math.min(budgetStatus.percentage, 100);

            return (
              <div
                key={budget.id}
                className={`rounded-lg p-6 ${
                  isExceeded
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {budget.category_name || 'All Categories'} - {budget.period}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(budget.start_date).toLocaleDateString()} -{' '}
                      {new Date(budget.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  {isExceeded ? (
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Spent: €{budgetStatus.spent.toFixed(2)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Budget: €{budget.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isExceeded
                          ? 'bg-red-600 dark:bg-red-500'
                          : percentage > 75
                          ? 'bg-yellow-500'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm font-medium ${
                        isExceeded
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {budgetStatus.percentage.toFixed(1)}% used
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      €{Math.abs(budgetStatus.remaining).toFixed(2)}{' '}
                      {isExceeded ? 'over budget' : 'remaining'}
                    </span>
                  </div>
                </div>

                {isExceeded && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Budget exceeded!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
