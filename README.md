# 🍕 SnappFood Menu Scraper & Analytics

A powerful Next.js application for automated restaurant menu extraction from SnappFood with advanced analytics and price tracking capabilities.

## ✨ Features

### 🔍 Data Collection
- **Automated Menu Scraping**: Extract complete restaurant menus including prices, discounts, and descriptions
- **Direct URL Input**: Add vendors directly via URL
- **Search Integration**: Search for restaurants and add them to database
- **Real-time Extraction**: Live data extraction with browser automation using Puppeteer

### 📊 Analytics Dashboard
- **Price Trends**: Visualize price changes over time with interactive charts
- **Discount Analysis**: Track discount patterns across vendors and categories
- **Vendor Comparison**: Compare prices and items across different restaurants
- **Category Statistics**: Analyze menu items by category
- **Historical Data**: 60-day price history with trend analysis

### 🎯 Advanced Features
- **Saved Filters**: Create and save custom filter presets for quick analysis
- **Dual Price Display**: Shows both original and discounted prices
- **Persian UI**: Fully localized Persian interface with IRANSansX font
- **Responsive Design**: Beautiful, modern UI with Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd snapp
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup PostgreSQL Database**
```bash
# Create database and tables
npm run setup-db
```

4. **Configure Database** (if needed)
Edit `lib/database.ts` with your database credentials:
```typescript
host: 'localhost',
port: 5432,
user: 'postgres',
password: 'your-password',
database: 'candoo'
```

5. **Generate Sample Historical Data** (optional)
```bash
npm run generate-data
```

6. **Run the development server**
```bash
npm run dev
```

7. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
snapp/
├── app/
│   ├── api/                    # API routes
│   │   ├── vendor-menu/       # Menu extraction endpoint
│   │   ├── save-menu/         # Save to database
│   │   ├── statistics/        # Analytics data
│   │   ├── price-trends/      # Price trend data
│   │   └── menu-filters/      # Saved filters CRUD
│   ├── statistics/            # Analytics dashboard page
│   ├── fonts.css              # Custom font definitions
│   ├── globals.css            # Global styles
│   └── page.tsx               # Main search & extraction page
├── components/
│   └── SnappFoodSearch.tsx    # Main UI component
├── lib/
│   ├── sophisticated-automation.ts  # Puppeteer scraping logic
│   ├── database.ts            # PostgreSQL connection & queries
│   └── browser-manager.ts     # Browser instance management
├── scripts/
│   ├── setup-database.js      # DB initialization script
│   ├── generate-historical-data.js  # Mock data generator
│   ├── clear-historical-data.js     # Data cleanup
│   └── remove-unique-constraint.js  # Schema modification
├── public/
│   └── fonts/                 # IRANSansX font files
└── database-setup.sql         # Database schema
```

## 🎨 UI Features

### Main Page
- Search for restaurants by name or location
- Direct URL input for specific vendors
- Automatic menu extraction and database storage

### Statistics Page (بررسی آمار)
- **Summary Cards**: Total items, vendors, average prices
- **Price Distribution**: Bar chart visualization
- **Vendor Analysis**: Performance metrics by vendor
- **Category Breakdown**: Items and prices by category
- **Price Trends**: Interactive line chart with filters:
  - Date range selection
  - Vendor filter
  - Category filter  
  - Specific item filter
  - Average calculations for groups
- **Saved Filters**: Save and load custom filter presets

## 🛠️ Technologies Used

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with `pg` client
- **Web Scraping**: Puppeteer
- **Font**: IRANSansX (Persian)
- **Charts**: Custom SVG-based visualizations

## 📊 Database Schema

### `menus` Table
- `id`: Primary key
- `article_id`: Product name
- `vendor_id`: Restaurant URL
- `vendor_name`: Restaurant name
- `group`: Menu category
- `price`: Final price
- `original_price`: Price before discount
- `discount`: Discount percentage
- `item_count`: Available quantity
- `description`: Item description
- `image_url`: Product image
- `has_discount`: Boolean flag
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `menu_filters` Table
- `id`: Primary key
- `name`: Filter preset name
- `from_date`: Start date
- `to_date`: End date
- `vendor`: Vendor filter
- `category`: Category filter
- `item`: Item filter
- `created_at`: Timestamp

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Database Management
npm run setup-db     # Create database and tables
npm run generate-data # Generate 60 days of historical data
npm run clear-data   # Clear all historical data

# Build
npm run build        # Build for production
npm start           # Start production server
```

## 📝 Environment Variables

Create a `.env.local` file (optional):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=candoo
```

## 🎯 How It Works

1. **Data Extraction**: Puppeteer navigates to SnappFood restaurant pages
2. **DOM Scraping**: Extracts menu items, prices, discounts using precise selectors
3. **Data Storage**: Saves extracted data to PostgreSQL database
4. **Historical Tracking**: Maintains price history for trend analysis
5. **Analytics**: Processes data to generate insights and visualizations

## 🔐 Security Notes

- Browser profile data (`snapp-profile/`) is excluded from git
- Database credentials should be kept in environment variables
- Never commit `.env` files with sensitive data

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational and research purposes only.

## ⚠️ Disclaimer

This tool is for educational purposes. Please respect SnappFood's terms of service and use responsibly. Web scraping should be done ethically and in compliance with applicable laws and website terms.

---

**Made with ❤️ for restaurant data analysis**
