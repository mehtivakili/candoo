/**
 * API Route: Price Update Management
 * 
 * POST /api/price-update - Trigger manual price update
 * GET /api/price-update - Get scheduler status and statistics
 * PUT /api/price-update - Update scheduler configuration
 * DELETE /api/price-update - Stop scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import PriceUpdateScheduler, { PriceUpdateConfig } from '@/lib/price-update-scheduler';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Manual price update requested');
    
    const scheduler = PriceUpdateScheduler.getInstance();
    
    // Check if already running
    if (scheduler.isPriceUpdateRunning()) {
      return NextResponse.json({
        success: false,
        message: 'Price update is already running',
        currentSession: scheduler.getCurrentSession()
      }, { status: 409 });
    }

    // Start price update
    const session = await scheduler.runPriceUpdate();
    
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

export async function GET(request: NextRequest) {
  try {
    const scheduler = PriceUpdateScheduler.getInstance();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      // Get price update statistics
      const stats = await scheduler.getPriceUpdateStats();
      
      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'session') {
      // Get current session status
      const currentSession = scheduler.getCurrentSession();
      
      return NextResponse.json({
        success: true,
        currentSession,
        isRunning: scheduler.isPriceUpdateRunning(),
        timestamp: new Date().toISOString()
      });
    }

    // Default: Get scheduler status
    const config = scheduler.getConfig();
    const currentSession = scheduler.getCurrentSession();
    
    return NextResponse.json({
      success: true,
      scheduler: {
        isRunning: scheduler.isSchedulerRunning(),
        isPriceUpdateRunning: scheduler.isPriceUpdateRunning(),
        config,
        currentSession
      },
      endpoints: {
        POST: '/api/price-update - Trigger manual price update',
        GET: '/api/price-update - Get scheduler status',
        'GET?action=stats': '/api/price-update?action=stats - Get price statistics',
        'GET?action=session': '/api/price-update?action=session - Get current session',
        PUT: '/api/price-update - Update scheduler configuration',
        DELETE: '/api/price-update - Stop scheduler'
      },
      features: [
        'Automated daily price updates',
        'Manual price update triggers',
        'Configurable schedule (cron expressions)',
        'Batch processing with delays',
        'Comprehensive logging and monitoring',
        'Error handling and retry logic',
        'Real-time session tracking'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Get scheduler status error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to get scheduler status: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;
    
    if (!config || typeof config !== 'object') {
      return NextResponse.json({
        success: false,
        message: 'Configuration object is required'
      }, { status: 400 });
    }

    console.log('📝 Updating scheduler configuration:', config);
    
    const scheduler = PriceUpdateScheduler.getInstance();
    scheduler.updateConfig(config);
    
    const updatedConfig = scheduler.getConfig();
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler configuration updated successfully',
      config: updatedConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Update configuration error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to update configuration: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🛑 Stopping price update scheduler');
    
    const scheduler = PriceUpdateScheduler.getInstance();
    scheduler.stopScheduler();
    
    return NextResponse.json({
      success: true,
      message: 'Price update scheduler stopped successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Stop scheduler error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to stop scheduler: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
