/**
 * API Route: Discounted Items
 * 
 * GET /api/statistics/discounted
 * 
 * Returns the most discounted items with optional limit parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Most Discounted Items with proper sorting
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
      LIMIT $1
    `, [limit]);

    return NextResponse.json({
      success: true,
      data: mostDiscounted.rows
    });

  } catch (error: any) {
    console.error('❌ Error fetching discounted items:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch discounted items',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
