# SnappFood Menu Scraper

Web scraper and analytics dashboard for SnappFood restaurant menus with price tracking.

## Features

- 🔍 Automated menu extraction from SnappFood
- 📊 Analytics dashboard with price trends and statistics
- 💾 PostgreSQL database for historical data (60 days)
- 📈 Interactive charts with filters
- 🇮🇷 Persian UI with IRANSansX font

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
npm run setup-db
```

Make sure PostgreSQL is running. Default connection:
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `1234`
- Database: `candoo`

Edit `lib/database.ts` to change database credentials.

### 3. Generate Sample Data (Optional)
```bash
npm run generate-data
```

### 4. Run
```bash
npm run dev
```

Open http://localhost:3000

## Usage

**Main Page:** Search for restaurants or paste URL directly to scrape menu and save to database.

**Statistics Page (بررسی آمار):** View analytics including:
- Price trends over time
- Discount analysis  
- Vendor and category breakdowns
- Saved filter presets

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run setup-db         # Create database and tables
npm run generate-data    # Generate 60 days of mock data
npm run clear-data       # Clear historical data
```

## Tech Stack

- Next.js 15 + TypeScript
- PostgreSQL + pg client
- Puppeteer for scraping
- Tailwind CSS
- IRANSansX font

## Database Schema

**menus table:**
- `article_id`, `vendor_id`, `vendor_name`, `group`
- `price`, `original_price`, `discount`
- `description`, `image_url`, `item_count`
- `created_at`, `updated_at`

**menu_filters table:**
- `name`, `from_date`, `to_date`
- `vendor`, `category`, `item`

## License

Educational purposes only. Use responsibly.
