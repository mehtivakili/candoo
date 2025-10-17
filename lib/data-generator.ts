import { query } from './database';

export interface DataGenerationOptions {
  vendorIds: string[];
  days: number;
  priceIncreasePercent: number;
  discountPercentage: number;
  noiseLevel: number;
}

export interface VendorInfo {
  vendor_id: string;
  vendor_name: string;
  item_count: number;
  days_with_data: number;
  avg_price: number;
  categories: string[];
}

export class DataGenerator {
  
  /**
   * Get all vendors with their current data statistics
   */
  static async getVendorStats(): Promise<VendorInfo[]> {
    const result = await query(`
      SELECT 
        vendor_id,
        vendor_name,
        COUNT(*) as item_count,
        COUNT(DISTINCT DATE(created_at)) as days_with_data,
        AVG(price) as avg_price,
        ARRAY_AGG(DISTINCT "group") as categories
      FROM menus 
      GROUP BY vendor_id, vendor_name
      ORDER BY vendor_name
    `);
    
    return result.rows.map(row => ({
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name,
      item_count: parseInt(row.item_count),
      days_with_data: parseInt(row.days_with_data),
      avg_price: parseFloat(row.avg_price),
      categories: row.categories.filter((cat: any) => cat !== null)
    }));
  }

  /**
   * Generate historical data for selected vendors
   */
  static async generateHistoricalData(options: DataGenerationOptions): Promise<{ success: boolean; message: string; itemsGenerated: number }> {
    try {
      console.log('🔄 Starting historical data generation...', options);
      
      // If days is 0, don't generate any historical data
      if (options.days === 0) {
        return {
          success: true,
          message: 'تعداد روزها 0 است - هیچ داده تاریخی تولید نشد',
          itemsGenerated: 0
        };
      }
      
      // Get current items for selected vendors
      const currentItems = await query(`
        SELECT DISTINCT
          article_id,
          vendor_id,
          vendor_name,
          "group",
          price,
          original_price,
          discount,
          item_count
        FROM menus 
        WHERE vendor_id = ANY($1)
        ORDER BY vendor_id, article_id
      `, [options.vendorIds]);

      if (currentItems.rows.length === 0) {
        return { success: false, message: 'No items found for selected vendors', itemsGenerated: 0 };
      }

      const itemsToGenerate = currentItems.rows;
      const totalDays = options.days;
      const priceIncreasePercent = options.priceIncreasePercent / 100;
      const discountPercentage = options.discountPercentage / 100;
      const noiseLevel = options.noiseLevel / 100;

      let totalGenerated = 0;
      const batchSize = 100;
      
      // Generate data for each item
      for (const item of itemsToGenerate) {
        const historicalData = [];
        const basePrice = parseFloat(item.price);
        const baseOriginalPrice = parseFloat(item.original_price) || basePrice;
        const baseDiscount = item.discount;
        
        // Generate data for each day going backwards
        for (let dayOffset = totalDays; dayOffset >= 0; dayOffset--) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - dayOffset);
          
          // Calculate price progression (past prices are lower)
          const progressRatio = dayOffset / totalDays; // 1 = past, 0 = present
          const priceMultiplier = 1 - (priceIncreasePercent * progressRatio);
          
          // Add noise to make it realistic
          const noise = (Math.random() - 0.5) * noiseLevel;
          const finalMultiplier = Math.max(0.1, priceMultiplier + noise);
          
          const historicalPrice = Math.round(basePrice * finalMultiplier);
          const historicalOriginalPrice = Math.round(baseOriginalPrice * finalMultiplier);
          
          // Determine discount for this day
          let historicalDiscount = null;
          if (baseDiscount && Math.random() < discountPercentage) {
            // Sometimes apply discount, sometimes not
            const discountValues = ['5%', '10%', '15%', '20%'];
            historicalDiscount = discountValues[Math.floor(Math.random() * discountValues.length)];
          }
          
          historicalData.push({
            article_id: item.article_id,
            vendor_id: item.vendor_id,
            vendor_name: item.vendor_name,
            group: item.group,
            price: historicalPrice,
            original_price: historicalOriginalPrice,
            discount: historicalDiscount,
            item_count: item.item_count,
            created_at: targetDate.toISOString()
          });
        }
        
        // Insert in batches
        for (let i = 0; i < historicalData.length; i += batchSize) {
          const batch = historicalData.slice(i, i + batchSize);
          
          const values = batch.map((_, index) => {
            const item = batch[index];
            const offset = i + index;
            return `($${offset * 9 + 1}, $${offset * 9 + 2}, $${offset * 9 + 3}, $${offset * 9 + 4}, $${offset * 9 + 5}, $${offset * 9 + 6}, $${offset * 9 + 7}, $${offset * 9 + 8}, $${offset * 9 + 9})`;
          }).join(', ');
          
          const params = batch.flatMap(item => [
            item.article_id,
            item.vendor_id,
            item.vendor_name,
            item.group,
            item.price,
            item.original_price,
            item.discount,
            item.item_count,
            item.created_at
          ]);
          
          await query(`
            INSERT INTO menus (article_id, vendor_id, vendor_name, "group", price, original_price, discount, item_count, created_at)
            VALUES ${values}
          `, params);
          
          totalGenerated += batch.length;
        }
      }
      
      console.log(`✅ Generated ${totalGenerated} historical records`);
      
      return {
        success: true,
        message: `Successfully generated ${totalGenerated} historical records for ${options.vendorIds.length} vendors over ${totalDays} days`,
        itemsGenerated: totalGenerated
      };
      
    } catch (error) {
      console.error('❌ Error generating historical data:', error);
      return {
        success: false,
        message: `Error generating data: ${error}`,
        itemsGenerated: 0
      };
    }
  }

  /**
   * Clean all data from the menus table
   */
  static async cleanAllData(): Promise<{ success: boolean; message: string; itemsDeleted: number }> {
    try {
      console.log('🧹 Cleaning all data from menus table...');
      
      const result = await query('DELETE FROM menus');
      
      console.log(`✅ Deleted all records from menus table`);
      
      return {
        success: true,
        message: `Successfully deleted all records from menus table`,
        itemsDeleted: result.rowCount || 0
      };
      
    } catch (error) {
      console.error('❌ Error cleaning data:', error);
      return {
        success: false,
        message: `Error cleaning data: ${error}`,
        itemsDeleted: 0
      };
    }
  }

  /**
   * Clean timeline data, keeping only the latest record for each product
   */
  static async cleanTimelineData(): Promise<{ success: boolean; message: string; itemsDeleted: number }> {
    try {
      console.log('🧹 Cleaning timeline data, keeping only latest records...');
      
      // First, get the latest record for each product
      const latestRecords = await query(`
        SELECT DISTINCT ON (vendor_id, article_id)
          id
        FROM menus
        ORDER BY vendor_id, article_id, created_at DESC
      `);
      
      const keepIds = latestRecords.rows.map(row => row.id);
      
      if (keepIds.length === 0) {
        return { success: true, message: 'No data to clean', itemsDeleted: 0 };
      }
      
      // Delete all records except the latest ones
      const result = await query(`
        DELETE FROM menus 
        WHERE id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(', ')})
      `, keepIds);
      
      console.log(`✅ Cleaned timeline data, kept ${keepIds.length} latest records`);
      
      return {
        success: true,
        message: `Successfully cleaned timeline data. Kept ${keepIds.length} latest records, deleted ${result.rowCount || 0} historical records`,
        itemsDeleted: result.rowCount || 0
      };
      
    } catch (error) {
      console.error('❌ Error cleaning timeline data:', error);
      return {
        success: false,
        message: `Error cleaning timeline data: ${error}`,
        itemsDeleted: 0
      };
    }
  }
}
