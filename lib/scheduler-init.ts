/**
 * Enhanced Server-side Scheduler Initialization
 * 
 * This component initializes the price update scheduler on the server side
 * with better error handling and retry logic
 */

'use server';

import SchedulerManager from '@/lib/scheduler-manager';

let schedulerInitialized = false;
let initializationAttempts = 0;
const maxInitializationAttempts = 3;

export async function initializeScheduler(): Promise<void> {
  if (schedulerInitialized) {
    console.log('✅ Scheduler already initialized');
    return;
  }

  initializationAttempts++;
  
  try {
    console.log(`🚀 Initializing price update scheduler... (attempt ${initializationAttempts}/${maxInitializationAttempts})`);
    
    const schedulerManager = SchedulerManager.getInstance();
    await schedulerManager.initialize();
    
    schedulerInitialized = true;
    console.log('✅ Price update scheduler initialized on server startup');
    
    // Verify scheduler is actually running
    const status = schedulerManager.getStatus();
    if (status.schedulerRunning) {
      console.log('✅ Scheduler is running successfully');
    } else {
      console.log('⚠️ Scheduler initialized but not running - this may be normal if disabled');
    }
    
  } catch (error) {
    console.error(`❌ Failed to initialize scheduler on server startup (attempt ${initializationAttempts}):`, error);
    
    if (initializationAttempts < maxInitializationAttempts) {
      console.log(`🔄 Retrying scheduler initialization in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return initializeScheduler();
    } else {
      console.error('❌ Max initialization attempts reached. Scheduler will not start automatically.');
      // Don't throw error to prevent app startup failure
    }
  }
}

export async function getSchedulerStatus(): Promise<any> {
  try {
    const schedulerManager = SchedulerManager.getInstance();
    return schedulerManager.getStatus();
  } catch (error) {
    console.error('❌ Failed to get scheduler status:', error);
    return {
      initialized: false,
      schedulerRunning: false,
      priceUpdateRunning: false,
      config: null,
      currentSession: null
    };
  }
}

export async function shutdownScheduler(): Promise<void> {
  try {
    const schedulerManager = SchedulerManager.getInstance();
    await schedulerManager.shutdown();
    schedulerInitialized = false;
    initializationAttempts = 0;
    console.log('✅ Price update scheduler shutdown completed');
  } catch (error) {
    console.error('❌ Failed to shutdown scheduler:', error);
    throw error;
  }
}

export async function forceRestartScheduler(): Promise<void> {
  try {
    console.log('🔄 Force restarting scheduler...');
    
    // Shutdown first
    await shutdownScheduler();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reinitialize
    await initializeScheduler();
    
    console.log('✅ Scheduler force restart completed');
  } catch (error) {
    console.error('❌ Failed to force restart scheduler:', error);
    throw error;
  }
}