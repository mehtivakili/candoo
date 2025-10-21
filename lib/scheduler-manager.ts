/**
 * Price Update Scheduler Initialization
 * 
 * This module initializes the price update scheduler when the application starts
 * and provides utilities for managing the scheduler lifecycle
 */

import PriceUpdateScheduler from './price-update-scheduler';
import ConfigManager from './config-manager';

class SchedulerManager {
  private static instance: SchedulerManager;
  private scheduler: PriceUpdateScheduler;
  private isInitialized: boolean = false;

  constructor() {
    this.scheduler = PriceUpdateScheduler.getInstance();
  }

  static getInstance(): SchedulerManager {
    if (!SchedulerManager.instance) {
      SchedulerManager.instance = new SchedulerManager();
    }
    return SchedulerManager.instance;
  }

  /**
   * Initialize the scheduler
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Scheduler manager is already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing price update scheduler...');
      
      // Load configuration from file system
      const configManager = ConfigManager.getInstance();
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
      this.scheduler.updateConfig(schedulerConfig);
      
      // Start the scheduler
      this.scheduler.startScheduler();
      
      this.isInitialized = true;
      console.log('✅ Price update scheduler initialized successfully');
      console.log(`📅 Schedule: ${cronSchedule} (${fileConfig.global_enabled ? 'enabled' : 'disabled'})`);
      
    } catch (error) {
      console.error('❌ Failed to initialize price update scheduler:', error);
      throw error;
    }
  }

  /**
   * Get scheduler instance
   */
  getScheduler(): PriceUpdateScheduler {
    return this.scheduler;
  }

  /**
   * Check if scheduler is initialized
   */
  isSchedulerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Gracefully shutdown the scheduler
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('🛑 Shutting down price update scheduler...');
      
      // Stop the scheduler
      this.scheduler.stopScheduler();
      
      this.isInitialized = false;
      console.log('✅ Price update scheduler shutdown completed');
      
    } catch (error) {
      console.error('❌ Error during scheduler shutdown:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    initialized: boolean;
    schedulerRunning: boolean;
    priceUpdateRunning: boolean;
    config: any;
    currentSession: any;
  } {
    return {
      initialized: this.isInitialized,
      schedulerRunning: this.scheduler.isSchedulerRunning(),
      priceUpdateRunning: this.scheduler.isPriceUpdateRunning(),
      config: this.scheduler.getConfig(),
      currentSession: this.scheduler.getCurrentSession()
    };
  }
}

export default SchedulerManager;
