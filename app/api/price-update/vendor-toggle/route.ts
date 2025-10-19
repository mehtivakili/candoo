/**
 * API Route: Vendor Auto-Update Toggle
 * 
 * PUT /api/price-update/vendor-toggle - Toggle auto-update for a specific vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import ConfigManager from '@/lib/config-manager';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, enabled } = body;
    
    if (!vendorId || typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: 'vendorId and enabled (boolean) are required'
      }, { status: 400 });
    }

    console.log(`🔄 Toggling auto-update for vendor ${vendorId}: ${enabled}`);
    
    const configManager = ConfigManager.getInstance();
    await configManager.updateVendorAutoUpdate(vendorId, enabled);
    
    return NextResponse.json({
      success: true,
      message: `Vendor auto-update ${enabled ? 'enabled' : 'disabled'}`,
      vendorId,
      enabled,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error toggling vendor auto-update:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to toggle vendor auto-update: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
