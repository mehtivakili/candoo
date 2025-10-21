/**
 * API Route: Price Update Configuration Management
 * 
 * GET /api/price-update/config - Get current configuration
 * PUT /api/price-update/config - Update configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import PriceUpdateScheduler from '@/lib/price-update-scheduler';
import ConfigManager from '@/lib/config-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ Loading scheduler configuration...');
    
    // Load configuration from file system instead of scheduler's in-memory config
    const configManager = ConfigManager.getInstance();
    const fileConfig = await configManager.loadConfig();
    
    const configData = {
      enabled: fileConfig.global_enabled,
      days: fileConfig.schedule.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      hour: fileConfig.schedule.hour || 6,
      minute: fileConfig.schedule.minute || 0,
      maxVendorsPerRun: fileConfig.batch_settings.max_vendors_per_run || 50,
      delayBetweenVendors: fileConfig.batch_settings.delay_between_vendors || 5000
    };
    
    console.log('📋 Loaded configuration from file:', configData);
    
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
    
    // Also save to file system using ConfigManager
    const configManager = ConfigManager.getInstance();
    
    // Load existing config to preserve vendor settings
    const existingConfig = await configManager.loadConfig();
    
    const fileConfig = {
      global_enabled: config.enabled || false,
      schedule: {
        days: config.days || [],
        hour: config.hour || 6,
        minute: config.minute || 0
      },
      batch_settings: {
        max_vendors_per_run: config.maxVendorsPerRun || 50,
        delay_between_vendors: config.delayBetweenVendors || 5000,
        retry_attempts: 3,
        timeout: 60000
      },
      vendor_settings: existingConfig.vendor_settings || {
        active_vendors: [],
        inactive_vendors: [],
        auto_update_enabled_count: 0,
        total_vendors_count: 0
      },
      last_config_update: new Date().toISOString()
    };
    
    await configManager.saveConfig(fileConfig);
    
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
