/**
 * API Route: Price Update Vendors Management
 * 
 * GET /api/price-update/vendors - Get list of vendors with last update info
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import ConfigManager from '@/lib/config-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Loading vendors list...');
    
    const vendorsQuery = `
      SELECT 
        vendor_id,
        vendor_name,
        MAX(updated_at) as last_update,
        MIN(created_at) as first_added,
        COUNT(DISTINCT CONCAT(article_id, '|', COALESCE("group", ''))) as total_items,
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 day' THEN 1 END) as recent_updates,
        CASE 
          WHEN MAX(updated_at) > NOW() - INTERVAL '1 day' THEN 'active'
          WHEN MAX(updated_at) > NOW() - INTERVAL '7 days' THEN 'inactive'
          ELSE 'stale'
        END as status
      FROM menus
      WHERE vendor_id IS NOT NULL AND vendor_id != ''
      GROUP BY vendor_id, vendor_name
      ORDER BY MIN(created_at) ASC
    `;
    
    const result = await query(vendorsQuery);
    const configManager = ConfigManager.getInstance();
    
    // Get vendor configurations
    const vendorConfigs = await configManager.loadVendorConfigs();
    const activeVendors = await configManager.getActiveVendors();
    
    const vendors = result.rows.map(row => {
      const vendorConfig = vendorConfigs.find(v => v.vendor_id === row.vendor_id);
      const isAutoUpdateEnabled = activeVendors.includes(row.vendor_id);
      
      return {
        vendor_id: row.vendor_id,
        vendor_name: row.vendor_name,
        last_updated: row.last_update, // Real latest update from database
        first_added: row.first_added, // When vendor was first discovered
        total_items: parseInt(row.total_items),
        recent_updates: parseInt(row.recent_updates), // Items updated in last 24h
        status: row.status,
        auto_update_enabled: isAutoUpdateEnabled,
        update_frequency: vendorConfig?.update_frequency || 'daily',
        priority: vendorConfig?.priority || 'medium'
      };
    });
    
    console.log(`✅ Loaded ${vendors.length} vendors`);
    
    return NextResponse.json({
      success: true,
      vendors,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error loading vendors:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to load vendors: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
