# 🗄️ Database Setup Guide - Candoo PostgreSQL Integration

## ✅ What Was Implemented

A complete PostgreSQL database integration for storing SnappFood menu items with:

- **Database:** `candoo`
- **Table:** `menus`
- **Features:**
  - Save vendor menu items to database
  - Store product details (name, price, discount, category)
  - Track vendor information
  - Automatic duplicate handling (upsert)
  - Persian text support

---

## 📋 Database Schema

### Table: `menus`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `article_id` | VARCHAR(500) | Product name |
| `vendor_id` | VARCHAR(1000) | Restaurant URL |
| `vendor_name` | VARCHAR(500) | Restaurant name |
| `group` | VARCHAR(500) | Menu category/group |
| `price` | NUMERIC(12, 2) | Final price |
| `original_price` | NUMERIC(12, 2) | Original price (before discount) |
| `discount` | VARCHAR(50) | Discount percentage |
| `item_count` | INTEGER | Item count (default: 1) |
| `description` | TEXT | Product description |
| `image_url` | TEXT | Product image URL |
| `has_discount` | BOOLEAN | Whether product has discount |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraint:** `(article_id, vendor_id, group)`

---

## 🚀 Setup Instructions

### Step 1: Install PostgreSQL

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password to `1234` (or your preferred password)
4. Default port: `5432`
5. Complete installation

**Alternative (using Docker):**
```bash
docker run --name candoo-postgres -e POSTGRES_PASSWORD=1234 -p 5432:5432 -d postgres
```

---

### Step 2: Create Database

**Option A: Using the provided batch script (Windows)**
```bash
setup-database.bat
```

**Option B: Manual setup using psql**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE candoo;

# Connect to candoo database
\c candoo

# Run the schema file
\i database-setup.sql

# Exit
\q
```

**Option C: Using pgAdmin**
1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name: `candoo`
4. Click "Save"
5. Open Query Tool and run the contents of `database-setup.sql`

---

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript definitions

---

### Step 4: Configure Environment Variables

Create a file named `.env.local` in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=candoo
DB_USER=postgres
DB_PASSWORD=1234
```

**Note:** `.env.local` is automatically loaded by Next.js and ignored by git.

You can copy from the template:
```bash
# See database-config-template.txt for reference
```

---

### Step 5: Test Database Connection

Start the development server:
```bash
npm run dev
```

Test the connection by visiting:
```
http://localhost:3000/api/save-menu
```

You should see:
```json
{
  "success": true,
  "message": "Database connection successful",
  "database": "candoo"
}
```

---

## 🎯 How to Use

### 1. Search for Restaurants

1. Open the app: http://localhost:3000
2. Search for a restaurant (e.g., "پیتزا")
3. Click on a vendor to load their menu

### 2. View Menu

The menu will display with:
- Restaurant information
- Categories
- Products with prices
- Discounts

### 3. Save to Database

Click the **"افزودن به پایگاه داده"** button to save the entire menu to PostgreSQL.

**The button will:**
- Save all products from all categories
- Store vendor information
- Handle duplicates automatically (update if exists)
- Show success message with statistics

---

## 📁 Files Created/Modified

### New Files

1. **`database-setup.sql`**
   - Database schema
   - Table creation
   - Indexes and triggers

2. **`setup-database.bat`**
   - Automated database setup script (Windows)

3. **`lib/database.ts`**
   - Database connection utility
   - Query functions
   - CRUD operations

4. **`app/api/save-menu/route.ts`**
   - API endpoint for saving menus
   - GET: Test connection
   - POST: Save menu items

5. **`database-config-template.txt`**
   - Environment variable template

6. **`DATABASE_SETUP_GUIDE.md`** (this file)
   - Complete setup documentation

### Modified Files

1. **`package.json`**
   - Added `pg` and `@types/pg` dependencies

2. **`components/SnappFoodSearch.tsx`**
   - Added `isSavingToDb` state
   - Added `saveMenuToDatabase` function
   - Added "افزودن به پایگاه داده" button

---

## 🔧 API Endpoints

### GET `/api/save-menu`
Test database connection.

**Response:**
```json
{
  "success": true,
  "message": "Database connection successful",
  "database": "candoo"
}
```

### POST `/api/save-menu`
Save menu items to database.

**Request Body:**
```json
{
  "menuData": {
    "restaurant": {
      "name": "رستوران نمونه",
      "url": "https://snappfood.ir/restaurant/...",
      ...
    },
    "categories": [
      {
        "name": "پیتزا",
        "items": [
          {
            "name": "پیتزا مخصوص",
            "description": "...",
            "pricing": {
              "finalPrice": 150000,
              "originalPrice": 180000,
              "discount": "17%",
              "hasDiscount": true
            },
            "imageUrl": "..."
          }
        ]
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "90 آیتم با موفقیت ذخیره شد",
  "data": {
    "insertedCount": 90,
    "vendorName": "رستوران نمونه",
    "categoriesCount": 12,
    "totalItems": 90
  }
}
```

---

## 📊 Database Functions

The `lib/database.ts` module provides:

### Connection Management
```typescript
getPool()          // Get connection pool
testConnection()   // Test database connection
closePool()        // Close all connections
query()           // Execute raw SQL query
```

### Menu Operations
```typescript
upsertMenuItem(item)        // Insert or update single item
upsertMenuItems(items)      // Bulk insert/update
getMenuItemsByVendor(url)   // Get all items for a vendor
getAllMenuItems(limit)      // Get all items (paginated)
deleteMenuItem(id)          // Delete item by ID
getStatistics()             // Get database statistics
```

---

## 🔍 Querying the Database

### View all saved items
```sql
SELECT * FROM menus ORDER BY created_at DESC LIMIT 50;
```

### View items by vendor
```sql
SELECT * FROM menus 
WHERE vendor_name = 'رستوران نمونه' 
ORDER BY "group", article_id;
```

### View items with discount
```sql
SELECT * FROM menus 
WHERE has_discount = TRUE 
ORDER BY CAST(REPLACE(discount, '%', '') AS INTEGER) DESC;
```

### Count items by vendor
```sql
SELECT vendor_name, COUNT(*) as item_count
FROM menus
GROUP BY vendor_name
ORDER BY item_count DESC;
```

### Get statistics
```sql
SELECT 
  COUNT(*) as total_items,
  COUNT(DISTINCT vendor_id) as total_vendors,
  COUNT(DISTINCT "group") as total_categories,
  COUNT(CASE WHEN has_discount THEN 1 END) as discounted_items,
  AVG(price) as avg_price
FROM menus;
```

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

**Check:**
1. PostgreSQL is running
2. Database `candoo` exists
3. Credentials in `.env.local` are correct
4. Port 5432 is not blocked

**Test connection:**
```bash
psql -U postgres -d candoo
```

### Error: "ECONNREFUSED"

**Solution:**
- Start PostgreSQL service
- **Windows:** Services → postgresql-x64-xx → Start
- **Docker:** `docker start candoo-postgres`

### Error: "password authentication failed"

**Solution:**
- Update password in `.env.local`
- Or reset PostgreSQL password:
  ```bash
  ALTER USER postgres PASSWORD '1234';
  ```

### Error: "relation 'menus' does not exist"

**Solution:**
- Run the schema file:
  ```bash
  psql -U postgres -d candoo -f database-setup.sql
  ```

---

## 🎨 Features Implemented

### ✅ Backend
- PostgreSQL connection pooling
- Database schema with indexes
- Upsert operations (insert or update)
- Bulk insert with transactions
- Query utilities
- Error handling

### ✅ Frontend
- "افزودن به پایگاه داده" button
- Loading state while saving
- Success/error alerts
- Persian text support
- Statistics display

### ✅ Data Handling
- Duplicate prevention (unique constraint)
- Automatic timestamp updates
- Persian digit support
- Image URL storage
- Category preservation

---

## 📈 Next Steps

### Optional Enhancements

1. **View Saved Data**
   - Create a page to view saved menu items
   - Filter by vendor, category, or discount

2. **Export Data**
   - Export to Excel/CSV
   - Generate reports

3. **Analytics**
   - Price comparison across vendors
   - Discount trends
   - Popular items

4. **Admin Panel**
   - Manage saved items
   - Edit prices
   - Delete items

---

## 📝 Summary

You now have a complete PostgreSQL integration that:

- ✅ Stores SnappFood menu items
- ✅ Tracks vendor information
- ✅ Handles discounts and pricing
- ✅ Supports Persian text
- ✅ Prevents duplicates
- ✅ Provides easy-to-use UI button

**To use:**
1. Install PostgreSQL
2. Run `setup-database.bat`
3. Install dependencies: `npm install`
4. Start server: `npm run dev`
5. Search for restaurants and click "افزودن به پایگاه داده"

**Database details:**
- Name: `candoo`
- User: `postgres`
- Password: `1234`
- Port: `5432`

---

## 🎉 Success!

Your database is ready! Click the green "افزودن به پایگاه داده" button when viewing any restaurant menu to save it to PostgreSQL.

---

**Files to reference:**
- `database-setup.sql` - Schema
- `lib/database.ts` - Database utilities
- `app/api/save-menu/route.ts` - API endpoint
- `components/SnappFoodSearch.tsx` - UI implementation

