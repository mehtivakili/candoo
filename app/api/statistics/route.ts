/**
 * API Route: Database Statistics
 * 
 * GET /api/statistics
 * 
 * Returns statistical data from the menus table for analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // 1. General Statistics
    const generalStats = await query(`
      SELECT 
        COUNT(DISTINCT CONCAT(article_id, '|', vendor_id)) as total_items,
        COUNT(DISTINCT vendor_id) as total_vendors,
        COUNT(DISTINCT vendor_name) as total_vendor_names,
        COUNT(DISTINCT "group") as total_categories,
        COUNT(CASE WHEN has_discount THEN 1 END) as discounted_items,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(original_price) as avg_original_price,
        COUNT(DISTINCT DATE(created_at)) as total_days,
        COUNT(*) as total_records
      FROM menus
      WHERE price IS NOT NULL
    `);

    // 2. Items by Vendor
    const itemsByVendor = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          vendor_name,
          article_id,
          "group",
          price,
          has_discount
        FROM menus
        WHERE price IS NOT NULL
        ORDER BY article_id, vendor_id, "group", created_at DESC
      )
      SELECT 
        vendor_name,
        COUNT(*) as item_count,
        AVG(price) as avg_price,
        COUNT(CASE WHEN has_discount THEN 1 END) as discounted_count
      FROM latest_items
      GROUP BY vendor_name
      ORDER BY item_count DESC
    `);

    // 3. Items by Category
    const itemsByCategory = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          "group",
          article_id,
          vendor_id,
          price,
          has_discount
        FROM menus
        WHERE price IS NOT NULL AND "group" IS NOT NULL
        ORDER BY article_id, vendor_id, "group", created_at DESC
      )
      SELECT 
        "group" as category,
        COUNT(*) as item_count,
        AVG(price) as avg_price,
        COUNT(CASE WHEN has_discount THEN 1 END) as discounted_count
      FROM latest_items
      GROUP BY "group"
      ORDER BY item_count DESC
    `);

    // 4. Price Distribution
    const priceDistribution = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          price,
          CONCAT(article_id, '|', vendor_id, '|', "group") as unique_item
        FROM menus
        WHERE price IS NOT NULL
        ORDER BY article_id, vendor_id, "group", created_at DESC
      ),
      price_ranges AS (
        SELECT 
          CASE 
            WHEN price < 50000 THEN '< 50K'
            WHEN price < 100000 THEN '50K-100K'
            WHEN price < 200000 THEN '100K-200K'
            WHEN price < 300000 THEN '200K-300K'
            ELSE '> 300K'
          END as price_range,
          CASE 
            WHEN price < 50000 THEN 1
            WHEN price < 100000 THEN 2
            WHEN price < 200000 THEN 3
            WHEN price < 300000 THEN 4
            ELSE 5
          END as sort_order,
          unique_item
        FROM latest_items
      )
      SELECT 
        price_range,
        COUNT(DISTINCT unique_item) as count
      FROM price_ranges
      GROUP BY price_range, sort_order
      ORDER BY sort_order
    `);

    // 5. Discount Analysis
    const discountAnalysis = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          discount,
          price,
          original_price,
          CONCAT(article_id, '|', vendor_id, '|', "group") as unique_item
        FROM menus
        WHERE has_discount = TRUE AND discount IS NOT NULL AND price IS NOT NULL
        ORDER BY article_id, vendor_id, "group", created_at DESC
      )
      SELECT 
        discount,
        COUNT(DISTINCT unique_item) as count,
        AVG(price) as avg_final_price,
        AVG(original_price) as avg_original_price
      FROM latest_items
      GROUP BY discount
      ORDER BY count DESC
      LIMIT 10
    `);

    // 6. Recent Additions
    const recentAdditions = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          vendor_name,
          "group",
          article_id,
          created_at
        FROM menus
        WHERE price IS NOT NULL
        ORDER BY article_id, vendor_id, "group", created_at DESC
      )
      SELECT 
        vendor_name,
        "group" as category,
        COUNT(*) as item_count,
        MAX(created_at) as last_added
      FROM latest_items
      GROUP BY vendor_name, "group"
      ORDER BY last_added DESC
      LIMIT 10
    `);

    // 7. Top Expensive Items
    const topExpensive = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          article_id as name,
          vendor_name,
          "group" as category,
          price,
          discount,
          original_price
        FROM menus
        WHERE price IS NOT NULL
        ORDER BY article_id, vendor_id, "group", created_at DESC
      )
      SELECT 
        name,
        vendor_name,
        category,
        price,
        discount,
        original_price
      FROM latest_items
      ORDER BY price DESC
      LIMIT 10
    `);

    // 8. Most Discounted Items
    const mostDiscounted = await query(`
      WITH latest_items AS (
        SELECT DISTINCT ON (article_id, vendor_id, "group")
          article_id as name,
          vendor_name,
          original_price,
          price,
          discount
        FROM menus
        WHERE has_discount = TRUE 
          AND original_price IS NOT NULL 
          AND price IS NOT NULL
          AND original_price > 0
        ORDER BY article_id, vendor_id, "group", created_at DESC
      )
      SELECT 
        name,
        vendor_name,
        original_price,
        price,
        discount
      FROM latest_items
      ORDER BY ((original_price - price) / original_price) DESC
      LIMIT 10
    `);

    // 9. Daily Statistics (last 30 days)
    const dailyStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as items_added,
        COUNT(DISTINCT vendor_name) as vendors_added
      FROM menus
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        general: generalStats.rows[0],
        itemsByVendor: itemsByVendor.rows,
        itemsByCategory: itemsByCategory.rows,
        priceDistribution: priceDistribution.rows,
        discountAnalysis: discountAnalysis.rows,
        recentAdditions: recentAdditions.rows,
        topExpensive: topExpensive.rows,
        mostDiscounted: mostDiscounted.rows,
        dailyStats: dailyStats.rows
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

