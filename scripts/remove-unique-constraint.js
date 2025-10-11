const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'candoo',
  password: '1234',
  port: 5432,
});

async function removeUniqueConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Removing unique constraint to allow historical data...\n');
    
    // Drop the unique constraint
    await client.query(`
      ALTER TABLE menus 
      DROP CONSTRAINT IF EXISTS unique_product_vendor;
    `);
    
    console.log('✅ Unique constraint removed successfully!');
    console.log('📊 The menus table now allows multiple entries for the same product with different timestamps.\n');
    
    // Verify the change
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_constraint 
      WHERE conname = 'unique_product_vendor';
    `);
    
    if (result.rows[0].count === '0') {
      console.log('✅ Verification: Constraint successfully removed.\n');
    } else {
      console.log('⚠️  Warning: Constraint may still exist.\n');
    }
    
  } catch (error) {
    console.error('❌ Error removing constraint:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚀 Starting database migration...\n');
removeUniqueConstraint()
  .then(() => {
    console.log('✨ Migration complete! You can now run "npm run generate-data" to generate historical data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });

