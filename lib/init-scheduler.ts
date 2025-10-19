/**
 * Initialize Price Update Scheduler on App Startup
 * 
 * This file should be imported in your main application to start the scheduler
 */

import SchedulerManager from './scheduler-manager';

// Initialize the scheduler when this module is imported
let schedulerInitialized = false;

export async function initializePriceUpdateScheduler() {
  if (schedulerInitialized) {
    console.log('⚠️ Price update scheduler already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing Price Update Scheduler...');
    
    const schedulerManager = SchedulerManager.getInstance();
    await schedulerManager.initialize();
    
    schedulerInitialized = true;
    console.log('✅ Price Update Scheduler initialized successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down scheduler...');
      await schedulerManager.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down scheduler...');
      await schedulerManager.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize Price Update Scheduler:', error);
    // Don't throw error to prevent app startup failure
  }
}

// Auto-initialize if this is the main module
if (require.main === module) {
  initializePriceUpdateScheduler();
}
