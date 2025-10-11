-- Database Setup for Candoo
-- Run this script in PostgreSQL to create the database and table

-- Create database (run this as postgres superuser)
-- CREATE DATABASE candoo;

-- Connect to candoo database and run the following:
-- \c candoo

-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    article_id VARCHAR(500) NOT NULL,           -- Product name
    vendor_id VARCHAR(1000) NOT NULL,           -- Restaurant URL
    vendor_name VARCHAR(500) NOT NULL,          -- Restaurant name
    "group" VARCHAR(500),                       -- Menu category/group
    price NUMERIC(12, 2),                       -- Final price
    original_price NUMERIC(12, 2),              -- Original price (before discount)
    discount VARCHAR(50),                       -- Discount percentage
    item_count INTEGER DEFAULT 1,               -- Count of items (if available)
    description TEXT,                           -- Product description
    image_url TEXT,                             -- Product image URL
    has_discount BOOLEAN DEFAULT FALSE,         -- Whether product has discount
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    CONSTRAINT unique_product_vendor UNIQUE(article_id, vendor_id, "group")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_id ON menus(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_name ON menus(vendor_name);
CREATE INDEX IF NOT EXISTS idx_group ON menus("group");
CREATE INDEX IF NOT EXISTS idx_created_at ON menus(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at
    BEFORE UPDATE ON menus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON TABLE menus TO your_username;
-- GRANT USAGE, SELECT ON SEQUENCE menus_id_seq TO your_username;

-- Sample query to view all menus
-- SELECT * FROM menus ORDER BY created_at DESC;

-- Sample query to view menus by vendor
-- SELECT * FROM menus WHERE vendor_name = 'پیتزا سیبیل' ORDER BY "group", article_id;

-- Sample query to view discounted items
-- SELECT * FROM menus WHERE has_discount = TRUE ORDER BY discount DESC;

