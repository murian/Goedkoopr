'use client';

import { useState, useEffect } from 'react';
import { Receipt, TrendingUp, ShoppingCart, Sparkles, Upload, Download, Search } from 'lucide-react';
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
    totalSavings: 0,
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
      const totalSavings = receipts.reduce((sum: number, r: any) => sum + (r.discount_amount || 0), 0);
      const receiptCount = receipts.length;

      setStats({
        totalSpent,
        receiptCount,
        averageSpent: receiptCount > 0 ? totalSpent / receiptCount : 0,
        thisMonth: totalSpent,
        totalSavings,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'compare', label: 'Compare Prices', icon: ShoppingCart },
    { id: 'budgets', label: 'Budgets', icon: Sparkles },
    { id: 'upload', label: 'Upload Receipt', icon: Upload },
    { id: 'export', label: 'Export Data', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Receipt Tracker
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            AI-powered expense tracking with smart insights
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* This Month */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full -mr-16 -mt-16" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">This Month</p>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                €{stats.thisMonth.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Receipts */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -mr-16 -mt-16" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Receipts</p>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.receiptCount}
              </p>
            </div>
          </div>

          {/* Average */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full -mr-16 -mt-16" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Average</p>
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                €{stats.averageSpent.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Total Savings */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white/90">Total Savings</p>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                €{stats.totalSavings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
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
