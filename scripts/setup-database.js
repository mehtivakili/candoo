/**
 * Automated Database Setup Script
 * 
 * This script will:
 * 1. Connect to PostgreSQL
 * 2. Create the 'candoo' database
 * 3. Create the 'menus' table with proper schema
 * 4. Set up indexes and triggers
 * 
 * Run: node scripts/setup-database.js
 */

const { Client } = require('pg');

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
};

const dbName = 'candoo';

console.log('🚀 Starting database setup...\n');
console.log('📋 Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   User: ${config.user}`);
console.log(`   Database: ${dbName}\n`);

async function setupDatabase() {
  let client = null;

  try {
    // Step 1: Connect to PostgreSQL (default database)
    console.log('📡 Step 1: Connecting to PostgreSQL...');
    client = new Client({
      ...config,
      database: 'postgres' // Connect to default database first
    });
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Step 2: Create database if not exists
    console.log(`📦 Step 2: Creating database '${dbName}'...`);
    try {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully\n`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Database '${dbName}' already exists\n`);
      } else {
        throw error;
      }
    }

    // Step 3: Disconnect from postgres and connect to candoo
    await client.end();
    console.log('🔄 Step 3: Connecting to candoo database...');
    
    client = new Client({
      ...config,
      database: dbName
    });
    
    await client.connect();
    console.log('✅ Connected to candoo database\n');

    // Step 4: Create menus table
    console.log('📊 Step 4: Creating menus table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS menus (
        id SERIAL PRIMARY KEY,
        article_id VARCHAR(500) NOT NULL,
        vendor_id VARCHAR(1000) NOT NULL,
        vendor_name VARCHAR(500) NOT NULL,
        "group" VARCHAR(500),
        price NUMERIC(12, 2),
        original_price NUMERIC(12, 2),
        discount VARCHAR(50),
        item_count INTEGER DEFAULT 1,
        description TEXT,
        image_url TEXT,
        has_discount BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_product_vendor UNIQUE(article_id, vendor_id, "group")
      )
    `;
    
    await client.query(createTableQuery);
    console.log('✅ Table menus created successfully\n');

    // Step 5: Create indexes
    console.log('🔍 Step 5: Creating indexes...');
    
    const indexes = [
      { name: 'idx_vendor_id', column: 'vendor_id' },
      { name: 'idx_vendor_name', column: 'vendor_name' },
      { name: 'idx_group', column: '"group"' },
      { name: 'idx_created_at', column: 'created_at' }
    ];

    for (const index of indexes) {
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS ${index.name} ON menus(${index.column})`);
        console.log(`   ✅ Index ${index.name} created`);
      } catch (error) {
        console.log(`   ℹ️  Index ${index.name} already exists`);
      }
    }
    console.log('✅ All indexes created\n');

    // Step 6: Create update trigger function
    console.log('⚙️  Step 6: Creating update trigger...');
    
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    await client.query(createFunctionQuery);
    console.log('   ✅ Trigger function created');

    const createTriggerQuery = `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_trigger 
              WHERE tgname = 'update_menus_updated_at'
          ) THEN
              CREATE TRIGGER update_menus_updated_at
                  BEFORE UPDATE ON menus
                  FOR EACH ROW
                  EXECUTE FUNCTION update_updated_at_column();
          END IF;
      END $$
    `;
    
    await client.query(createTriggerQuery);
    console.log('   ✅ Trigger created\n');

    // Step 7: Test the setup
    console.log('🧪 Step 7: Testing database...');
    
    // Test 1: Insert a test record
    const testInsert = `
      INSERT INTO menus (
        article_id, vendor_id, vendor_name, "group", 
        price, original_price, discount, has_discount
      )
      VALUES (
        'Test Product', 'https://test.com', 'Test Restaurant', 'Test Category',
        100000, 120000, '17%', true
      )
      ON CONFLICT (article_id, vendor_id, "group")
      DO UPDATE SET price = EXCLUDED.price
      RETURNING id
    `;
    
    const insertResult = await client.query(testInsert);
    console.log(`   ✅ Test insert successful (ID: ${insertResult.rows[0].id})`);

    // Test 2: Query the record
    const testQuery = `SELECT * FROM menus WHERE article_id = 'Test Product'`;
    const queryResult = await client.query(testQuery);
    console.log(`   ✅ Test query successful (Found ${queryResult.rows.length} row)`);

    // Test 3: Delete test record
    const testDelete = `DELETE FROM menus WHERE article_id = 'Test Product'`;
    await client.query(testDelete);
    console.log('   ✅ Test cleanup successful\n');

    // Step 8: Get statistics
    console.log('📊 Step 8: Database statistics:');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT vendor_id) as total_vendors,
        COUNT(DISTINCT "group") as total_categories
      FROM menus
    `;
    
    const stats = await client.query(statsQuery);
    console.log(`   Total items: ${stats.rows[0].total_items}`);
    console.log(`   Total vendors: ${stats.rows[0].total_vendors}`);
    console.log(`   Total categories: ${stats.rows[0].total_categories}\n`);

    // Success!
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Database Information:');
    console.log(`  📦 Database: ${dbName}`);
    console.log(`  📊 Table: menus`);
    console.log(`  🔐 Host: ${config.host}:${config.port}`);
    console.log(`  👤 User: ${config.user}`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Start your Next.js app: npm run dev');
    console.log('  2. Open http://localhost:3000');
    console.log('  3. Search for restaurants and save menus!');
    console.log('');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:\n');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 SOLUTION:');
      console.error('   PostgreSQL is not running. Please:');
      console.error('   1. Start PostgreSQL service');
      console.error('   2. Check if port 5432 is correct');
      console.error('   3. Verify credentials (user: postgres, password: 1234)');
    } else if (error.code === '28P01') {
      console.error('\n💡 SOLUTION:');
      console.error('   Authentication failed. Please:');
      console.error('   1. Check your password (default: 1234)');
      console.error('   2. Update password in script or .env.local');
    } else if (error.code === '3D000') {
      console.error('\n💡 SOLUTION:');
      console.error('   Database does not exist. This script will create it.');
    }
    
    console.error('\nFull error details:');
    console.error(error);
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
setupDatabase();

