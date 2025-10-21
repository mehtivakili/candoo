/**
 * Application Startup Script
 * 
 * This script ensures the scheduler starts automatically when the application starts
 */

import { initializeScheduler } from './scheduler-init';

// Initialize scheduler on module load
let startupInitialized = false;

export async function ensureSchedulerStarted(): Promise<void> {
  if (startupInitialized) {
    return;
  }

  try {
    console.log('🚀 Application startup: Ensuring scheduler is initialized...');
    await initializeScheduler();
    startupInitialized = true;
    console.log('✅ Application startup: Scheduler initialization completed');
  } catch (error) {
    console.error('❌ Application startup: Failed to initialize scheduler:', error);
    // Don't throw error to prevent app startup failure
  }
}

// Auto-initialize on import
ensureSchedulerStarted();


