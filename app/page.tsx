'use client';

import { useState, useEffect } from 'react';
import { Receipt, TrendingUp, Sparkles, Download, Camera, X, ShoppingCart } from 'lucide-react';
import ReceiptUpload from '@/components/ReceiptUpload';
import SpendingChart from '@/components/SpendingChart';
import ReceiptList from '@/components/ReceiptList';
import BudgetTracker from '@/components/BudgetTracker';
import ExportData from '@/components/ExportData';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
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
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch ALL receipts for total count and total savings (with cache busting)
      const timestamp = new Date().getTime();
      const allReceiptsResponse = await fetch(`/api/receipts?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!allReceiptsResponse.ok) {
        throw new Error('Failed to fetch all receipts');
      }
      const allReceipts = await allReceiptsResponse.json();

      console.log('Fetched receipts from API:', allReceipts.length, 'receipts');
      console.log('Receipt details:', allReceipts.map((r: any) => ({
        id: r.id,
        date: r.receipt_date,
        amount: r.total_amount,
        discount: r.discount_amount,
      })));

      // Fetch current month receipts for "This Month" spending
      const monthResponse = await fetch(
        `/api/receipts?startDate=${firstDay.toISOString().split('T')[0]}&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      if (!monthResponse.ok) {
        throw new Error('Failed to fetch month receipts');
      }
      const monthReceipts = await monthResponse.json();

      // Calculate totals from ALL receipts
      const totalSpent = allReceipts.reduce((sum: number, r: any) => {
        const amount = Number(r.total_amount) || 0;
        return sum + amount;
      }, 0);

      const totalSavings = allReceipts.reduce((sum: number, r: any) => {
        const discount = Number(r.discount_amount) || 0;
        return sum + discount;
      }, 0);

      const receiptCount = allReceipts.length;

      // Calculate this month's spending
      const thisMonthSpent = monthReceipts.reduce((sum: number, r: any) => {
        const amount = Number(r.total_amount) || 0;
        return sum + amount;
      }, 0);

      console.log('Stats calculated:', {
        totalReceipts: receiptCount,
        thisMonthReceipts: monthReceipts.length,
        totalSpent,
        thisMonthSpent,
        totalSavings
      });

      setStats({
        totalSpent,
        receiptCount,
        averageSpent: receiptCount > 0 ? totalSpent / receiptCount : 0,
        thisMonth: thisMonthSpent,
        totalSavings,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUploadSuccess = () => {
    fetchStats();
    setShowUploadModal(false);
  };

  const tabs = [
    { id: 'dashboard', label: 'Analytics', icon: TrendingUp },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Sparkles },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 pb-20 sm:pb-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Receipt Tracker
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300">
                AI-powered expense tracking with smart insights
              </p>
            </div>
            {/* Quick Upload Button in Header - Hidden on mobile, use FAB instead */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden md:flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Camera className="w-5 h-5" />
              <span className="font-semibold">Scan Receipt</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* This Month */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16" />
            <div className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">This Month</p>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                €{stats.thisMonth.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Receipts */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16" />
            <div className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Receipts</p>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {stats.receiptCount}
              </p>
            </div>
          </div>

          {/* Average */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16" />
            <div className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Average</p>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg sm:rounded-xl">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                €{stats.averageSpent.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Total Savings */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16" />
            <div className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-medium text-white/90">Total Savings</p>
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                €{stats.totalSavings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium whitespace-nowrap transition-all duration-200 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label === 'Analytics' ? 'Stats' : tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Spending Analytics
              </h2>
              <SpendingChart onRefresh={fetchStats} />
            </div>
          )}

          {activeTab === 'receipts' && <ReceiptList onUpdate={fetchStats} />}

          {activeTab === 'budgets' && <BudgetTracker />}

          {activeTab === 'export' && <ExportData />}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-110 z-50 flex items-center justify-center group"
          aria-label="Scan receipt"
        >
          <Camera className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
          <span className="hidden md:block absolute right-full mr-3 px-3 py-1 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Scan Receipt
          </span>
        </button>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Scan Receipt
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <ReceiptUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
