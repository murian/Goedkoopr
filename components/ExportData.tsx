'use client';

import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';

export default function ExportData() {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState('30');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const url = `/api/export?format=${format}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;

      const response = await fetch(url);
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `expenses_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Export Your Data
      </h2>

      <p className="text-gray-600 dark:text-gray-400">
        Download your expense data in CSV or JSON format for further analysis or backup.
      </p>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-lg border-2 transition-all ${
                format === 'csv'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <p className="font-semibold text-gray-900 dark:text-white">CSV</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Perfect for Excel, Google Sheets
              </p>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-4 rounded-lg border-2 transition-all ${
                format === 'json'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="font-semibold text-gray-900 dark:text-white">JSON</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                For developers and data analysis
              </p>
            </button>
          </div>
        </div>

        {/* Date Range Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="99999">All time</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 text-lg font-semibold"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Export to {format.toUpperCase()}
            </>
          )}
        </button>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>What's included:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-blue-900 dark:text-blue-100 mt-2 space-y-1">
            <li>Receipt dates and store information</li>
            <li>Product names and categories</li>
            <li>Quantities and prices</li>
            <li>Tax amounts and totals</li>
            <li>Currency information</li>
          </ul>
        </div>
      </div>

      {/* Multi-currency Note */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          <strong>Multi-currency Support:</strong> Your exported data includes currency information for each transaction, making it easy to track expenses in different currencies.
        </p>
      </div>
    </div>
  );
}
