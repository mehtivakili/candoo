/**
 * API Route: Manual Price Update
 * 
 * POST /api/price-update/manual - Trigger manual price update for specific vendors or all
 */

import { NextRequest, NextResponse } from 'next/server';
import PriceUpdateScheduler from '@/lib/price-update-scheduler';
import ConfigManager from '@/lib/config-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorIds } = body;
    
    console.log('🚀 Manual price update requested', vendorIds ? `for ${vendorIds.length} vendors` : 'for all vendors');
    
    const scheduler = PriceUpdateScheduler.getInstance();
    const configManager = ConfigManager.getInstance();
    
    // Check if already running
    if (scheduler.isPriceUpdateRunning()) {
      return NextResponse.json({
        success: false,
        message: 'Price update is already running',
        currentSession: scheduler.getCurrentSession()
      }, { status: 409 });
    }

    // Start price update
    const session = await scheduler.runPriceUpdate(vendorIds);
    
    // Update vendor last update times in config
    if (session.results) {
      for (const result of session.results) {
        if (result.success) {
          await configManager.updateVendorLastUpdate(result.vendorId);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Price update completed successfully',
      session
    });

  } catch (error: any) {
    console.error('❌ Manual price update error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Price update failed: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
