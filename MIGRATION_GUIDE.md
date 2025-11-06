# Migration Setup Guide

After migrating to a new computer, follow these steps:

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- leaflet (mapping library)
- react-leaflet
- All other dependencies

## Step 2: Setup Environment Variables

Create `.env.local` file in the root directory:

```bash
# Create the file
touch .env.local

# Add your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

Replace `your_api_key_here` with your actual Google Gemini API key.

## Step 3: Database Setup

### Option A: If you have the old database
Copy your `data/receipts.db` file from the old computer to the new one:
```bash
# On old computer, copy the database
scp data/receipts.db user@new-computer:/path/to/project/data/

# Or just manually copy the data/ folder
```

### Option B: If starting fresh
The database will be created automatically when you upload your first receipt.
```bash
# Database will be created at: data/receipts.db
```

## Step 4: Verify Installation

Check if everything is installed correctly:

```bash
# Check if Leaflet is installed
ls node_modules/leaflet && echo "✓ Leaflet installed"

# Check if database exists
ls data/receipts.db && echo "✓ Database exists"

# Check if .env.local exists
ls .env.local && echo "✓ Environment variables configured"
```

## Step 5: Start the Server

```bash
# Clear any old build cache
rm -rf .next

# Start the development server
npm run dev
```

## Step 6: Test Features

1. **Upload a receipt** to verify the system works
2. Go to **Analytics** → **Store Locations** to see the map
3. Go to **Analytics** → **Price Comparison** to see price insights

## Common Issues:

### Issue 1: "Cannot find module 'leaflet'"
**Solution:** Run `npm install`

### Issue 2: Store locations map is empty
**Solution:**
- Check if database has stores: `sqlite3 data/receipts.db "SELECT * FROM stores;"`
- Upload new receipts with location information

### Issue 3: Price comparison shows nothing
**Solution:**
- You need receipts from at least 2 different stores
- The same products must be purchased at both stores
- Upload more receipts to see comparisons

### Issue 4: "Module not found: Can't resolve 'react-leaflet'"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Check Database Content:

```bash
# Count receipts
sqlite3 data/receipts.db "SELECT COUNT(*) FROM receipts;"

# View stores
sqlite3 data/receipts.db "SELECT id, name, location FROM stores;"

# View products for price comparison
sqlite3 data/receipts.db "SELECT p.name, COUNT(DISTINCT r.store_id) as store_count FROM products p INNER JOIN receipt_items ri ON p.id = ri.product_id INNER JOIN receipts r ON ri.receipt_id = r.id GROUP BY p.name HAVING store_count > 1;"
```

## Need Help?

Share the output of these commands:
```bash
npm list leaflet
ls -la data/
cat .env.local | head -n 1  # Show first line only
```
