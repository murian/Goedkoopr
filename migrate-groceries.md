# Category Migration Instructions

## What This Does
Removes the old generic "Groceries" category and updates all products to use more specific categories.

## Run Migration

1. Make sure your dev server is running: `npm run dev`
2. Open a new terminal and run:
   ```bash
   curl -X POST http://localhost:3000/api/migrate-categories
   ```

This will:
- Move all products from "Groceries" → "Other" category
- Delete the "Groceries" category
- Future uploads will use the new specific categories

## After Migration
Upload new receipts and they will be categorized into specific categories like:
- Dairy & Eggs
- Meat & Fish
- Fruits & Vegetables
- etc.
