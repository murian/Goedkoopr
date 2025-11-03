'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ReceiptUploadProps {
  onUploadSuccess?: () => void;
}

export default function ReceiptUpload({ onUploadSuccess }: ReceiptUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload receipt');
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
      setPreview(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Scan Receipt
      </h2>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-xl p-8 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-800 dark:to-slate-800 transition-all hover:border-indigo-400 dark:hover:border-indigo-500">
        <div className="flex items-center gap-6">
          {/* Upload Icon/Button Section */}
          <div className={`${preview ? 'flex-shrink-0' : 'flex-1 text-center'}`}>
            {!preview && <Upload className="mx-auto h-12 w-12 text-indigo-400 mb-4" />}
            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-semibold"
              >
                <Upload className="w-5 h-5" />
                {preview ? 'Change Photo' : 'Choose Photo'}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {!preview && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                PNG, JPG, GIF up to 10MB
              </p>
            )}
          </div>

          {/* Thumbnail Preview */}
          {preview && (
            <div className="flex-1 flex items-center gap-4">
              <div className="relative group">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-32 h-32 object-cover rounded-xl shadow-lg border-2 border-indigo-200 dark:border-indigo-700 transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <p className="text-white text-xs font-semibold">Preview</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                  {file?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {file && !uploading && !result && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2 font-bold text-lg"
            >
              <Upload className="w-6 h-6" />
              Scan Receipt with AI
            </button>
          </div>
        )}

        {/* Loading */}
        {uploading && (
          <div className="mt-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Scanning receipt with AI...
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg">
              Receipt Successfully Scanned!
            </h3>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Store</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {result.receipt.store_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {result.receipt.receipt_date}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  €{result.receipt.total_amount.toFixed(2)} {result.receipt.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {result.items.length} items
                </p>
              </div>
              {result.receipt.discount_amount > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Savings</p>
                  <p className="font-semibold text-green-600 dark:text-green-400 text-lg">
                    -€{result.receipt.discount_amount.toFixed(2)} saved!
                  </p>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Items:</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {result.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-start text-sm bg-white dark:bg-gray-800 p-2 rounded"
                  >
                    <div className="flex-1">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.quantity}x {item.product_name}
                      </span>
                      {item.discount_amount > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Was €{item.original_price.toFixed(2)} • Saved €{item.discount_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        €{item.total_price.toFixed(2)}
                      </span>
                      {item.discount_amount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                          €{item.original_price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
