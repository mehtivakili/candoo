import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        message: 'شناسه رستوران الزامی است' 
      }, { status: 400 });
    }

    // Decode the vendor ID to handle URL encoding
    const decodedVendorId = decodeURIComponent(vendorId);
    console.log('Fetching items for vendor:', decodedVendorId);

    // First, let's check what vendor IDs exist in the database
    const allVendors = await query(
      `SELECT DISTINCT vendor_id FROM menus ORDER BY vendor_id`
    );
    console.log('Available vendor IDs in database:', allVendors.rows?.map(r => r.vendor_id));

    // Try exact match first
    let items = await query(
      `SELECT * FROM menus WHERE vendor_id = $1 ORDER BY updated_at DESC`,
      [decodedVendorId]
    );

    console.log(`Exact match found ${items.rows?.length || 0} items for vendor ${decodedVendorId}`);

    // If no exact match, try to find by partial match (in case of URL differences)
    if (items.rows?.length === 0) {
      // Extract the restaurant identifier from the URL (the part after the last slash)
      // Remove trailing slash first, then split and get the last part
      const cleanUrl = decodedVendorId.replace(/\/$/, ''); // Remove trailing slash
      const restaurantId = cleanUrl.split('/').pop();
      console.log('Clean URL:', cleanUrl);
      console.log('Restaurant ID extracted:', restaurantId);
      
      if (restaurantId) {
        console.log('Trying partial match for restaurant ID:', restaurantId);
        items = await query(
          `SELECT * FROM menus WHERE vendor_id ILIKE $1 ORDER BY updated_at DESC`,
          [`%${restaurantId}%`]
        );
        console.log(`Partial match found ${items.rows?.length || 0} items`);
        
        // If partial match worked, log the first few results
        if (items.rows?.length > 0) {
          console.log('Partial match successful! First few items:', items.rows.slice(0, 3).map(r => ({ 
            id: r.id, 
            article_id: r.article_id, 
            price: r.price 
          })));
        }
      }
    }

    // If still no items, try to find by vendor name similarity
    if (items.rows?.length === 0) {
      console.log('No items found yet, trying name matching...');
      const cleanUrl = decodedVendorId.replace(/\/$/, ''); // Remove trailing slash
      const restaurantId = cleanUrl.split('/').pop();
      console.log('Restaurant ID for name matching:', restaurantId);
      
      if (restaurantId) {
        // Try to find by restaurant name (extract name before the -r- part)
        const restaurantName = restaurantId.split('-r-')[0];
        console.log('Trying to find by restaurant name:', restaurantName);
        
        const similarVendors = await query(
          `SELECT DISTINCT vendor_id, vendor_name FROM menus WHERE vendor_name ILIKE $1`,
          [`%${restaurantName}%`]
        );
        console.log('Similar vendor IDs found:', similarVendors.rows?.map(r => ({ id: r.vendor_id, name: r.vendor_name })));
        
        // If we found a matching vendor, get its items
        if (similarVendors.rows?.length > 0) {
          const matchingVendorId = similarVendors.rows[0].vendor_id;
          console.log('Using matching vendor ID:', matchingVendorId);
          items = await query(
            `SELECT * FROM menus WHERE vendor_id = $1 ORDER BY updated_at DESC`,
            [matchingVendorId]
          );
          console.log(`Found ${items.rows?.length || 0} items using matching vendor ID`);
          
          // If name matching worked, log the first few results
          if (items.rows?.length > 0) {
            console.log('Name match successful! First few items:', items.rows.slice(0, 3).map(r => ({ 
              id: r.id, 
              article_id: r.article_id, 
              price: r.price 
            })));
          }
        }
      }
    }

    // Log sample items with image URLs for debugging
    if (items.rows?.length > 0) {
      console.log('Sample items with image URLs:', items.rows.slice(0, 3).map(item => ({
        id: item.id,
        article_id: item.article_id,
        image_url: item.image_url,
        has_image: !!item.image_url
      })));
    }

    return NextResponse.json({
      success: true,
      items: items.rows || [],
      debug: {
        searchedFor: decodedVendorId,
        foundItems: items.rows?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching vendor items:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت آیتم‌های رستوران'
    }, { status: 500 });
  }
}
