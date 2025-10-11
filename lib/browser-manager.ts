import { SophisticatedSnappFoodAutomation } from './sophisticated-automation';

class BrowserManager {
  private static instance: BrowserManager;
  private automation: SophisticatedSnappFoodAutomation | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async getAutomation(): Promise<SophisticatedSnappFoodAutomation> {
    if (!this.automation) {
      console.log('🔄 Creating new automation instance...');
      this.automation = new SophisticatedSnappFoodAutomation();
      await this.automation.initialize({
        useSurvey: false,
        surveyUrl: 'https://snappfood.ir/',
        maxRetries: 3,
        timeout: 30000,
        waitForResults: 5000
      });
      this.isInitialized = true;
      console.log('✅ New automation instance created and initialized');
    } else {
      // Check if browser is actually open and working
      const isBrowserOpen = this.automation.isBrowserOpen();
      console.log('🔍 Browser status check:', {
        browser: !!this.automation.browser,
        page: !!this.automation.page,
        pageClosed: this.automation.page?.isClosed(),
        isBrowserOpen
      });
      
      if (!isBrowserOpen) {
        console.log('🔄 Browser closed, reinitializing automation...');
        try {
          await this.automation.initialize({
            useSurvey: false,
            surveyUrl: 'https://snappfood.ir/',
            maxRetries: 3,
            timeout: 30000,
            waitForResults: 5000
          });
          console.log('✅ Automation reinitialized');
        } catch (error) {
          console.log('⚠️ Reinitialization failed, creating new instance...');
          // If reinitialization fails, create a completely new instance
          await this.automation.close();
          this.automation = new SophisticatedSnappFoodAutomation();
          await this.automation.initialize({
            useSurvey: false,
            surveyUrl: 'https://snappfood.ir/',
            maxRetries: 3,
            timeout: 30000,
            waitForResults: 5000
          });
          console.log('✅ New automation instance created after reinitialization failure');
        }
      } else {
        console.log('✅ Reusing existing automation instance - browser already open');
      }
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
