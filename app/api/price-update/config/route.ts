/**
 * API Route: Price Update Configuration Management
 * 
 * GET /api/price-update/config - Get current configuration
 * PUT /api/price-update/config - Update configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import PriceUpdateScheduler from '@/lib/price-update-scheduler';

export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ Loading scheduler configuration...');
    
    const scheduler = PriceUpdateScheduler.getInstance();
    const config = scheduler.getConfig();
    
    // Convert cron schedule to days and time
    const cronSchedule = config.schedule;
    let days: string[] = [];
    let hour = 6;
    let minute = 0;
    
    // Parse cron expression (simplified for daily schedules)
    if (cronSchedule.includes('* * *')) {
      // Daily schedule - extract time
      const parts = cronSchedule.split(' ');
      if (parts.length >= 2) {
        minute = parseInt(parts[0]) || 0;
        hour = parseInt(parts[1]) || 6;
      }
      days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    }
    
    const configData = {
      enabled: config.enabled,
      days,
      hour,
      minute,
      maxVendorsPerRun: config.maxVendorsPerRun,
      delayBetweenVendors: config.delayBetweenVendors
    };
    
    return NextResponse.json({
      success: true,
      config: configData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error loading configuration:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to load configuration: ${error.message}`,
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
    
    // Convert days and time to cron expression
    let cronSchedule = '0 6 * * *'; // Default
    
    if (config.days && config.days.length > 0) {
      // Convert day names to cron format
      const dayMap: { [key: string]: number } = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };
      
      const cronDays = config.days.map((day: string) => dayMap[day]).join(',');
      cronSchedule = `${config.minute || 0} ${config.hour || 6} * * ${cronDays}`;
    } else {
      // Daily schedule
      cronSchedule = `${config.minute || 0} ${config.hour || 6} * * *`;
    }
    
    const schedulerConfig = {
      schedule: cronSchedule,
      enabled: config.enabled || false,
      maxVendorsPerRun: config.maxVendorsPerRun || 50,
      delayBetweenVendors: config.delayBetweenVendors || 5000,
      retryAttempts: 3,
      timeout: 60000
    };
    
    scheduler.updateConfig(schedulerConfig);
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: schedulerConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error updating configuration:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to update configuration: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
