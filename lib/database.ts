/**
 * PostgreSQL Database Connection Utility
 * 
 * This module provides connection and query utilities for the Candoo database.
 */

import { Pool, QueryResult } from 'pg';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'candoo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      console.error('❌ Unexpected database error:', err);
    });
    
    console.log('✅ Database connection pool created');
  }
  
  return pool;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Execute a query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    console.log('📊 Query executed:', {
      query: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', {
      query: text,
      params,
      error
    });
    throw error;
  }
}

/**
 * Close all database connections
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

// Menu item interface
export interface MenuItem {
  id?: number;
  article_id: string;        // Product name
  vendor_id: string;         // Restaurant URL
  vendor_name: string;       // Restaurant name
  group: string;             // Menu category
  price: number | null;      // Final price
  original_price?: number | null;  // Original price
  discount?: string | null;  // Discount percentage
  item_count?: number;       // Item count
  description?: string;      // Product description
  image_url?: string | null; // Product image
  has_discount?: boolean;    // Has discount flag
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Insert or update a menu item
 */
export async function upsertMenuItem(item: MenuItem): Promise<MenuItem> {
  const queryText = `
    INSERT INTO menus (
      article_id, vendor_id, vendor_name, "group", 
      price, original_price, discount, item_count,
      description, image_url, has_discount
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (article_id, vendor_id, "group")
    DO UPDATE SET
      vendor_name = EXCLUDED.vendor_name,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      discount = EXCLUDED.discount,
      item_count = EXCLUDED.item_count,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      has_discount = EXCLUDED.has_discount,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const values = [
    item.article_id,
    item.vendor_id,
    item.vendor_name,
    item.group,
    item.price,
    item.original_price || null,
    item.discount || null,
    item.item_count || 1,
    item.description || null,
    item.image_url || null,
    item.has_discount || false
  ];
  
  const result = await query<MenuItem>(queryText, values);
  return result.rows[0];
}

/**
 * Insert or update multiple menu items (bulk operation)
 */
export async function upsertMenuItems(items: MenuItem[]): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let insertedCount = 0;
    
    for (const item of items) {
      // Simple INSERT without ON CONFLICT to allow historical data
      // Each insert creates a new record with current timestamp
      const queryText = `
        INSERT INTO menus (
          article_id, vendor_id, vendor_name, "group", 
          price, original_price, discount, item_count,
          description, image_url, has_discount
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      const values = [
        item.article_id,
        item.vendor_id,
        item.vendor_name,
        item.group,
        item.price,
        item.original_price || null,
        item.discount || null,
        item.item_count || 1,
        item.description || null,
        item.image_url || null,
        item.has_discount || false
      ];
      
      await client.query(queryText, values);
      insertedCount++;
    }
    
    await client.query('COMMIT');
    console.log(`✅ Inserted/Updated ${insertedCount} menu items`);
    
    return insertedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Bulk insert error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all menu items for a vendor
 */
export async function getMenuItemsByVendor(vendorId: string): Promise<MenuItem[]> {
  const queryText = `
    SELECT * FROM menus
    WHERE vendor_id = $1
    ORDER BY "group", article_id
  `;
  
  const result = await query<MenuItem>(queryText, [vendorId]);
  return result.rows;
}

/**
 * Get all menu items
 */
export async function getAllMenuItems(limit = 100, offset = 0): Promise<MenuItem[]> {
  const queryText = `
    SELECT * FROM menus
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await query<MenuItem>(queryText, [limit, offset]);
  return result.rows;
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(id: number): Promise<boolean> {
  const queryText = `DELETE FROM menus WHERE id = $1`;
  const result = await query(queryText, [id]);
  return (result.rowCount || 0) > 0;
}

/**
 * Get statistics
 */
export async function getStatistics() {
  const queryText = `
    SELECT 
      COUNT(*) as total_items,
      COUNT(DISTINCT vendor_id) as total_vendors,
      COUNT(DISTINCT "group") as total_categories,
      COUNT(CASE WHEN has_discount THEN 1 END) as discounted_items,
      AVG(price) as avg_price
    FROM menus
  `;
  
  const result = await query(queryText);
  return result.rows[0];
}

