'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { SpendingByCategory, SpendingOverTime } from '@/lib/types';
import CategoryItems from './CategoryItems';
import PriceComparison from './PriceComparison';

// Dynamically import StoreMap to avoid SSR issues with Leaflet
const StoreMap = dynamic(() => import('./StoreMap'), { ssr: false });

interface SpendingChartProps {
  onRefresh?: () => void;
  selectedMonth?: string;
}

export default function SpendingChart({ onRefresh, selectedMonth = '' }: SpendingChartProps) {
  const [categoryData, setCategoryData] = useState<SpendingByCategory[]>([]);
  const [timeData, setTimeData] = useState<SpendingOverTime[]>([]);
  const [monthData, setMonthData] = useState<SpendingOverTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'category' | 'time' | 'month' | 'locations' | 'prices'>('category');
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedCategory, setSelectedCategory] = useState<{id: number, name: string, color: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endDate = new Date();
      let startDate = new Date();

      // If specific month is selected, use that month's range
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
      } else {
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
      }

      // Fetch category spending
      const categoryResponse = await fetch(
        `/api/analytics/spending?groupBy=category&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      const categoryResult = await categoryResponse.json();
      setCategoryData(categoryResult);

      // Fetch time-based spending (daily)
      const timeResponse = await fetch(
        `/api/analytics/spending?groupBy=time&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      const timeResult = await timeResponse.json();
      setTimeData(timeResult);

      // Fetch month-based spending
      const monthResponse = await fetch(
        `/api/analytics/spending?groupBy=month&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      const monthResult = await monthResponse.json();
      setMonthData(monthResult);
    } catch (error) {
      console.error('Failed to fetch spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && chartType !== 'locations' && chartType !== 'prices') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setChartType('category')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              chartType === 'category'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setChartType('month')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              chartType === 'month'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            By Month
          </button>
          <button
            onClick={() => setChartType('time')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              chartType === 'time'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            By Day
          </button>
          <button
            onClick={() => setChartType('locations')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              chartType === 'locations'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            Store Locations
          </button>
          <button
            onClick={() => setChartType('prices')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              chartType === 'prices'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            Price Comparison
          </button>
        </div>

        {!selectedMonth && (
          <div className="flex gap-2">
            {/* Date Range Selector - only shown when no specific month is selected */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        )}
      </div>

      {/* Charts */}
      {chartType === 'category' && categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Pie Chart */}
          <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-indigo-100 dark:border-slate-700">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Spending by Category
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">Click any segment to view items</p>
            <ResponsiveContainer width="100%" height={400} className="sm:hidden">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total_amount"
                  nameKey="category_name"
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={50}
                  label={false}
                  onClick={(data) => setSelectedCategory({ id: data.category_id, name: data.category_name, color: data.category_color })}
                  style={{ cursor: 'pointer' }}
                  paddingAngle={3}
                  activeShape={{
                    outerRadius: 85,
                    stroke: '#fff',
                    strokeWidth: 2
                  }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.category_color}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `€${value.toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.category_name
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    padding: '12px 16px',
                  }}
                  itemStyle={{
                    color: '#fff',
                    fontWeight: '600'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={500} className="hidden sm:block">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total_amount"
                  nameKey="category_name"
                  cx="50%"
                  cy="40%"
                  outerRadius={110}
                  innerRadius={65}
                  label={({category_name, percentage, cx, cy, midAngle, innerRadius, outerRadius}) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#64748b"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs font-semibold"
                      >
                        {percentage > 5 ? `${percentage.toFixed(0)}%` : ''}
                      </text>
                    );
                  }}
                  onClick={(data) => setSelectedCategory({ id: data.category_id, name: data.category_name, color: data.category_color })}
                  style={{ cursor: 'pointer' }}
                  paddingAngle={3}
                  activeShape={{
                    outerRadius: 115,
                    stroke: '#fff',
                    strokeWidth: 2
                  }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.category_color}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `€${value.toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.category_name
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    padding: '12px 16px',
                  }}
                  itemStyle={{
                    color: '#fff',
                    fontWeight: '600'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6">
              Amount by Category
              <span className="hidden sm:inline text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(Click to view items)</span>
            </h3>
            <ResponsiveContainer width="100%" height={300} className="sm:hidden">
              <BarChart data={categoryData} onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const payload = data.activePayload[0].payload;
                  setSelectedCategory({ id: payload.category_id, name: payload.category_name, color: payload.category_color });
                }
              }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis
                  dataKey="category_name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#64748b"
                  style={{ fontSize: '10px' }}
                  interval={0}
                />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(value) => `€${value}`}
                  style={{ fontSize: '10px' }}
                />
                <Tooltip
                  formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spending']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar
                  dataKey="total_amount"
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={350} className="hidden sm:block">
              <BarChart data={categoryData} onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const payload = data.activePayload[0].payload;
                  setSelectedCategory({ id: payload.category_id, name: payload.category_name, color: payload.category_color });
                }
              }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis
                  dataKey="category_name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(value) => `€${value}`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spending']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar
                  dataKey="total_amount"
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartType === 'time' && timeData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Daily Spending
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeData}>
              <defs>
                <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                tickFormatter={(value) => `€${value}`}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Daily Spending']}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 5 }}
                activeDot={{ r: 8 }}
                fillOpacity={1}
                fill="url(#colorLine)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === 'month' && monthData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Monthly Spending
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthData}>
              <defs>
                <linearGradient id="colorMonthBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                tickFormatter={(value) => `€${value}`}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Monthly Total']}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                }}
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
              />
              <Bar
                dataKey="amount"
                fill="url(#colorMonthBar)"
                radius={[12, 12, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === 'locations' && (
        <StoreMap />
      )}

      {chartType === 'prices' && (
        <PriceComparison />
      )}

      {chartType !== 'locations' && chartType !== 'prices' && categoryData.length === 0 && timeData.length === 0 && monthData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No spending data available for the selected period.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload some receipts to see your spending analytics!
          </p>
        </div>
      )}

      {/* Category Items Modal */}
      {selectedCategory && (
        <CategoryItems
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          categoryColor={selectedCategory.color}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
