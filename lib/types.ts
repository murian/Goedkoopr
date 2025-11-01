export interface Store {
  id: number;
  name: string;
  location?: string;
  created_at: string;
}

export interface Receipt {
  id: number;
  store_id?: number;
  store_name?: string;
  receipt_date: string;
  total_amount: number;
  currency: string;
  tax_amount: number;
  image_path?: string;
  raw_text?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category_id?: number;
  category_name?: string;
  created_at: string;
}

export interface ReceiptItem {
  id: number;
  receipt_id: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Budget {
  id: number;
  category_id?: number;
  category_name?: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency: string;
  start_date: string;
  end_date?: string;
  active: number;
  created_at: string;
}

export interface ParsedReceipt {
  store_name: string;
  store_location?: string;
  receipt_date: string;
  total_amount: number;
  currency: string;
  tax_amount: number;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    suggested_category?: string;
  }[];
}

export interface ProductPriceComparison {
  product_name: string;
  prices: {
    store_name: string;
    store_location?: string;
    unit_price: number;
    currency: string;
    last_seen: string;
  }[];
  lowest_price: number;
  highest_price: number;
  average_price: number;
}

export interface SpendingByCategory {
  category_name: string;
  category_color: string;
  total_amount: number;
  percentage: number;
}

export interface SpendingOverTime {
  date: string;
  amount: number;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  is_exceeded: boolean;
}
