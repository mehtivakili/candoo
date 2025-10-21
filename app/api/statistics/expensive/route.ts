/**
 * API Route: Expensive Items
 * 
 * GET /api/statistics/expensive
 * 
 * Returns the most expensive items with optional limit parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Top Expensive Items with proper sorting
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
      LIMIT $1
    `, [limit]);

    return NextResponse.json({
      success: true,
      data: topExpensive.rows
    });

  } catch (error: any) {
    console.error('❌ Error fetching expensive items:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch expensive items',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
