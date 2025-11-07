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
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Empty means current month
  const [availableMonths, setAvailableMonths] = useState<{ value: string; label: string }[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [stats, setStats] = useState({
    totalSpent: 0,
    receiptCount: 0,
    averageSpent: 0,
    thisMonth: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    fetchAvailableMonths();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const response = await fetch('/api/receipts/months');
      const data = await response.json();
      setAvailableMonths(data.months || []);
    } catch (error) {
      console.error('Failed to fetch available months:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const timestamp = new Date().getTime();

      let fetchUrl: string;

      if (selectedMonth === 'all-time') {
        // Fetch all receipts for all-time view
        fetchUrl = `/api/receipts?_t=${timestamp}`;
      } else if (selectedMonth) {
        // Use selected month
        const [year, month] = selectedMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        fetchUrl = `/api/receipts?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&_t=${timestamp}`;
      } else {
        // Use current month
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = today;
        fetchUrl = `/api/receipts?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&_t=${timestamp}`;
      }

      // Fetch receipts for the selected period
      const monthResponse = await fetch(fetchUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!monthResponse.ok) {
        throw new Error('Failed to fetch receipts');
      }
      const monthReceipts = await monthResponse.json();

      console.log('Fetched receipts from API:', monthReceipts.length, 'receipts for period');
      console.log('Receipt details:', monthReceipts.map((r: any) => ({
        id: r.id,
        date: r.receipt_date,
        amount: r.total_amount,
        discount: r.discount_amount,
      })));

      // Calculate stats from filtered receipts
      const totalSpent = monthReceipts.reduce((sum: number, r: any) => {
        const amount = Number(r.total_amount) || 0;
        return sum + amount;
      }, 0);

      const totalSavings = monthReceipts.reduce((sum: number, r: any) => {
        const discount = Number(r.discount_amount) || 0;
        return sum + discount;
      }, 0);

      const receiptCount = monthReceipts.length;

      console.log('Stats calculated:', {
        totalReceipts: receiptCount,
        totalSpent,
        totalSavings
      });

      // Fetch monthly budget
      let totalMonthlyBudget = 0;
      if (selectedMonth !== 'all-time') {
        try {
          const budgetResponse = await fetch('/api/budgets', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          if (budgetResponse.ok) {
            const budgets = await budgetResponse.json();

            // Calculate the period we're looking at
            let periodStart: Date;
            let periodEnd: Date;

            if (selectedMonth) {
              const [year, month] = selectedMonth.split('-');
              periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
              periodEnd = new Date(parseInt(year), parseInt(month), 0);
            } else {
              const today = new Date();
              periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
              periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            }

            // Sum all monthly budgets that overlap with our period
            totalMonthlyBudget = budgets
              .filter((b: any) => {
                const budget = b.budget;
                if (budget.period !== 'monthly') return false;

                const budgetStart = new Date(budget.start_date);
                const budgetEnd = new Date(budget.end_date);

                // Check if budget period overlaps with our period
                return budgetStart <= periodEnd && budgetEnd >= periodStart;
              })
              .reduce((sum: number, b: any) => sum + b.budget.amount, 0);

            console.log('Monthly budget found:', totalMonthlyBudget);
          }
        } catch (budgetError) {
          console.error('Failed to fetch budget:', budgetError);
        }
      }

      setMonthlyBudget(totalMonthlyBudget);

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

  const handleUploadSuccess = () => {
    fetchAvailableMonths(); // Refresh available months
    fetchStats();
    setShowUploadModal(false);
  };

  const getMonthLabel = () => {
    if (!selectedMonth) {
      return 'This Month';
    }
    if (selectedMonth === 'all-time') {
      return 'All Time';
    }
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getBudgetColors = () => {
    // If no budget is set, return default purple gradient
    if (!monthlyBudget || monthlyBudget === 0) {
      return {
        gradient: 'from-violet-500 to-purple-600',
        bgGradient: 'from-violet-400/30 to-purple-400/30',
        shadow: 'shadow-violet-500/10',
        hoverShadow: 'hover:shadow-violet-500/20',
        percentage: 0,
        isOverBudget: false
      };
    }

    const percentage = (stats.thisMonth / monthlyBudget) * 100;

    // Color transitions based on budget usage
    if (percentage < 30) {
      // 0-30%: Green (safe zone)
      return {
        gradient: 'from-emerald-500 to-teal-600',
        bgGradient: 'from-emerald-400/30 to-teal-400/30',
        shadow: 'shadow-emerald-500/10',
        hoverShadow: 'hover:shadow-emerald-500/20',
        percentage,
        isOverBudget: false
      };
    } else if (percentage < 60) {
      // 30-60%: Light green to yellow
      return {
        gradient: 'from-lime-500 to-yellow-500',
        bgGradient: 'from-lime-400/30 to-yellow-400/30',
        shadow: 'shadow-lime-500/10',
        hoverShadow: 'hover:shadow-lime-500/20',
        percentage,
        isOverBudget: false
      };
    } else if (percentage < 80) {
      // 60-80%: Yellow to orange (warning)
      return {
        gradient: 'from-yellow-500 to-orange-500',
        bgGradient: 'from-yellow-400/30 to-orange-400/30',
        shadow: 'shadow-orange-500/10',
        hoverShadow: 'hover:shadow-orange-500/20',
        percentage,
        isOverBudget: false
      };
    } else if (percentage < 100) {
      // 80-100%: Orange to red (danger)
      return {
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-400/30 to-red-400/30',
        shadow: 'shadow-red-500/10',
        hoverShadow: 'hover:shadow-red-500/20',
        percentage,
        isOverBudget: false
      };
    } else {
      // 100%+: Deep red (over budget)
      return {
        gradient: 'from-red-600 to-rose-700',
        bgGradient: 'from-red-500/40 to-rose-500/40',
        shadow: 'shadow-red-600/20',
        hoverShadow: 'hover:shadow-red-600/30',
        percentage,
        isOverBudget: true
      };
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Analytics', icon: TrendingUp },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Sparkles },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-400/30 dark:bg-fuchsia-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 pb-20 sm:pb-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8 sm:mb-10 lg:mb-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight">
                Receipt Tracker
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-300 font-medium">
                AI-powered expense tracking with smart insights ✨
              </p>
            </div>
            {/* Quick Upload Button in Header - Hidden on mobile, use FAB instead */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden md:flex items-center gap-3 px-7 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-purple-700 text-white rounded-2xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 font-bold"
            >
              <Camera className="w-5 h-5" />
              <span>Scan Receipt</span>
            </button>
          </div>
        </div>

        {/* Month Selector - Glassmorphism */}
        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-purple-500/10 border border-white/20 dark:border-white/10">
          <label className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
            📅 View Period:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800/50 transition-all outline-none text-sm sm:text-base font-semibold cursor-pointer hover:border-purple-400 dark:hover:border-purple-600"
          >
            <option value="">Current Month</option>
            <option value="all-time">All Time Overview</option>
            {availableMonths.length > 0 && <option disabled>───────────</option>}
            {availableMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Cards - Bento Grid with Glassmorphism */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
          {/* This Month - Dynamic Budget Color */}
          {(() => {
            const budgetColors = getBudgetColors();
            return (
              <div className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl ${budgetColors.shadow} border border-white/20 dark:border-white/10 hover:shadow-2xl ${budgetColors.hoverShadow} transition-all duration-500 transform hover:scale-105 hover:-translate-y-2`}>
                <div className={`absolute top-0 right-0 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br ${budgetColors.bgGradient} rounded-full -mr-12 -mt-12 sm:-mr-20 sm:-mt-20 blur-2xl group-hover:blur-3xl transition-all duration-500`} />
                <div className="relative p-4 sm:p-5 lg:p-7">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{getMonthLabel()}</p>
                      {monthlyBudget > 0 && (
                        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {budgetColors.percentage.toFixed(0)}% of €{monthlyBudget.toFixed(0)} budget
                        </p>
                      )}
                    </div>
                    <div className={`p-3 bg-gradient-to-br ${budgetColors.gradient} rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    €{stats.thisMonth.toFixed(2)}
                  </p>
                  {monthlyBudget > 0 && (
                    <div className="mt-2 sm:mt-3 h-2 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${budgetColors.gradient} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(budgetColors.percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Receipts */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-emerald-500/10 border border-white/20 dark:border-white/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full -mr-12 -mt-12 sm:-mr-20 sm:-mt-20 blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <div className="relative p-4 sm:p-5 lg:p-7">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Receipts</p>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.receiptCount}
              </p>
            </div>
          </div>

          {/* Average */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-fuchsia-500/10 border border-white/20 dark:border-white/10 hover:shadow-2xl hover:shadow-fuchsia-500/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-fuchsia-400/30 to-pink-400/30 rounded-full -mr-12 -mt-12 sm:-mr-20 sm:-mt-20 blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <div className="relative p-4 sm:p-5 lg:p-7">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Average</p>
                <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-xl sm:rounded-2xl shadow-lg shadow-fuchsia-500/50 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                €{stats.averageSpent.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Total Savings - Hero Card */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl shadow-emerald-500/30 border border-emerald-400/20 hover:shadow-3xl hover:shadow-emerald-500/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-40 sm:h-40 bg-white/20 rounded-full -mr-12 -mt-12 sm:-mr-20 sm:-mt-20 blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <div className="relative p-4 sm:p-5 lg:p-7">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">Total Savings</p>
                <div className="p-3 bg-white/25 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                €{stats.totalSavings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - Glassmorphism */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/10 border border-white/20 dark:border-white/10 mb-6 sm:mb-8 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 font-bold whitespace-nowrap transition-all duration-300 text-sm sm:text-base rounded-xl sm:rounded-2xl ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-105'
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

        {/* Tab Content - Glassmorphism */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/10 border border-white/20 dark:border-white/10 p-5 sm:p-7 lg:p-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 tracking-tight">
                📊 Spending Analytics
              </h2>
              <SpendingChart onRefresh={fetchStats} selectedMonth={selectedMonth} />
            </div>
          )}

          {activeTab === 'receipts' && <ReceiptList onUpdate={fetchStats} />}

          {activeTab === 'budgets' && <BudgetTracker />}

          {activeTab === 'export' && <ExportData />}
        </div>

        {/* Floating Action Button - Modern Design */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-purple-500/50 hover:shadow-3xl hover:shadow-purple-500/60 transition-all duration-500 transform hover:scale-110 hover:rotate-12 z-50 flex items-center justify-center group backdrop-blur-sm border-4 border-white/20"
          aria-label="Scan receipt"
        >
          <Camera className="w-7 h-7 sm:w-9 sm:h-9 group-hover:scale-110 transition-transform drop-shadow-lg" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
          <span className="hidden lg:block absolute right-full mr-4 px-5 py-3 bg-slate-900/90 backdrop-blur-sm text-white text-sm font-bold rounded-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl transform -translate-x-2 group-hover:translate-x-0">
            📸 Scan Receipt
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
