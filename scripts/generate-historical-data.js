const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'candoo',
  password: '1234',
  port: 5432,
});

// Helper function to get a random element from array
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper function to format date for PostgreSQL
const formatDate = (date) => date.toISOString();

// Generate realistic price variation based on item price
// Prices increase by 10% from 60 days ago to today
const generatePriceVariation = (basePrice, daysAgo, totalDays) => {
  // basePrice is today's price
  // We need to calculate what the price was daysAgo
  
  // 10% total increase over the period
  // Progress from past to present (0 = 60 days ago, 1 = today)
  const progress = (totalDays - daysAgo) / totalDays;
  
  // Price 60 days ago was ~10% less than today
  // historical_price = today_price / 1.10 at day 0
  // historical_price = today_price at day 60
  const growthFactor = 1 + (0.10 * progress); // 1.0 at start, 1.10 at end
  
  // Calculate the base price 60 days ago
  const basePriceAtStart = basePrice / 1.10;
  
  // Calculate price at this point in time
  const priceAtThisDay = basePriceAtStart * growthFactor;
  
  // Add discrete jumps (not smooth) - simulate real price changes
  // Prices don't change every day, they jump occasionally
  const jumpVariation = (Math.random() - 0.5) * (basePrice * 0.02); // ±2% random variation
  
  const historicalPrice = priceAtThisDay + jumpVariation;
  
  // Ensure price is positive and round to nearest 1000
  return Math.max(1000, Math.round(historicalPrice / 1000) * 1000);
};

// Generate discount for some items (30% of items have discount)
const generateDiscount = () => {
  const random = Math.random();
  if (random < 0.70) {
    // 70% chance: no discount
    return null;
  } else if (random < 0.80) {
    // 10% chance: 5% discount
    return '5%';
  } else if (random < 0.90) {
    // 10% chance: 10% discount
    return '10%';
  } else {
    // 10% chance: 15% discount
    return '15%';
  }
};

// Apply discount to price
const applyDiscount = (price, discount) => {
  if (!discount) return { original: null, final: price, hasDiscount: false };
  
  const percentage = parseInt(discount);
  const finalPrice = Math.round(price * (1 - percentage / 100) / 1000) * 1000;
  
  return {
    original: price,
    final: finalPrice,
    hasDiscount: true
  };
};

async function generateHistoricalData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Fetching current data from database...');
    
    // Get all current items (most recent entry for each article_id + vendor_id combination)
    const currentDataQuery = `
      SELECT DISTINCT ON (article_id, vendor_id)
        article_id,
        vendor_id,
        vendor_name,
        "group",
        price,
        discount,
        image_url,
        description,
        original_price
      FROM menus
      ORDER BY article_id, vendor_id, created_at DESC
    `;
    
    const result = await client.query(currentDataQuery);
    const currentItems = result.rows;
    
    console.log(`📊 Found ${currentItems.length} unique items`);
    
    if (currentItems.length === 0) {
      console.log('⚠️  No data found. Please add some restaurants first.');
      return;
    }
    
    // Generate data for past 60 days (2 months)
    const totalDays = 60;
    const today = new Date();
    
    console.log('🔄 Generating historical data for past 60 days...');
    
    let insertCount = 0;
    const batchSize = 100;
    let batch = [];
    
    // For each item, generate historical entries
    for (const item of currentItems) {
      // Current price (today's price)
      const todayPrice = item.price || 100000; // Fallback if null
      
      // Generate entries for random days in the past
      // Not every day, but ~3 times per week for realism
      const daysToGenerate = [];
      for (let day = 1; day <= totalDays; day++) {
        // 40% chance to have an entry for this day
        if (Math.random() < 0.4) {
          daysToGenerate.push(day);
        }
      }
      
      // Ensure at least a few entries
      if (daysToGenerate.length < 5) {
        for (let i = 0; i < 5; i++) {
          const randomDay = Math.floor(Math.random() * totalDays) + 1;
          if (!daysToGenerate.includes(randomDay)) {
            daysToGenerate.push(randomDay);
          }
        }
      }
      
      for (const daysAgo of daysToGenerate) {
        const historicalDate = addDays(today, -daysAgo);
        
        // Generate historical price (lower than today)
        const historicalPrice = generatePriceVariation(todayPrice, daysAgo, totalDays);
        
        // Randomly add discount
        const discount = generateDiscount();
        const pricing = applyDiscount(historicalPrice, discount);
        
        batch.push({
          article_id: item.article_id,
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name,
          group: item.group,
          price: pricing.final,
          original_price: pricing.original,
          discount: discount,
          image_url: item.image_url,
          description: item.description,
          created_at: formatDate(historicalDate)
        });
        
        // Insert in batches
        if (batch.length >= batchSize) {
          await insertBatch(client, batch);
          insertCount += batch.length;
          console.log(`  ✅ Inserted ${insertCount} entries...`);
          batch = [];
        }
      }
    }
    
    // Insert remaining batch
    if (batch.length > 0) {
      await insertBatch(client, batch);
      insertCount += batch.length;
    }
    
    console.log(`\n✅ Successfully generated ${insertCount} historical entries!`);
    console.log(`📅 Date range: ${addDays(today, -totalDays).toLocaleDateString()} to ${today.toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Error generating historical data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function insertBatch(client, batch) {
  const values = [];
  const placeholders = [];
  
  batch.forEach((item, index) => {
    const offset = index * 9;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
    );
    values.push(
      item.article_id,
      item.vendor_id,
      item.vendor_name,
      item.group,
      item.price,
      item.discount,
      item.image_url,
      item.description,
      item.created_at
    );
  });
  
  const query = `
    INSERT INTO menus (
      article_id, vendor_id, vendor_name, "group", price, discount, image_url, description, created_at
    ) VALUES ${placeholders.join(', ')}
  `;
  
  await client.query(query, values);
}

// Run the script
console.log('🚀 Starting historical data generation...\n');
generateHistoricalData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

