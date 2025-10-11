# 🚀 Quick Database Setup (5 Minutes)

## Step 1: Install PostgreSQL (if not already installed)

**Download:** https://www.postgresql.org/download/windows/

- Set password: `1234`
- Keep default port: `5432`
- Complete installation

---

## Step 2: Create Database

**Run the batch script:**
```bash
setup-database.bat
```

This will:
- Create `candoo` database
- Create `menus` table
- Set up indexes

---

## Step 3: Install Dependencies

```bash
npm install
```

---

## Step 4: Start the App

```bash
npm run dev
```

---

## Step 5: Test It!

1. Open http://localhost:3000
2. Search for "پیتزا"
3. Click on a restaurant
4. Click the green **"افزودن به پایگاه داده"** button
5. Success! ✅

---

## 🎯 That's it!

Your menu items are now saved in PostgreSQL database `candoo`.

### View saved data:
```bash
psql -U postgres -d candoo

SELECT * FROM menus ORDER BY created_at DESC LIMIT 10;
```

---

## ❓ Troubleshooting

**Error: "connection refused"**
- Make sure PostgreSQL is running
- Check Services → postgresql

**Error: "database does not exist"**
- Run `setup-database.bat` again

**Need help?**
- See `DATABASE_SETUP_GUIDE.md` for detailed instructions

---

## 📊 Files Overview

| File | Purpose |
|------|---------|
| `database-setup.sql` | Database schema |
| `setup-database.bat` | Automated setup script |
| `lib/database.ts` | Database utilities |
| `app/api/save-menu/route.ts` | Save API endpoint |

---

**Database:** `candoo`  
**Password:** `1234`  
**Port:** `5432`

✅ Ready to save menus!

