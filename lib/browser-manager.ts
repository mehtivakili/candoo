import { SophisticatedSnappFoodAutomation } from './sophisticated-automation';

// Use Node.js global object to persist across all API calls
declare global {
  var __browserManager: BrowserManager | undefined;
}

class BrowserManager {
  private automation: SophisticatedSnappFoodAutomation | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    console.log('🔧 BrowserManager constructor called');
  }

  public static getInstance(): BrowserManager {
    console.log('🔧 BrowserManager.getInstance() called');
    
    if (!global.__browserManager) {
      console.log('🔧 Creating NEW BrowserManager instance');
      global.__browserManager = new BrowserManager();
    } else {
      console.log('🔧 REUSING existing BrowserManager instance');
    }
    
    return global.__browserManager;
  }

  public async getAutomation(): Promise<SophisticatedSnappFoodAutomation> {
    console.log('🔍 BrowserManager.getAutomation() called');
    console.log('🔍 this.automation exists:', !!this.automation);
    
    if (!this.automation) {
      console.log('🔄 Creating SINGLE automation instance...');
      this.automation = new SophisticatedSnappFoodAutomation();
      await this.automation.initialize({
        useSurvey: false,
        surveyUrl: 'https://snappfood.ir/',
        maxRetries: 3,
        timeout: 30000,
        waitForResults: 5000
      });
      this.isInitialized = true;
      console.log('✅ SINGLE automation instance created - will NEVER create another');
    } else {
      console.log('✅ REUSING existing automation instance - NO NEW BROWSER');
    }
    
    return this.automation;
  }

  public async search(searchTerm: string, config: any = {}) {
    const automation = await this.getAutomation();
    return await automation.searchOnSnappFood(searchTerm, config);
  }

  public async searchProducts(searchTerm: string, config: any = {}) {
    const automation = await this.getAutomation();
    return await automation.searchProducts(searchTerm, config);
  }

  public async searchVendors(searchTerm: string, config: any = {}) {
    const automation = await this.getAutomation();
    return await automation.searchVendors(searchTerm, config);
  }

  public async extractVendorMenu(vendorUrl: string) {
    // Always get automation - it will handle browser state internally
    const automation = await this.getAutomation();
    return await automation.extractVendorMenu(vendorUrl);
  }

  public async takeScreenshot(): Promise<string> {
    const automation = await this.getAutomation();
    return await automation.takeScreenshot();
  }

  public async keepAlive(): Promise<void> {
    if (this.automation) {
      await this.automation.keepBrowserAlive();
    }
  }

  public async close(): Promise<void> {
    if (this.automation) {
      await this.automation.close();
      this.automation = null;
      this.isInitialized = false;
      console.log('✅ Browser manager closed');
    }
  }

  public async forceClose(): Promise<void> {
    console.log('🔄 Force closing all browser instances...');
    if (this.automation) {
      try {
        await this.automation.close();
      } catch (error) {
        console.log('⚠️ Error closing automation:', error);
      }
      this.automation = null;
      this.isInitialized = false;
    }
    console.log('✅ All browser instances force closed');
  }

  public async forceCloseIfNeeded(): Promise<void> {
    // Only force close if there are issues with the browser
    if (this.automation && !this.automation.isBrowserOpen()) {
      console.log('🔄 Browser appears to be closed, cleaning up...');
      await this.forceClose();
    } else {
      console.log('✅ Browser is healthy, no need to force close');
    }
  }

  public async keepBrowserAlive(): Promise<void> {
    if (this.automation && this.automation.isBrowserOpen()) {
      console.log('🔄 Keeping browser alive...');
      // Just check if browser is still responsive
      try {
        await this.automation.keepBrowserAlive();
        console.log('✅ Browser is responsive and alive');
      } catch (error) {
        console.log('⚠️ Browser not responsive, will reinitialize on next use');
      }
    }
  }

  public isBrowserOpen(): boolean {
    return this.automation?.isBrowserOpen() || false;
  }

  public getSessionId(): string {
    return this.automation?.getSessionId() || 'no-session';
  }

  public getSurveyData() {
    return this.automation?.getSurveyData() || null;
  }
}

export default BrowserManager;
