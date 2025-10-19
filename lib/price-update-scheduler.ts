/**
 * Price Update Scheduler
 * 
 * Handles periodic price updates for all vendors in the database
 * Uses cron jobs to schedule daily updates at specific times
 */

import cron from 'node-cron';
import { query, testConnection, MenuItem } from './database';
import BrowserManager from './browser-manager';

export interface PriceUpdateConfig {
  schedule: string; // Cron expression (e.g., '0 6 * * *' for 6 AM daily)
  enabled: boolean;
  maxVendorsPerRun: number;
  delayBetweenVendors: number; // milliseconds
  retryAttempts: number;
  timeout: number; // milliseconds
}

export interface VendorSpecificConfig {
  vendorIds?: string[]; // Specific vendors to update, undefined means all
}

export interface PriceUpdateResult {
  vendorId: string;
  vendorName: string;
  success: boolean;
  itemsUpdated: number;
  error?: string;
  duration: number; // milliseconds
  timestamp: string;
}

export interface PriceUpdateSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalVendors: number;
  successfulVendors: number;
  failedVendors: number;
  totalItemsUpdated: number;
  results: PriceUpdateResult[];
  status: 'running' | 'completed' | 'failed';
  currentVendor?: string;
}

class PriceUpdateScheduler {
  private static instance: PriceUpdateScheduler;
  private cronJob: cron.ScheduledTask | null = null;
  private currentSession: PriceUpdateSession | null = null;
  private config: PriceUpdateConfig;
  private isRunning: boolean = false;

  constructor() {
    // Default configuration
    this.config = {
      schedule: '0 6 * * *', // 6 AM daily
      enabled: true,
      maxVendorsPerRun: 50, // Limit vendors per run to avoid overwhelming the system
      delayBetweenVendors: 5000, // 5 seconds between vendors
      retryAttempts: 3,
      timeout: 60000 // 1 minute timeout per vendor
    };
  }

  static getInstance(): PriceUpdateScheduler {
    if (!PriceUpdateScheduler.instance) {
      PriceUpdateScheduler.instance = new PriceUpdateScheduler();
    }
    return PriceUpdateScheduler.instance;
  }

  /**
   * Start the scheduled price updates
   */
  startScheduler(): void {
    if (this.cronJob) {
      console.log('⚠️ Price update scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('⚠️ Price update scheduler is disabled');
      return;
    }

    console.log(`🕐 Starting price update scheduler with schedule: ${this.config.schedule}`);
    
    this.cronJob = cron.schedule(this.config.schedule, async () => {
      console.log('⏰ Scheduled price update triggered');
      await this.runPriceUpdate();
    }, {
      scheduled: true,
      timezone: 'Asia/Tehran' // Iran timezone
    });

    console.log('✅ Price update scheduler started successfully');
  }

  /**
   * Stop the scheduled price updates
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('✅ Price update scheduler stopped');
    }
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<PriceUpdateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📝 Price update scheduler configuration updated:', this.config);
    
    // Restart scheduler if it's running
    if (this.cronJob) {
      this.stopScheduler();
      this.startScheduler();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PriceUpdateConfig {
    return { ...this.config };
  }

  /**
   * Get current session status
   */
  getCurrentSession(): PriceUpdateSession | null {
    return this.currentSession;
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.cronJob !== null;
  }

  /**
   * Check if price update is currently running
   */
  isPriceUpdateRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Run price update for all vendors or specific vendors (manual trigger)
   */
  async runPriceUpdate(vendorIds?: string[]): Promise<PriceUpdateSession> {
    if (this.isRunning) {
      throw new Error('Price update is already running');
    }

    this.isRunning = true;
    const sessionId = `price_update_${Date.now()}`;
    
    // Initialize session
    this.currentSession = {
      sessionId,
      startTime: new Date().toISOString(),
      totalVendors: 0,
      successfulVendors: 0,
      failedVendors: 0,
      totalItemsUpdated: 0,
      results: [],
      status: 'running'
    };

    console.log(`🚀 Starting price update session: ${sessionId}`);

    try {
      // Test database connection
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Get vendors to update (all or specific)
      const vendors = await this.getVendorsToUpdate(vendorIds);
      this.currentSession.totalVendors = vendors.length;

      console.log(`📊 Found ${vendors.length} vendors to update`);

      // Process vendors in batches
      const browserManager = BrowserManager.getInstance();
      
      for (let i = 0; i < vendors.length && i < this.config.maxVendorsPerRun; i++) {
        const vendor = vendors[i];
        console.log(`🔄 Processing vendor ${i + 1}/${Math.min(vendors.length, this.config.maxVendorsPerRun)}: ${vendor.vendor_name}`);

        try {
          // Update current vendor in session
          this.currentSession.currentVendor = vendor.vendor_name;
          
          const result = await this.updateVendorPrices(vendor, browserManager);
          this.currentSession.results.push(result);
          
          if (result.success) {
            this.currentSession.successfulVendors++;
            this.currentSession.totalItemsUpdated += result.itemsUpdated;
          } else {
            this.currentSession.failedVendors++;
          }

          // Delay between vendors to avoid overwhelming the system
          if (i < vendors.length - 1) {
            await this.delay(this.config.delayBetweenVendors);
          }

        } catch (error) {
          console.error(`❌ Error processing vendor ${vendor.vendor_name}:`, error);
          
          const errorResult: PriceUpdateResult = {
            vendorId: vendor.vendor_id,
            vendorName: vendor.vendor_name,
            success: false,
            itemsUpdated: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: 0,
            timestamp: new Date().toISOString()
          };
          
          this.currentSession.results.push(errorResult);
          this.currentSession.failedVendors++;
        }
      }

      // Complete session
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.status = 'completed';

      console.log(`✅ Price update session completed: ${sessionId}`);
      console.log(`📊 Results: ${this.currentSession.successfulVendors} successful, ${this.currentSession.failedVendors} failed`);
      console.log(`📊 Total items updated: ${this.currentSession.totalItemsUpdated}`);

    } catch (error) {
      console.error('❌ Price update session failed:', error);
      
      if (this.currentSession) {
        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.status = 'failed';
      }
    } finally {
      this.isRunning = false;
    }

    return this.currentSession!;
  }

  /**
   * Get vendors that need price updates
   */
  private async getVendorsToUpdate(vendorIds?: string[]): Promise<Array<{vendor_id: string, vendor_name: string}>> {
    let queryText = `
      SELECT DISTINCT vendor_id, vendor_name
      FROM menus
      WHERE vendor_id IS NOT NULL AND vendor_id != ''
    `;
    
    const params: any[] = [];
    
    if (vendorIds && vendorIds.length > 0) {
      queryText += ` AND vendor_id = ANY($1)`;
      params.push(vendorIds);
    }
    
    queryText += ` ORDER BY vendor_name`;
    
    const result = await query(queryText, params.length > 0 ? params : []);
    return result.rows;
  }

  /**
   * Update prices for a specific vendor
   */
  private async updateVendorPrices(
    vendor: {vendor_id: string, vendor_name: string},
    browserManager: BrowserManager
  ): Promise<PriceUpdateResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      console.log(`🔍 Extracting menu for vendor: ${vendor.vendor_name}`);
      
      // Extract menu data using existing automation
      const menuData = await browserManager.extractVendorMenu(vendor.vendor_id);
      
      // Convert to database format
      const items: MenuItem[] = [];
      
      menuData.categories.forEach((category: any) => {
        category.items.forEach((item: any) => {
          // Skip unavailable products
          const isUnavailable = !item.pricing?.finalPrice && !item.pricing?.originalPrice && (
            (item.name && item.name.toLowerCase().includes('ناموجود')) ||
            (item.description && item.description.toLowerCase().includes('ناموجود'))
          );

          if (isUnavailable) {
            return;
          }

          items.push({
            article_id: item.name || 'Unknown Product',
            vendor_id: vendor.vendor_id,
            vendor_name: vendor.vendor_name,
            group: category.name,
            price: item.pricing?.finalPrice || null,
            original_price: item.pricing?.originalPrice || null,
            discount: item.pricing?.discount || null,
            item_count: 1,
            description: item.description || null,
            image_url: item.imageUrl || null,
            has_discount: item.pricing?.hasDiscount || false
          });
        });
      });

      // Save to database
      const { upsertMenuItems } = await import('./database');
      const insertedCount = await upsertMenuItems(items);

      const duration = Date.now() - startTime;

      console.log(`✅ Updated ${insertedCount} items for ${vendor.vendor_name} in ${duration}ms`);

      return {
        vendorId: vendor.vendor_id,
        vendorName: vendor.vendor_name,
        success: true,
        itemsUpdated: insertedCount,
        duration,
        timestamp
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Failed to update vendor ${vendor.vendor_name}:`, errorMessage);

      return {
        vendorId: vendor.vendor_id,
        vendorName: vendor.vendor_name,
        success: false,
        itemsUpdated: 0,
        error: errorMessage,
        duration,
        timestamp
      };
    }
  }

  /**
   * Get price update statistics
   */
  async getPriceUpdateStats(): Promise<{
    totalVendors: number;
    totalItems: number;
    lastUpdateTime: string | null;
    averagePrice: number | null;
    discountedItems: number;
  }> {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT vendor_id) as total_vendors,
          COUNT(*) as total_items,
          MAX(updated_at) as last_update_time,
          AVG(price) as average_price,
          COUNT(CASE WHEN has_discount THEN 1 END) as discounted_items
        FROM menus
        WHERE price IS NOT NULL AND price > 0
      `;
      
      const result = await query(statsQuery);
      const stats = result.rows[0];
      
      return {
        totalVendors: parseInt(stats.total_vendors) || 0,
        totalItems: parseInt(stats.total_items) || 0,
        lastUpdateTime: stats.last_update_time || null,
        averagePrice: parseFloat(stats.average_price) || null,
        discountedItems: parseInt(stats.discounted_items) || 0
      };
    } catch (error) {
      console.error('❌ Error getting price update stats:', error);
      throw error;
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PriceUpdateScheduler;
