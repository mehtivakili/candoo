/**
 * API Route: Price Update Session Management
 * 
 * GET /api/price-update/session - Get current session status
 */

import { NextRequest, NextResponse } from 'next/server';
import PriceUpdateScheduler from '@/lib/price-update-scheduler';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Loading session status...');
    
    const scheduler = PriceUpdateScheduler.getInstance();
    const currentSession = scheduler.getCurrentSession();
    
    return NextResponse.json({
      success: true,
      session: currentSession,
      isRunning: scheduler.isPriceUpdateRunning(),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error loading session status:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to load session status: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
