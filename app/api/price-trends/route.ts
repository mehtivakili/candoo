import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const earliestOnly = searchParams.get('earliest');
    
    // If only requesting earliest date
    if (earliestOnly === 'true') {
      try {
        const earliestQuery = await query<{ earliest_date: string }>(`
          SELECT MIN(created_at) as earliest_date
          FROM menus
          WHERE created_at IS NOT NULL
        `);
        
        return NextResponse.json({
          success: true,
          earliestDate: earliestQuery.rows[0]?.earliest_date
        });
      } catch (error) {
        console.error('❌ Error fetching earliest date:', error);
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const vendorName = searchParams.get('vendor_name');
    const group = searchParams.get('group');
    const articleId = searchParams.get('article_id');

    // Build dynamic WHERE clause
    const conditions = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (fromDate) {
      conditions.push(`created_at >= $${paramIndex}::timestamp`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`created_at <= $${paramIndex}::timestamp`);
      params.push(toDate);
      paramIndex++;
    }

    if (vendorName && vendorName !== 'all') {
      conditions.push(`vendor_name = $${paramIndex}`);
      params.push(vendorName);
      paramIndex++;
    }

    if (group && group !== 'all') {
      conditions.push(`"group" = $${paramIndex}`);
      params.push(group);
      paramIndex++;
    }

    if (articleId && articleId !== 'all') {
      conditions.push(`article_id = $${paramIndex}`);
      params.push(articleId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Determine aggregation level based on filters
    let queryText = '';
    
    if (articleId && articleId !== 'all') {
      // Specific item: show actual prices over time
      queryText = `
        SELECT 
          DATE(created_at) as date,
          article_id,
          vendor_name,
          "group",
          AVG(price) as avg_price,
          AVG(CASE WHEN original_price IS NOT NULL THEN original_price ELSE price END) as avg_original_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(*) as data_points
        FROM menus
        ${whereClause}
        GROUP BY DATE(created_at), article_id, vendor_name, "group"
        ORDER BY DATE(created_at) ASC
      `;
    } else if (group && group !== 'all') {
      // Specific group: show average of group
      queryText = `
        SELECT 
          DATE(created_at) as date,
          "group",
          AVG(price) as avg_price,
          AVG(CASE WHEN original_price IS NOT NULL THEN original_price ELSE price END) as avg_original_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(*) as data_points,
          COUNT(DISTINCT article_id) as items_count
        FROM menus
        ${whereClause}
        GROUP BY DATE(created_at), "group"
        ORDER BY DATE(created_at) ASC
      `;
    } else {
      // No specific group: show average across all groups
      queryText = `
        SELECT 
          DATE(created_at) as date,
          AVG(price) as avg_price,
          AVG(CASE WHEN original_price IS NOT NULL THEN original_price ELSE price END) as avg_original_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(*) as data_points,
          COUNT(DISTINCT article_id) as items_count,
          COUNT(DISTINCT "group") as groups_count
        FROM menus
        ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;
    }

    const result = await query<any>(queryText, params);

    // Also fetch available filter options
    const vendorsQuery = await query<{ vendor_name: string }>(`
      SELECT DISTINCT vendor_name 
      FROM menus 
      ORDER BY vendor_name
    `);

    const groupsQuery = await query<{ group: string }>(`
      SELECT DISTINCT "group" 
      FROM menus 
      WHERE "group" IS NOT NULL
      ${vendorName && vendorName !== 'all' ? `AND vendor_name = $1` : ''}
      ORDER BY "group"
    `, vendorName && vendorName !== 'all' ? [vendorName] : []);

    // Get items for selected vendor/group
    let itemsQuery: { rows: { article_id: string }[] } = { rows: [] };
    if (vendorName && vendorName !== 'all') {
      const itemConditions = [`vendor_name = $1`];
      const itemParams: any[] = [vendorName];
      
      if (group && group !== 'all') {
        itemConditions.push(`"group" = $2`);
        itemParams.push(group);
      }
      
      itemsQuery = await query<{ article_id: string }>(`
        SELECT DISTINCT article_id 
        FROM menus 
        WHERE ${itemConditions.join(' AND ')}
        ORDER BY article_id
      `, itemParams);
    }

    return NextResponse.json({
      success: true,
      data: result.rows,
      filters: {
        vendors: vendorsQuery.rows.map(r => r.vendor_name),
        groups: groupsQuery.rows.map(r => r.group),
        items: itemsQuery.rows.map(r => r.article_id)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching price trends:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

