/**
 * Price Update Scheduler Initialization Script
 * 
 * This script can be run to initialize the price update scheduler
 * Usage: node scripts/init-price-scheduler.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Price Update Scheduler...');

try {
  // Check if required dependencies are installed
  console.log('📦 Checking dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['node-cron'];
  const requiredDevDeps = ['@types/node-cron'];
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  const missingDevDeps = requiredDevDeps.filter(dep => !packageJson.devDependencies[dep]);
  
  if (missingDeps.length > 0 || missingDevDeps.length > 0) {
    console.log('⚠️ Missing dependencies, installing...');
    
    if (missingDeps.length > 0) {
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    }
    
    if (missingDevDeps.length > 0) {
      execSync(`npm install --save-dev ${missingDevDeps.join(' ')}`, { stdio: 'inherit' });
    }
    
    console.log('✅ Dependencies installed successfully');
  } else {
    console.log('✅ All dependencies are installed');
  }

  // Check database connection
  console.log('🔍 Testing database connection...');
  try {
    execSync('node scripts/test-connection.js', { stdio: 'inherit' });
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error('Please ensure PostgreSQL is running and configured correctly');
    process.exit(1);
  }

  // Check if scheduler files exist
  console.log('📁 Checking scheduler files...');
  const requiredFiles = [
    'lib/price-update-scheduler.ts',
    'lib/scheduler-manager.ts',
    'app/api/price-update/route.ts',
    'app/price-update-management/page.tsx'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  console.log('✅ All required files exist');

  // Create a simple startup script
  console.log('📝 Creating startup script...');
  
  const startupScript = `#!/usr/bin/env node

/**
 * Price Update Scheduler Startup Script
 * 
 * This script starts the price update scheduler
 */

const { initializeServer } = require('./scripts/start-scheduler.js');

// Start the scheduler
initializeServer().catch(error => {
  console.error('❌ Failed to start scheduler:', error);
  process.exit(1);
});
`;

  fs.writeFileSync('start-price-scheduler.js', startupScript);
  fs.chmodSync('start-price-scheduler.js', '755');
  
  console.log('✅ Startup script created: start-price-scheduler.js');

  // Display usage instructions
  console.log('\n🎉 Price Update Scheduler initialization completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Start your Next.js application: npm run dev');
  console.log('2. Access the management interface: http://localhost:3000/price-update-management');
  console.log('3. Or start the scheduler manually: node start-price-scheduler.js');
  console.log('\n📚 For more information, see: PRICE_UPDATE_SYSTEM.md');

} catch (error) {
  console.error('❌ Initialization failed:', error.message);
  process.exit(1);
}
