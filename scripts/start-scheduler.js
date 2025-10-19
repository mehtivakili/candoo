/**
 * Server Startup Script
 * 
 * This script initializes the price update scheduler when the server starts
 * Run this script to start the scheduler manually or include it in your startup process
 */

import SchedulerManager from './lib/scheduler-manager';

async function initializeServer() {
  console.log('🚀 Starting server initialization...');
  
  try {
    // Initialize the price update scheduler
    const schedulerManager = SchedulerManager.getInstance();
    await schedulerManager.initialize();
    
    console.log('✅ Server initialization completed successfully');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      await schedulerManager.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      await schedulerManager.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeServer();
}

export default initializeServer;
