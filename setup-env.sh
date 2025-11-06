#!/bin/bash

echo "=== Receipt Tracker Environment Setup ==="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✓ .env.local file exists"

    # Check if GEMINI_API_KEY is set
    if grep -q "GEMINI_API_KEY=your_gemini_api_key_here" .env.local 2>/dev/null; then
        echo "❌ GEMINI_API_KEY is still set to placeholder value!"
        echo ""
        echo "You need to add your actual Google Gemini API key."
        echo ""
        echo "To get an API key:"
        echo "  1. Go to: https://makersuite.google.com/app/apikey"
        echo "  2. Click 'Create API Key'"
        echo "  3. Copy the key"
        echo "  4. Edit .env.local and replace 'your_gemini_api_key_here' with your actual key"
        echo ""
        exit 1
    elif grep -q "GEMINI_API_KEY=" .env.local && ! grep -q "GEMINI_API_KEY=$" .env.local; then
        echo "✓ GEMINI_API_KEY appears to be configured"
    else
        echo "❌ GEMINI_API_KEY not found in .env.local"
        echo ""
        echo "Add this line to .env.local:"
        echo "GEMINI_API_KEY=your_actual_api_key_here"
        exit 1
    fi
else
    echo "❌ .env.local file not found!"
    echo ""
    echo "Creating .env.local from example..."

    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "✓ Created .env.local"
        echo ""
        echo "⚠️  IMPORTANT: You must now edit .env.local and add your Google Gemini API key!"
        echo ""
        echo "To get an API key:"
        echo "  1. Go to: https://makersuite.google.com/app/apikey"
        echo "  2. Click 'Create API Key'"
        echo "  3. Copy the key"
        echo "  4. Edit .env.local and replace 'your_gemini_api_key_here' with your key"
        echo ""
        echo "Run this script again after editing .env.local"
        exit 1
    else
        echo "❌ .env.local.example not found!"
        exit 1
    fi
fi

# Check database
if [ -f data/receipts.db ]; then
    echo "✓ Database file exists"

    # Check if it has data
    RECEIPT_COUNT=$(node -e "
        const db = require('better-sqlite3')('./data/receipts.db', {readonly: true});
        const result = db.prepare('SELECT COUNT(*) as count FROM receipts').get();
        console.log(result.count);
        db.close();
    " 2>/dev/null)

    if [ "$RECEIPT_COUNT" = "0" ]; then
        echo "⚠️  Database is empty (0 receipts)"
        echo "   You need to upload receipts through the web interface"
    else
        echo "✓ Database has $RECEIPT_COUNT receipt(s)"
    fi
else
    echo "✓ Database will be created on first receipt upload"
fi

# Check node_modules
if [ -d node_modules ]; then
    echo "✓ Dependencies installed"
else
    echo "❌ Dependencies not installed"
    echo "   Run: npm install"
    exit 1
fi

echo ""
echo "=== Setup Status ==="
echo ""
echo "✅ All requirements met!"
echo ""
echo "Next steps:"
echo "  1. Start the server: npm run dev"
echo "  2. Open browser: http://localhost:3000"
echo "  3. Upload receipts with store addresses visible"
echo "  4. Check map: Analytics → Store Locations"
echo ""
