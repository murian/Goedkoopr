# Receipt Expense Tracker 🧾💰

An AI-powered web application for scanning supermarket receipts, tracking expenses, and comparing product prices across different stores. Built with Next.js, TypeScript, and powered by Claude/OpenAI for intelligent receipt parsing.

## ✨ Features

### 📸 AI-Powered Receipt Scanning
- Upload receipt images (PNG, JPG, GIF)
- Automatic extraction of store, date, items, and prices using Claude or OpenAI Vision
- Smart product categorization

### 📊 Expense Analytics
- Interactive spending charts (by category and over time)
- Real-time statistics dashboard
- Multi-currency support

### 💰 Budget Tracking
- Set budgets by category or overall
- Visual progress indicators
- Alerts when budgets are exceeded
- Support for daily, weekly, monthly, and yearly budgets

### 🛒 Product Price Comparison
- Compare prices of the same product across different supermarkets
- Find the best deals and potential savings
- Track price history over time

### 📥 Data Export
- Export your data to CSV or JSON
- Perfect for further analysis in Excel, Google Sheets, or custom tools

### 🌍 Multi-Currency Support
- Track expenses in different currencies
- Currency information preserved in all exports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- An API key from either:
  - [Anthropic (Claude)](https://console.anthropic.com/) - Recommended
  - [OpenAI](https://platform.openai.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Locations
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your API key(s):
   ```env
   # Use Claude (recommended)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   AI_PROVIDER=claude

   # OR use OpenAI
   # OPENAI_API_KEY=your_openai_api_key_here
   # AI_PROVIDER=openai

   # Database (optional, default is ./data/receipts.db)
   DATABASE_PATH=./data/receipts.db
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### 1. Upload Your First Receipt

1. Click on the **"Upload Receipt"** tab
2. Click **"Choose File"** and select a receipt image
3. Click **"Upload and Scan Receipt"**
4. The AI will automatically extract all information

### 2. View Your Dashboard

- The **Dashboard** tab shows your spending overview
- View charts by category or over time
- See your monthly statistics at the top

### 3. Set Up Budgets

1. Go to the **"Budgets"** tab
2. Click **"Add Budget"**
3. Choose a category (optional), amount, and period
4. Track your spending against your budget in real-time

### 4. Compare Product Prices

1. Go to the **"Compare Prices"** tab
2. Enter a product name (e.g., "milk", "bread")
3. See prices across all stores where you've purchased that product
4. Find the best deals and potential savings

### 5. Export Your Data

1. Go to the **"Export Data"** tab
2. Choose CSV or JSON format
3. Select your date range
4. Click **"Export"** to download

## 🏗️ Project Structure

```
Locations/
├── app/
│   ├── api/              # API routes
│   │   ├── receipts/     # Receipt CRUD operations
│   │   ├── products/     # Product price comparison
│   │   ├── analytics/    # Spending analytics
│   │   ├── budgets/      # Budget management
│   │   ├── categories/   # Category management
│   │   ├── stores/       # Store management
│   │   └── export/       # Data export
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/           # React components
│   ├── ReceiptUpload.tsx
│   ├── SpendingChart.tsx
│   ├── ReceiptList.tsx
│   ├── BudgetTracker.tsx
│   ├── ProductComparison.tsx
│   └── ExportData.tsx
├── lib/
│   ├── database.ts       # SQLite database setup
│   ├── types.ts          # TypeScript type definitions
│   └── ai-service.ts     # AI integration (Claude/OpenAI)
├── data/                 # SQLite database (auto-created)
├── public/
│   └── uploads/          # Uploaded receipt images
└── package.json
```

## 🗄️ Database Schema

The app uses SQLite with the following tables:

- **stores** - Supermarket information
- **receipts** - Receipt metadata
- **categories** - Expense categories
- **products** - Product catalog
- **receipt_items** - Individual items from receipts
- **budgets** - Budget tracking

## 🤖 AI Integration

### Claude (Anthropic) - Recommended
- Uses `claude-3-5-sonnet-20241022` model
- Excellent accuracy for receipt parsing
- Supports images up to 10MB

### OpenAI
- Uses `gpt-4o` model
- Alternative option for receipt parsing
- Good accuracy and speed

The AI extracts:
- Store name and location
- Receipt date
- Individual items with quantities and prices
- Tax amount and total
- Suggested categories for products

## 🎨 Customization

### Adding New Categories

Categories are automatically created during database initialization. To add more:

1. Edit `lib/database.ts`
2. Add your category to the `categories` array
3. Restart the app

### Changing AI Provider

Set the `AI_PROVIDER` in `.env.local`:
```env
AI_PROVIDER=claude  # or openai
```

### Multi-Currency Support

The app automatically detects and stores currency from receipts. All exports include currency information.

## 🐛 Troubleshooting

### Database Issues

If you encounter database errors:
```bash
rm -rf data/
npm run dev
```
This will recreate the database with the correct schema.

### AI Parsing Issues

If receipt parsing fails:
- Ensure your API key is correct in `.env.local`
- Check that the image is clear and well-lit
- Verify the image size is under 10MB
- Try a different AI provider

### Node Modules Issues

If you have dependency problems:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📦 Production Build

To build for production:

```bash
npm run build
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

**Note:** SQLite database will reset on each deployment. For production, consider using a persistent database like PostgreSQL.

### Other Platforms

You can deploy to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## 🔒 Privacy & Security

- All receipt images are stored locally in the `public/uploads/` folder
- Database is stored locally in the `data/` folder
- AI providers (Anthropic/OpenAI) process receipt images but don't store them
- No data is shared with third parties

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 💡 Tips for Best Results

1. **Take clear photos** - Ensure receipts are well-lit and flat
2. **Upload regularly** - Build up a database for accurate price comparisons
3. **Set realistic budgets** - Use your spending history to guide budget amounts
4. **Review AI results** - Double-check extracted data for accuracy
5. **Export regularly** - Keep backups of your expense data

## 🆘 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the API documentation for Claude/OpenAI
3. Open an issue on GitHub

## 🎉 Enjoy Tracking Your Expenses!

Start saving money by finding the best deals and staying within your budget! 🎯
