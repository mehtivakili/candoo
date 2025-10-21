/**
 * API Route: Reload Scheduler Configuration
 * 
 * POST /api/price-update/reload-config - Reload scheduler configuration from file
 */

import { NextRequest, NextResponse } from 'next/server';
import SchedulerManager from '@/lib/scheduler-manager';
import ConfigManager from '@/lib/config-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Reloading scheduler configuration...');
    
    const schedulerManager = SchedulerManager.getInstance();
    const configManager = ConfigManager.getInstance();
    
    // Load the latest configuration from file
    const fileConfig = await configManager.loadConfig();
    
    // Convert file config to scheduler config format
    let cronSchedule = '0 6 * * *'; // Default
    
    if (fileConfig.schedule.days && fileConfig.schedule.days.length > 0) {
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
      
      const cronDays = fileConfig.schedule.days.map((day: string) => dayMap[day]).join(',');
      cronSchedule = `${fileConfig.schedule.minute || 0} ${fileConfig.schedule.hour || 6} * * ${cronDays}`;
    } else {
      // Daily schedule
      cronSchedule = `${fileConfig.schedule.minute || 0} ${fileConfig.schedule.hour || 6} * * *`;
    }
    
    const schedulerConfig = {
      schedule: cronSchedule,
      enabled: fileConfig.global_enabled,
      maxVendorsPerRun: fileConfig.batch_settings.max_vendors_per_run,
      delayBetweenVendors: fileConfig.batch_settings.delay_between_vendors,
      retryAttempts: fileConfig.batch_settings.retry_attempts,
      timeout: fileConfig.batch_settings.timeout
    };
    
    // Update scheduler with loaded config
    const scheduler = schedulerManager.getScheduler();
    scheduler.updateConfig(schedulerConfig);
    
    // Start the scheduler if it's enabled and not already running
    if (fileConfig.global_enabled && !scheduler.isSchedulerRunning()) {
      scheduler.startScheduler();
      console.log('🚀 Scheduler started with new configuration');
    }
    
    console.log('✅ Scheduler configuration reloaded successfully');
    console.log(`📅 New schedule: ${cronSchedule} (${fileConfig.global_enabled ? 'enabled' : 'disabled'})`);
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler configuration reloaded successfully',
      config: schedulerConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error reloading scheduler configuration:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to reload scheduler configuration: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
