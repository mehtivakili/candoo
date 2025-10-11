const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'candoo',
  password: '1234',
  port: 5432,
});

async function createMenuFiltersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating menu_filters table...\n');
    
    // Create menu_filters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_filters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        from_date DATE,
        to_date DATE,
        vendor VARCHAR(255),
        category VARCHAR(255),
        item VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ menu_filters table created successfully!');
    
    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_menu_filters_name 
      ON menu_filters(name);
    `);
    
    console.log('✅ Index created on name column');
    
    // Create updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_menu_filters_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_menu_filters_updated_at ON menu_filters;
    `);
    
    await client.query(`
      CREATE TRIGGER trigger_menu_filters_updated_at
      BEFORE UPDATE ON menu_filters
      FOR EACH ROW
      EXECUTE FUNCTION update_menu_filters_updated_at();
    `);
    
    console.log('✅ Trigger for updated_at created');
    
    // Verify table
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_filters'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✅ menu_filters table is ready!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚀 Starting table creation...\n');
createMenuFiltersTable()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });

