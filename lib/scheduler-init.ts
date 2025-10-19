/**
 * Server-side Scheduler Initialization
 * 
 * This component initializes the price update scheduler on the server side
 * and should be imported in the main layout or a server component
 */

'use server';

import SchedulerManager from '@/lib/scheduler-manager';

let schedulerInitialized = false;

export async function initializeScheduler(): Promise<void> {
  if (schedulerInitialized) {
    return;
  }

  try {
    const schedulerManager = SchedulerManager.getInstance();
    await schedulerManager.initialize();
    schedulerInitialized = true;
    console.log('✅ Price update scheduler initialized on server startup');
  } catch (error) {
    console.error('❌ Failed to initialize scheduler on server startup:', error);
    // Don't throw error to prevent app startup failure
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
    console.log('✅ Price update scheduler shutdown completed');
  } catch (error) {
    console.error('❌ Failed to shutdown scheduler:', error);
    throw error;
  }
}
