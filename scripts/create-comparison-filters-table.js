const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'candoo',
  password: '1234',
  port: 5432,
});

async function createComparisonFiltersTable() {
  try {
    console.log('🔄 Creating comparison_filters table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comparison_filters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ comparison_filters table created successfully');
    
    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comparison_filters_name 
      ON comparison_filters(name)
    `);
    
    console.log('✅ Index created successfully');
    
  } catch (error) {
    console.error('❌ Error creating comparison_filters table:', error);
  } finally {
    await pool.end();
  }
}

createComparisonFiltersTable();
