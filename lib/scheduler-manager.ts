/**
 * Price Update Scheduler Initialization
 * 
 * This module initializes the price update scheduler when the application starts
 * and provides utilities for managing the scheduler lifecycle
 */

import PriceUpdateScheduler from './price-update-scheduler';

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
      
      // Start the scheduler
      this.scheduler.startScheduler();
      
      this.isInitialized = true;
      console.log('✅ Price update scheduler initialized successfully');
      
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
