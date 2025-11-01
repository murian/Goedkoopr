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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Upload Receipt
      </h2>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Choose File
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-6">
            <img
              src={preview}
              alt="Receipt preview"
              className="max-w-md mx-auto rounded-lg shadow-lg"
            />
            <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              {file?.name}
            </p>
          </div>
        )}

        {/* Upload Button */}
        {file && !uploading && !result && (
          <div className="mt-6 text-center">
            <button
              onClick={handleUpload}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload and Scan Receipt
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
                  ${result.receipt.total_amount.toFixed(2)} {result.receipt.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {result.items.length} items
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Items:</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {result.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.quantity}x {item.product_name}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${item.total_price.toFixed(2)}
                    </span>
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
