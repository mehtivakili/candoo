/**
 * API Route: Toggle All Vendors Auto-Update Status
 * 
 * POST /api/price-update/vendor-toggle-all - Enable/disable auto-update for all vendors
 */

import { NextRequest, NextResponse } from 'next/server';
import ConfigManager from '@/lib/config-manager';

export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: 'Invalid enabled parameter. Must be boolean.'
      }, { status: 400 });
    }

    console.log(`🔄 ${enabled ? 'Activating' : 'Deactivating'} auto-update for all vendors...`);
    
    const configManager = ConfigManager.getInstance();
    
    // Get current vendor configurations
    const vendorConfigs = await configManager.loadVendorConfigs();
    
    // Update all vendor configurations
    const updatedConfigs = vendorConfigs.map(config => ({
      ...config,
      auto_update_enabled: enabled
    }));
    
    // Save updated configurations
    await configManager.saveVendorConfigs(updatedConfigs);
    
    // Also update the main price update configuration
    const mainConfig = await configManager.loadConfig();
    const allVendorIds = updatedConfigs.map(config => config.vendor_id);
    
    if (enabled) {
      // Enable all vendors
      mainConfig.vendor_settings.active_vendors = allVendorIds;
      mainConfig.vendor_settings.inactive_vendors = [];
    } else {
      // Disable all vendors
      mainConfig.vendor_settings.active_vendors = [];
      mainConfig.vendor_settings.inactive_vendors = allVendorIds;
    }
    
    mainConfig.vendor_settings.auto_update_enabled_count = enabled ? allVendorIds.length : 0;
    mainConfig.vendor_settings.total_vendors_count = allVendorIds.length;
    mainConfig.last_config_update = new Date().toISOString();
    
    // Save the main configuration
    await configManager.saveConfig(mainConfig);
    
    console.log(`✅ Successfully ${enabled ? 'activated' : 'deactivated'} auto-update for ${updatedConfigs.length} vendors`);
    
    return NextResponse.json({
      success: true,
      message: `Auto-update ${enabled ? 'activated' : 'deactivated'} for all vendors`,
      affectedVendors: updatedConfigs.length,
      enabled
    });

  } catch (error: any) {
    console.error('❌ Error toggling all vendors:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to toggle all vendors: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
