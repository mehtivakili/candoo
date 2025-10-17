import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorName = searchParams.get('vendor_name');
    const group = searchParams.get('group');

    console.log('📊 Fetching comparison data with filters:', {
      vendorName,
      group
    });

    // Get vendors
    const vendorsQuery = await query<{ vendor_name: string }>(`
      SELECT DISTINCT vendor_name 
      FROM menus 
      ORDER BY vendor_name
    `);

    // Get groups (filtered by vendor if provided)
    const groupsQuery = await query<{ group: string }>(`
      SELECT DISTINCT "group" 
      FROM menus 
      WHERE "group" IS NOT NULL
      ${vendorName && vendorName !== 'all' ? `AND vendor_name = $1` : ''}
      ORDER BY "group"
    `, vendorName && vendorName !== 'all' ? [vendorName] : []);

    // Get items (filtered by vendor and group if provided)
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
      filters: {
        vendors: vendorsQuery.rows.map(row => row.vendor_name),
        groups: groupsQuery.rows.map(row => row.group),
        items: itemsQuery.rows.map(row => row.article_id)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching comparison filters:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch comparison filters'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: { vendor_name: string; article_id: string }[] } = await request.json();
    
    console.log('📊 Fetching comparison price data for items:', items);

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items provided for comparison'
      }, { status: 400 });
    }

    // Get latest available price for each item from each vendor
    const comparisonData = await query(`
      SELECT DISTINCT ON (vendor_name, article_id)
        vendor_name,
        article_id,
        price,
        original_price,
        discount,
        created_at
      FROM menus
      WHERE (vendor_name, article_id) IN (${items.map((_: { vendor_name: string; article_id: string }, index: number) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ')})
        AND price IS NOT NULL
        AND price > 0
      ORDER BY vendor_name, article_id, created_at DESC
    `, items.flatMap(item => [item.vendor_name, item.article_id]));

    return NextResponse.json({
      success: true,
      data: comparisonData.rows
    });

  } catch (error: any) {
    console.error('❌ Error fetching comparison data:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch comparison data'
    }, { status: 500 });
  }
}
