'use client';

import { useState, useEffect } from 'react';
import { Receipt, Store, Calendar, DollarSign, Trash2, Eye } from 'lucide-react';

interface ReceiptListProps {
  onUpdate?: () => void;
}

export default function ReceiptList({ onUpdate }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (receiptId: number) => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}`);
      const data = await response.json();
      setSelectedReceipt(data);
      setShowDetails(true);
    } catch (error) {
      console.error('Failed to fetch receipt details:', error);
    }
  };

  const handleDelete = async (receiptId: number) => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      await fetch(`/api/receipts/${receiptId}`, { method: 'DELETE' });
      fetchReceipts();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to delete receipt:', error);
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Your Receipts
      </h2>

      {receipts.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No receipts yet.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload your first receipt to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {receipt.store_name || 'Unknown Store'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(receipt.receipt_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${receipt.total_amount.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {receipt.currency}
                    </span>
                  </div>
                  {receipt.discount_amount > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      💰 Saved ${receipt.discount_amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(receipt.id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                  title="View details"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(receipt.id)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                  title="Delete receipt"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Details Modal */}
      {showDetails && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Receipt Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Store</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedReceipt.store_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedReceipt.receipt_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${selectedReceipt.total_amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tax</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${selectedReceipt.tax_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedReceipt.items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.product_name}
                        </p>
                        {item.category_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.category_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${item.total_price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReceipt.image_path && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Receipt Image
                  </h4>
                  <img
                    src={selectedReceipt.image_path}
                    alt="Receipt"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
