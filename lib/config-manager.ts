/**
 * Configuration Management for Price Updates
 * 
 * This module handles reading and writing configuration values
 * including active vendors for auto-update
 */

import fs from 'fs';
import path from 'path';

export interface VendorConfig {
  vendor_id: string;
  vendor_name: string;
  auto_update_enabled: boolean;
  last_update: string | null;
  update_frequency: 'daily' | 'weekly' | 'monthly';
  priority: 'high' | 'medium' | 'low';
}

export interface PriceUpdateConfig {
  global_enabled: boolean;
  schedule: {
    days: string[];
    hour: number;
    minute: number;
  };
  batch_settings: {
    max_vendors_per_run: number;
    delay_between_vendors: number;
    retry_attempts: number;
    timeout: number;
  };
  vendor_settings: {
    active_vendors: string[]; // Vendor IDs that have auto-update enabled
    inactive_vendors: string[]; // Vendor IDs that have auto-update disabled
    auto_update_enabled_count: number; // Count of active vendors
    total_vendors_count: number; // Total vendors in system
  };
  last_config_update: string;
}

class ConfigManager {
  private static instance: ConfigManager;
  private configPath: string;
  private vendorConfigPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'price-update-config.json');
    this.vendorConfigPath = path.join(process.cwd(), 'config', 'vendor-config.json');
    this.ensureConfigDirectory();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private ensureConfigDirectory(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * Load price update configuration
   */
  async loadConfig(): Promise<PriceUpdateConfig> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(data);
        
        // Migrate old config structure to new structure
        if (config.active_vendors && !config.vendor_settings) {
          console.log('🔄 Migrating config to new vendor_settings structure...');
          config.vendor_settings = {
            active_vendors: config.active_vendors,
            inactive_vendors: [],
            auto_update_enabled_count: config.active_vendors.length,
            total_vendors_count: config.active_vendors.length
          };
          delete config.active_vendors;
          
          // Save migrated config
          await this.saveConfig(config);
        }
        
        return config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Return default configuration
    return {
      global_enabled: false,
      schedule: {
        days: [],
        hour: 6,
        minute: 0
      },
      batch_settings: {
        max_vendors_per_run: 50,
        delay_between_vendors: 5000,
        retry_attempts: 3,
        timeout: 60000
      },
      vendor_settings: {
        active_vendors: [],
        inactive_vendors: [],
        auto_update_enabled_count: 0,
        total_vendors_count: 0
      },
      last_config_update: new Date().toISOString()
    };
  }

  /**
   * Save price update configuration
   */
  async saveConfig(config: PriceUpdateConfig): Promise<void> {
    try {
      config.last_config_update = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log('✅ Configuration saved successfully');
    } catch (error) {
      console.error('❌ Error saving config:', error);
      throw error;
    }
  }

  /**
   * Load vendor configurations
   */
  async loadVendorConfigs(): Promise<VendorConfig[]> {
    try {
      if (fs.existsSync(this.vendorConfigPath)) {
        const data = fs.readFileSync(this.vendorConfigPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading vendor configs:', error);
    }

    return [];
  }

  /**
   * Save vendor configurations
   */
  async saveVendorConfigs(vendorConfigs: VendorConfig[]): Promise<void> {
    try {
      fs.writeFileSync(this.vendorConfigPath, JSON.stringify(vendorConfigs, null, 2));
      console.log('✅ Vendor configurations saved successfully');
    } catch (error) {
      console.error('❌ Error saving vendor configs:', error);
      throw error;
    }
  }

  /**
   * Update vendor auto-update status
   */
  async updateVendorAutoUpdate(vendorId: string, enabled: boolean): Promise<void> {
    try {
      const vendorConfigs = await this.loadVendorConfigs();
      const config = await this.loadConfig();
      
      let vendorConfig = vendorConfigs.find(v => v.vendor_id === vendorId);
      
      if (!vendorConfig) {
        // Create new vendor config
        vendorConfig = {
          vendor_id: vendorId,
          vendor_name: '', // Will be updated when we have the name
          auto_update_enabled: enabled,
          last_update: null,
          update_frequency: 'daily',
          priority: 'medium'
        };
        vendorConfigs.push(vendorConfig);
      } else {
        vendorConfig.auto_update_enabled = enabled;
      }

      // Update vendor settings
      if (!config.vendor_settings) {
        config.vendor_settings = {
          active_vendors: [],
          inactive_vendors: [],
          auto_update_enabled_count: 0,
          total_vendors_count: 0
        };
      }
      
      if (enabled && !config.vendor_settings.active_vendors.includes(vendorId)) {
        config.vendor_settings.active_vendors.push(vendorId);
        config.vendor_settings.inactive_vendors = config.vendor_settings.inactive_vendors.filter(id => id !== vendorId);
      } else if (!enabled) {
        config.vendor_settings.active_vendors = config.vendor_settings.active_vendors.filter(id => id !== vendorId);
        if (!config.vendor_settings.inactive_vendors.includes(vendorId)) {
          config.vendor_settings.inactive_vendors.push(vendorId);
        }
      }
      
      config.vendor_settings.auto_update_enabled_count = config.vendor_settings.active_vendors.length;

      await this.saveVendorConfigs(vendorConfigs);
      await this.saveConfig(config);
      
      console.log(`✅ Vendor ${vendorId} auto-update ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error updating vendor auto-update:', error);
      throw error;
    }
  }

  /**
   * Get active vendors for auto-update
   */
  async getActiveVendors(): Promise<string[]> {
    const config = await this.loadConfig();
    return config.vendor_settings?.active_vendors || [];
  }

  /**
   * Update vendor name
   */
  async updateVendorName(vendorId: string, vendorName: string): Promise<void> {
    try {
      const vendorConfigs = await this.loadVendorConfigs();
      const vendorConfig = vendorConfigs.find(v => v.vendor_id === vendorId);
      
      if (vendorConfig) {
        vendorConfig.vendor_name = vendorName;
        await this.saveVendorConfigs(vendorConfigs);
      }
    } catch (error) {
      console.error('❌ Error updating vendor name:', error);
    }
  }

  /**
   * Get vendor configuration
   */
  async getVendorConfig(vendorId: string): Promise<VendorConfig | null> {
    const vendorConfigs = await this.loadVendorConfigs();
    return vendorConfigs.find(v => v.vendor_id === vendorId) || null;
  }

  /**
   * Update vendor last update time
   */
  async updateVendorLastUpdate(vendorId: string): Promise<void> {
    try {
      const vendorConfigs = await this.loadVendorConfigs();
      const vendorConfig = vendorConfigs.find(v => v.vendor_id === vendorId);
      
      if (vendorConfig) {
        vendorConfig.last_update = new Date().toISOString();
        await this.saveVendorConfigs(vendorConfigs);
      }
    } catch (error) {
      console.error('❌ Error updating vendor last update:', error);
    }
  }
}

export default ConfigManager;
