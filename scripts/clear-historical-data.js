const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'candoo',
  password: '1234',
  port: 5432,
});

async function clearHistoricalData() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Clearing historical data...\n');
    
    // Get count before deletion
    const countBefore = await client.query('SELECT COUNT(*) as count FROM menus');
    console.log(`📊 Current entries: ${countBefore.rows[0].count}`);
    
    // Delete all entries
    await client.query('DELETE FROM menus');
    
    // Get count after deletion
    const countAfter = await client.query('SELECT COUNT(*) as count FROM menus');
    console.log(`📊 Entries after deletion: ${countAfter.rows[0].count}`);
    
    console.log('\n✅ All historical data cleared!');
    console.log('💡 You can now run "npm run generate-data" to create new data with updated logic.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚀 Starting data cleanup...\n');
clearHistoricalData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });

