# Deployment Guide for Snapp Food Scraper

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- PM2 process manager
- Git

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Install dotenv (if not already installed)
```bash
npm install dotenv
```

### 3. Create Environment File
Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/snapp_food_db

# JWT Secret for Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Application Configuration
NODE_ENV=production
PORT=3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Browser Configuration (for Puppeteer)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
```

### 4. Setup Database
```bash
npm run setup-db
```

### 5. Build Application
```bash
npm run build
```

### 6. Start with PM2
```bash
pm2 start ecosystem.config.js
```

### 7. Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

## Troubleshooting

### If you get "Cannot find module 'dotenv'" error:
1. Install dotenv: `npm install dotenv`
2. Make sure dotenv is in package.json dependencies
3. Restart PM2: `pm2 restart snapp-food-scraper`

### If you get database connection errors:
1. Check your DATABASE_URL in .env file
2. Ensure PostgreSQL is running
3. Verify database credentials

### If you get port conflicts:
1. Change PORT in .env file
2. Update ecosystem.config.js if needed
3. Restart PM2

## PM2 Commands
- `pm2 status` - Check application status
- `pm2 logs snapp-food-scraper` - View logs
- `pm2 restart snapp-food-scraper` - Restart application
- `pm2 stop snapp-food-scraper` - Stop application
- `pm2 delete snapp-food-scraper` - Remove application from PM2

