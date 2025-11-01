'use client';

import { useState, useEffect } from 'react';
import { Receipt, TrendingUp, ShoppingCart, AlertCircle, Upload, Download, Search } from 'lucide-react';
import ReceiptUpload from '@/components/ReceiptUpload';
import SpendingChart from '@/components/SpendingChart';
import ReceiptList from '@/components/ReceiptList';
import BudgetTracker from '@/components/BudgetTracker';
import ProductComparison from '@/components/ProductComparison';
import ExportData from '@/components/ExportData';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalSpent: 0,
    receiptCount: 0,
    averageSpent: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch receipts for current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const response = await fetch(
        `/api/receipts?startDate=${firstDay.toISOString().split('T')[0]}`
      );
      const receipts = await response.json();

      const totalSpent = receipts.reduce((sum: number, r: any) => sum + r.total_amount, 0);
      const receiptCount = receipts.length;

      setStats({
        totalSpent,
        receiptCount,
        averageSpent: receiptCount > 0 ? totalSpent / receiptCount : 0,
        thisMonth: totalSpent,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'compare', label: 'Compare Prices', icon: ShoppingCart },
    { id: 'budgets', label: 'Budgets', icon: AlertCircle },
    { id: 'upload', label: 'Upload Receipt', icon: Upload },
    { id: 'export', label: 'Export Data', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Receipt Expense Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered receipt scanning and expense tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.thisMonth.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receipts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.receiptCount}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.averageSpent.toFixed(2)}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Spending Overview
              </h2>
              <SpendingChart onRefresh={fetchStats} />
            </div>
          )}

          {activeTab === 'receipts' && <ReceiptList onUpdate={fetchStats} />}

          {activeTab === 'compare' && <ProductComparison />}

          {activeTab === 'budgets' && <BudgetTracker />}

          {activeTab === 'upload' && <ReceiptUpload onUploadSuccess={fetchStats} />}

          {activeTab === 'export' && <ExportData />}
        </div>
      </div>
    </div>
  );
}
