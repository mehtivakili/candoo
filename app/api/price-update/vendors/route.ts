/**
 * API Route: Price Update Vendors Management
 * 
 * GET /api/price-update/vendors - Get list of vendors with last update info
 * DELETE /api/price-update/vendors - Delete a vendor and all its data
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

export async function DELETE(request: NextRequest) {
  try {
    const { vendorId } = await request.json();
    
    if (!vendorId) {
      return NextResponse.json({
        success: false,
        message: 'Vendor ID is required'
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting vendor: ${vendorId}`);

    // Delete vendor data from menus table
    const deleteMenusQuery = `
      DELETE FROM menus 
      WHERE vendor_id = $1
    `;
    
    const menusResult = await query(deleteMenusQuery, [vendorId]);
    console.log(`✅ Deleted ${menusResult.rowCount} menu items for vendor ${vendorId}`);

    // Remove vendor from configurations
    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig();
    
    // Remove from active/inactive vendors lists
    if (config.vendor_settings?.active_vendors) {
      config.vendor_settings.active_vendors = config.vendor_settings.active_vendors.filter(id => id !== vendorId);
    }
    if (config.vendor_settings?.inactive_vendors) {
      config.vendor_settings.inactive_vendors = config.vendor_settings.inactive_vendors.filter(id => id !== vendorId);
    }
    
    // Update counts
    if (config.vendor_settings) {
      config.vendor_settings.auto_update_enabled_count = config.vendor_settings.active_vendors?.length || 0;
      config.vendor_settings.total_vendors_count = (config.vendor_settings.active_vendors?.length || 0) + (config.vendor_settings.inactive_vendors?.length || 0);
    }
    
    config.last_config_update = new Date().toISOString();
    await configManager.saveConfig(config);

    // Remove vendor from vendor configurations
    const vendorConfigs = await configManager.loadVendorConfigs();
    const updatedConfigs = vendorConfigs.filter(config => config.vendor_id !== vendorId);
    await configManager.saveVendorConfigs(updatedConfigs);

    console.log(`✅ Successfully deleted vendor ${vendorId} and all associated data`);

    return NextResponse.json({
      success: true,
      message: `Vendor ${vendorId} and all associated data deleted successfully`,
      deletedItems: menusResult.rowCount
    });

  } catch (error: any) {
    console.error('❌ Error deleting vendor:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to delete vendor: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
