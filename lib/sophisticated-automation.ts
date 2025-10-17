import puppeteer, { Browser, Page } from 'puppeteer';
import { DOMSurveyService, DOMSurveyResult, DOMElement } from './dom-survey-service';

export interface SearchResult {
  success: boolean;
  message: string;
  results?: any[];
  screenshot?: string;
  surveyData?: DOMSurveyResult;
  timestamp?: string;
}

export interface VendorResult {
  id: number;
  title: string;
  url: string;
  coverImageUrl?: string;
  logoImageUrl?: string;
  rating?: string;
  reviews?: string;
  cuisine?: string;
  deliveryFee?: string;
  discount?: string;
  couponText?: string;
}

export interface ProductItem {
  name: string;
  description: string;
  pricing: {
    originalPrice: number | null;
    finalPrice: number | null;
    discount: string | null;
    hasDiscount: boolean;
  };
  imageUrl: string | null;
}

export interface CategoryData {
  id: string;
  name: string;
  itemCount: number;
  items: ProductItem[];
}

export interface VendorMenuData {
  restaurant: {
    name: string;
    rating: string;
    ratingCount?: string;
    url: string;
    logo?: string | null;
    discount?: string;
    delivery?: {
      type: string;
      fee: string;
    };
    address?: string;
  };
  categories: CategoryData[];
  totalItems: number;
  scrapedAt: string;
}

export interface AutomationConfig {
  useSurvey: boolean;
  surveyUrl?: string;
  maxRetries: number;
  timeout: number;
  waitForResults: number;
}

export class SophisticatedSnappFoodAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private surveyService: DOMSurveyService;
  private sessionId: string;
  private surveyData: DOMSurveyResult | null = null;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.surveyService = new DOMSurveyService();
  }

  async initialize(config: AutomationConfig = {
    useSurvey: false,
    surveyUrl: 'https://snappfood.ir/',
    maxRetries: 3,
    timeout: 30000,
    waitForResults: 5000
  }): Promise<void> {
    try {
      console.log('🚀 Starting SnappFood Automation...');
      
      // Check if browser is already running
      if (this.isBrowserOpen()) {
        console.log('✅ Browser already running, reusing existing instance...');
        return;
      }
      
      // Only clean up if browser exists but is not working properly
      if (this.browser && !this.isBrowserOpen()) {
        console.log('🧹 Cleaning up non-functional browser instance...');
      await this.cleanupBrowser();
      }
      
      // Initialize browser with retry logic
      console.log('🌐 Starting browser...');
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Generate unique user data dir to avoid conflicts
          const timestamp = Date.now();
          const userDataDir = `./snapp-profile-${timestamp}`;
          
          this.browser = await puppeteer.launch({
            headless: false, // Show browser for user interaction
            userDataDir: userDataDir, // Use unique profile directory
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--window-size=1920,1080',
              '--start-maximized',
              '--disable-infobars',
              '--disable-extensions',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding'
            ],
            defaultViewport: {
              width: 1920,
              height: 1080
            }
          });

          this.page = await this.browser.newPage();
          
          // Set user agent
          await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          // Set extra headers
          await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8'
          });

          console.log('✅ SnappFood Automation initialized');
          return; // Success, exit retry loop
          
        } catch (error) {
          retryCount++;
          console.log(`⚠️ Browser launch attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying browser launch in 2 seconds... (${retryCount}/${maxRetries})`);
            await this.delay(2000);
            await this.cleanupBrowser(); // Clean up before retry
          } else {
            throw error; // Re-throw error if all retries failed
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize automation:', error);
      throw new Error(`Failed to initialize automation: ${error}`);
    }
  }

  async searchProducts(searchTerm: string, config: AutomationConfig = {
    useSurvey: true,
    surveyUrl: 'https://snappfood.ir/',
    maxRetries: 3,
    timeout: 30000,
    waitForResults: 5000
  }): Promise<SearchResult> {
    // Ensure browser and page are open before proceeding
    await this.ensureBrowserOpen();
    await this.ensurePageOpen();

    try {
      console.log(`🔍 Starting product search for "${searchTerm}"...`);
      
      // URL encode the search term for Persian text
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      const searchUrl = `https://snappfood.ir/products/?query=${encodedSearchTerm}`;
      
      console.log(`🌐 Navigating directly to products URL: ${searchUrl}`);
      
      // Navigate directly to the products search URL
      await this.page?.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.timeout
      });
      
      console.log('✅ Successfully navigated to products page');
      await this.delay(config.waitForResults);
      
      // Extract all products from the search results page
      const products = await this.extractAllProducts();
      
      // Take screenshot
      const screenshot = await this.page?.screenshot();
      console.log('📸 Screenshot captured');

      return {
        success: true,
        message: `Successfully searched for "${searchTerm}" products and extracted ${products.length} products`,
        results: products,
        screenshot: (screenshot as Buffer).toString('base64'),
        surveyData: this.surveyData || undefined,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error during product search:', error);
      
      let screenshot = null;
      try {
        screenshot = this.page ? await this.page.screenshot() : null;
      } catch (screenshotError) {
        console.log(`⚠️ Could not take screenshot: ${screenshotError}`);
      }
      
      return {
        success: false,
        message: `Product search failed: ${error}`,
        screenshot: screenshot ? (screenshot as Buffer).toString('base64') : undefined,
        surveyData: this.surveyData || undefined
      };
    }
  }

  async extractVendorMenu(vendorUrl: string): Promise<VendorMenuData> {
    // Just use existing browser - NO CHECKS, NO NEW BROWSER
    if (!this.browser || !this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log(`🔍 Extracting vendor menu from: ${vendorUrl}`);
      
      // Navigate to the vendor page using existing browser
      console.log('🌐 Navigating to vendor page using EXISTING browser...');
      await this.page.goto(vendorUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      console.log('✅ Page navigation completed');

      // Wait a bit for dynamic content to load
      await this.delay(3000);

      // Wait for main content to load
      console.log('⏳ Waiting for main content to load...');
      try {
        await this.page?.waitForSelector('h1.sc-hKgILt.kNFBOq', { timeout: 15000 });
        console.log('✅ Main content loaded');
      } catch (e) {
        console.log('⚠️ Main selector not found, trying alternative selectors...');
        
        // Try alternative selectors
        const alternativeSelectors = ['h1', 'section[data-categoryid]', '.ProductCard__Box-sc-1wfx2e0-0'];
        let found = false;
        
        for (const selector of alternativeSelectors) {
          try {
            await this.page?.waitForSelector(selector, { timeout: 5000 });
            console.log(`✅ Found alternative selector: ${selector}`);
            found = true;
            break;
          } catch (e2) {
            continue;
          }
        }
        
        if (!found) {
          console.log('⚠️ No selectors found, proceeding with extraction anyway...');
        }
        
        await this.delay(2000); // Wait a bit more
      }

      // Extract all data using DOM scraping
      console.log('📊 Starting data extraction...');
      const restaurantData = await this.extractMenuFromDOM();

      console.log('✅ Extraction completed successfully');
      return restaurantData;

    } catch (error) {
      console.error(`❌ Error extracting vendor menu from "${vendorUrl}":`, error);
      throw error;
    }
  }

  private async extractMenuFromDOM(): Promise<VendorMenuData> {
    if (!this.page) throw new Error('Page not available');
    
    console.log('📊 Extracting restaurant data from DOM...');
    
    const restaurantData = await this.page.evaluate(() => {
      // Professional selectors
      const RESTAURANT_SELECTORS = {
        // Main restaurant info
        name: 'h1.sc-hKgILt.kNFBOq',
        logo: '.VendorLogo__Logo-sc-9mwh1-0 img',
        
        // Rating section
        rating: {
          container: '.RateCommentBadge__RateBox-sc-olkjn5-0',
          value: '.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.jsaCNc',
          count: '.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.fYlAbO',
          star: '.RateCommentBadge__RateBox-sc-olkjn5-0 svg'
        },
        
        // Discount badge
        discountBadge: {
          container: '.DiscountBadge__DiscountBox-sc-1q3szf-0',
          value: '.DiscountBadge__DiscountBox-sc-1q3szf-0 .sc-hKgILt.ctKvuL'
        },
        
        // Delivery information
        delivery: {
          container: '.VendorStateBadgestyled__VendorStateBadgeStyled-sc-lbld2-0',
          type: '.VendorStateBadgestyled__VendorStateTitleAndDescriptionStyled-sc-lbld2-1 .sc-hKgILt.sFIZX',
          fee: '.VendorStateBadgestyled__VendorStateTitleAndDescriptionStyled-sc-lbld2-1 .sc-hKgILt.jsaCNc'
        },
        
        // Address
        address: {
          container: '.AddressCard__Layout-sc-17zx3wl-0',
          text: '.AddressCard__AddressString-sc-17zx3wl-1'
        }
      };
      
      // Helper function to clean Persian numbers and text
      const cleanText = (text: string | null | undefined): string => text?.trim() || '';
      
      // Helper function to extract numeric value from price string
      const extractPrice = (text: string | null | undefined): number | null => {
        if (!text) return null;
        
        // Convert Persian digits to English digits
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        let convertedText = text;
        persianDigits.forEach((persianDigit, index) => {
          convertedText = convertedText.replace(new RegExp(persianDigit, 'g'), index.toString());
        });
        
        // Remove all non-digit characters (including Persian/Arabic comma '،' and regular comma)
        const cleaned = convertedText.replace(/[^\d]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
      };

      // Extract restaurant name
      const restaurantNameElement = document.querySelector(RESTAURANT_SELECTORS.name);
      const restaurantName = cleanText(restaurantNameElement?.textContent);

      // Extract logo
      const logoElement = document.querySelector(RESTAURANT_SELECTORS.logo) as HTMLImageElement;
      const restaurantLogo = logoElement?.src || null;

      // Extract rating with professional selectors
      const ratingElement = document.querySelector(RESTAURANT_SELECTORS.rating.value);
      const rating = cleanText(ratingElement?.textContent);
      
      const ratingCountElement = document.querySelector(RESTAURANT_SELECTORS.rating.count);
      const ratingCount = cleanText(ratingCountElement?.textContent);

      // Extract discount badge
      const discountElement = document.querySelector(RESTAURANT_SELECTORS.discountBadge.value);
      const restaurantDiscount = cleanText(discountElement?.textContent);

      // Extract delivery information
      const deliveryTypeElement = document.querySelector(RESTAURANT_SELECTORS.delivery.type);
      const deliveryType = cleanText(deliveryTypeElement?.textContent);
      
      const deliveryFeeElement = document.querySelector(RESTAURANT_SELECTORS.delivery.fee);
      const deliveryFee = cleanText(deliveryFeeElement?.textContent);

      // Extract address
      const addressElement = document.querySelector(RESTAURANT_SELECTORS.address.text);
      const restaurantAddress = cleanText(addressElement?.textContent);

      // Extract categories and items
      const categories: any[] = [];
      const categorySections = document.querySelectorAll('section[data-categoryid]');

      categorySections.forEach((section) => {
        const categoryId = section.getAttribute('data-categoryid');
        
        // Skip coupon section (id: -99)
        if (categoryId === '-99') return;

        // Get category name
        const categoryNameElement = section.querySelector('p.sc-hKgILt.CategorySections__SectionHeading-sc-ls8sfa-0, p.sc-hKgILt.jsaCNc');
        const categoryName = cleanText(categoryNameElement?.textContent);

        if (!categoryName) return;

        // Get all items in this category
        const items: any[] = [];
        const itemCards = section.querySelectorAll('.ProductCard__Box-sc-1wfx2e0-0');

        itemCards.forEach((card) => {
          // Extract item name
          const nameElement = card.querySelector('h2.sc-hKgILt.esHHju');
          const name = cleanText(nameElement?.textContent);

          // Extract item description
          const descElement = card.querySelector('strong.sc-hKgILt.fYlAbO');
          const description = cleanText(descElement?.textContent);

          // Extract pricing information - PRECISE DOM-based extraction
          // Based on actual SnappFood DOM structure:
          // <div class="sc-dlfnbm fHWOCb">
          //   <span class="sc-hKgILt sc-lmoMRL jxforx cVMWeE">۵ <span><svg>...</span></span>
          //   <div class="sc-dlfnbm hmnfCP">
          //     <s class="sc-hKgILt fYlAbO">۷۷۵,۰۰۰</s>
          //     <span class="sc-hKgILt hxREoh"> ۷۳۶,۲۵۰ <span class="sc-hKgILt cnaQBH">تومان</span></span>
          //   </div>
          // </div>
          
          let originalPrice = null;
          let finalPrice = null;
          let discount = null;

          const footerElement = card.querySelector('.ProductCard__Footer-sc-1wfx2e0-1');
          
          if (footerElement) {
            // Step 1: Find the price container (div.sc-dlfnbm.fHWOCb or parent of hmnfCP)
            const priceContainerWithDiscount = footerElement.querySelector('.sc-dlfnbm.fHWOCb');
            const priceContainerDiv = footerElement.querySelector('.sc-dlfnbm.hmnfCP');
            
            // Step 2: Extract discount percentage from badge
            // Look for span with classes: sc-hKgILt sc-lmoMRL ... cVMWeE
            const discountBadge = footerElement.querySelector('span.sc-lmoMRL.cVMWeE');
            if (discountBadge) {
              // The first text node contains the Persian digit (e.g., "۵")
              for (const node of discountBadge.childNodes) {
                if (node.nodeType === 3) { // Text node
                  const text = cleanText(node.textContent);
                  // Match Persian or English digits
                  const match = text.match(/[۰-۹\d]+/);
                  if (match) {
                    // Convert Persian digits to English using extractPrice logic
                    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                    let discountNum = match[0];
                    persianDigits.forEach((persianDigit, index) => {
                      discountNum = discountNum.replace(new RegExp(persianDigit, 'g'), index.toString());
                    });
                    discount = discountNum;
                    break;
                  }
                }
              }
            }
            
            // Step 3: Extract original price from strikethrough <s> tag
            // <s class="sc-hKgILt fYlAbO">۷۷۵,۰۰۰</s>
            const strikethroughElement = priceContainerDiv?.querySelector('s.sc-hKgILt.fYlAbO');
            if (strikethroughElement) {
              originalPrice = extractPrice(strikethroughElement.textContent);
            }
            
            // Step 4: Extract final price from span
            // <span class="sc-hKgILt hxREoh"> ۷۳۶,۲۵۰ <span class="sc-hKgILt cnaQBH">تومان</span></span>
            const finalPriceSpan = priceContainerDiv?.querySelector('span.sc-hKgILt.hxREoh');
            if (finalPriceSpan) {
              // Get the first text node only (before the nested "تومان" span)
              for (const node of finalPriceSpan.childNodes) {
                if (node.nodeType === 3) { // Text node
                  const priceText = cleanText(node.textContent);
                  if (priceText) {
                    finalPrice = extractPrice(priceText);
                    break;
                  }
                }
              }
              
              // Fallback: if text node extraction failed
              if (!finalPrice) {
                const fullText = finalPriceSpan.textContent?.replace('تومان', '').trim();
                finalPrice = extractPrice(fullText);
              }
            }
            
            // Step 5: Fallback - pattern matching if selectors failed
            if (!finalPrice) {
              const footerText = footerElement.textContent || '';
              // Match Persian or English digits with commas
              const pricePattern = /[۰-۹\d,،]+/g;
              const matches = footerText.match(pricePattern) || [];
              const prices = matches.map(m => extractPrice(m)).filter(p => p !== null && p > 0);
              
              if (prices.length >= 2) {
                // Multiple prices: first is original, second is final
                originalPrice = prices[0];
                finalPrice = prices[1];
              } else if (prices.length === 1) {
                // Single price
                finalPrice = prices[0];
              }
            }
          }

          // Extract image URL
          const imgElement = card.querySelector('.ProductCard__ImgWrapper-sc-1wfx2e0-3 img');
          const imageUrl = imgElement?.getAttribute('src') || null;

          // Check if product is unavailable (ناموجود)
          const isUnavailable = !finalPrice && !originalPrice && (
            name.toLowerCase().includes('ناموجود') || 
            description.toLowerCase().includes('ناموجود') ||
            footerElement?.textContent?.toLowerCase().includes('ناموجود')
          );

          // Skip unavailable products
          if (isUnavailable) {
            console.log(`⏭️ Skipping unavailable product: ${name}`);
            return;
          }

          // Debug logging for first few items
          if (items.length < 3) {
            console.log(`\n✅ Item ${items.length + 1}: ${name}`);
            console.log(`   📝 Description: ${description || 'N/A'}`);
            console.log(`   💰 Final Price: ${finalPrice ? finalPrice.toLocaleString('fa-IR') : 'N/A'}`);
            console.log(`   🏷️ Original Price: ${originalPrice ? originalPrice.toLocaleString('fa-IR') : 'N/A'}`);
            console.log(`   🎁 Discount: ${discount ? discount + '%' : 'No discount'}`);
            console.log(`   🖼️ Image: ${imageUrl ? '✓' : '✗'}`);
          }

          items.push({
            name,
            description,
            pricing: {
              originalPrice: originalPrice || finalPrice,
              finalPrice,
              discount: discount ? `${discount}%` : null,
              hasDiscount: !!discount
            },
            imageUrl
          });
        });

        if (items.length > 0) {
          categories.push({
            id: categoryId,
            name: categoryName,
            itemCount: items.length,
            items
          });
        }
      });

      return {
        restaurant: {
          name: restaurantName,
          rating: rating,
          ratingCount: ratingCount,
          url: window.location.href,
          logo: restaurantLogo,
          discount: restaurantDiscount,
          delivery: deliveryType || deliveryFee ? {
            type: deliveryType,
            fee: deliveryFee
          } : undefined,
          address: restaurantAddress
        },
        categories,
        totalItems: categories.reduce((sum: number, cat: any) => sum + cat.itemCount, 0),
        scrapedAt: new Date().toISOString()
      };
    });

    console.log(`✅ Successfully extracted menu data: ${restaurantData.restaurant.name}`);
    console.log(`📊 Total categories: ${restaurantData.categories.length}, Total items: ${restaurantData.totalItems}`);
    
    return restaurantData;
  }

  async searchVendors(searchTerm: string, config: AutomationConfig = {
    useSurvey: true,
    surveyUrl: 'https://snappfood.ir/',
    maxRetries: 3,
    timeout: 30000,
    waitForResults: 5000
  }): Promise<VendorResult[]> {
    // Ensure browser and page are open before proceeding
    await this.ensureBrowserOpen();
    await this.ensurePageOpen();

    try {
      console.log(`🔍 Starting vendor search for "${searchTerm}"...`);
      
      // URL encode the search term for Persian text
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      const searchUrl = `https://snappfood.ir/search/?query=${encodedSearchTerm}`;
      
      console.log(`🌐 Navigating to search URL: ${searchUrl}`);
      
      // Navigate to the main search page first
      await this.page?.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.timeout
      });
      
      console.log('✅ Successfully navigated to search page');
      await this.delay(config.waitForResults);
      
      // Look for "مشاهده همه فروشندگان" link and click it
      console.log('🔍 Looking for "مشاهده همه فروشندگان" link...');
      const viewAllVendorsLink = await this.page?.evaluateHandle(() => {
        const link = document.querySelector('a[href*="/service/search-vendors/"]');
        if (link && link.textContent?.includes('مشاهده همه فروشندگان')) {
          return link;
        }
        return null;
      });

      if (viewAllVendorsLink) {
        console.log('✅ Found "مشاهده همه فروشندگان" link, clicking...');
        await (viewAllVendorsLink as any).click();
        
        // Wait for navigation with error handling
        try {
          await this.page?.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
          console.log('✅ Navigated to all vendors page');
        } catch (navError) {
          console.log('⚠️ Navigation timeout, continuing with current page...');
        }
        await this.delay(2000); // Wait for the new page to load
      } else {
        console.log('⚠️ "مشاهده همه فروشندگان" link not found, proceeding with current page results');
      }

      // Extract vendor data from the page
      const vendors = await this.extractAllVendors();
      
      console.log(`📊 Extracted ${vendors.length} vendors`);
      return vendors;
      
    } catch (error) {
      console.error(`❌ Error during vendor search for "${searchTerm}":`, error);
      throw error;
    }
  }


  async searchOnSnappFood(searchTerm: string, config: AutomationConfig = {
    useSurvey: true,
    surveyUrl: 'https://snappfood.ir/',
    maxRetries: 3,
    timeout: 30000,
    waitForResults: 5000
  }): Promise<SearchResult> {
    // Ensure browser and page are open before proceeding
    await this.ensureBrowserOpen();
    await this.ensurePageOpen();

    try {
      console.log(`🔍 Starting sophisticated search for "${searchTerm}"...`);
      
      // Check if we're already on SnappFood or need to navigate
      const currentUrl = this.page?.url() || '';
      console.log(`🌐 Current URL: ${currentUrl}`);
      
      if (!currentUrl.includes('snappfood.ir')) {
        console.log('🌐 Navigating to SnappFood...');
        await this.page?.goto('https://snappfood.ir/', {
          waitUntil: 'networkidle2',
          timeout: config.timeout
        });
        console.log('✅ Successfully navigated to SnappFood');
        await this.delay(3000);
      } else {
        console.log('✅ Already on SnappFood, reusing current page...');
        // Just clear any existing search instead of full reload
        try {
          await this.page?.evaluate(() => {
            // Clear any search inputs
            const inputs = document.querySelectorAll('input[type="text"]');
            inputs.forEach(input => {
              if (input instanceof HTMLInputElement) {
                input.value = '';
              }
            });
          });
        } catch (e) {
          console.log('⚠️ Could not clear inputs, continuing...');
        }
        await this.delay(500);
      }

      console.log('🔍 Looking for search area to click and open search input...');
      
      // First, click on the search area to open the search input
      await this.clickSearchAreaToOpenInput();

      // Perform search using survey data
      const products = await this.performSearchWithSurvey(searchTerm);
      
      // Take screenshot
      const screenshot = await this.page?.screenshot();
      console.log('📸 Screenshot captured');

      return {
        success: true,
        message: `Successfully searched for "${searchTerm}" and extracted ${products.length} products`,
        results: products,
        screenshot: (screenshot as Buffer).toString('base64'),
        surveyData: this.surveyData || undefined,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error during sophisticated search:', error);
      
      let screenshot = null;
      try {
        screenshot = this.page ? await this.page.screenshot() : null;
      } catch (screenshotError) {
        console.log(`⚠️ Could not take screenshot: ${screenshotError}`);
      }
      
      return {
        success: false,
        message: `Sophisticated search failed: ${error}`,
        screenshot: screenshot ? (screenshot as Buffer).toString('base64') : undefined,
        surveyData: this.surveyData || undefined
      };
    }
  }


  private async handleLocationSelectionWithSurvey(): Promise<void> {
    try {
      console.log('📍 Handling location selection using survey data...');
      
      // First, try to click on the address selection text
      await this.clickAddressSelectionText();
      
      // Wait for the address input to appear
      await this.delay(2000);
      
      // Wait for search input to appear after clicking address text
      console.log('🔍 Waiting for search input to appear...');
      let searchInputAppeared = false;
      for (let i = 0; i < 10; i++) {
        try {
          const searchInputs = await this.page?.$$('input[placeholder*="جست‌وجوی محله"]');
          if (searchInputs && searchInputs.length > 0) {
            console.log('✅ Search input appeared after clicking address text');
            searchInputAppeared = true;
            break;
          }
        } catch (e) {
          console.log(`⚠️ Error checking for search input: ${e}`);
        }
        await this.delay(1000);
      }
      
      if (!searchInputAppeared) {
        console.log('⚠️ Search input did not appear, continuing with location selection');
      }
      
      let locationInput: any = null;
      
      if (this.surveyData?.recommendations.locationInput) {
        // Use survey recommendation
        const recommendedElement = this.surveyData.recommendations.locationInput;
        console.log(`🎯 Using survey recommendation: ${recommendedElement.selector}`);
        
        try {
          locationInput = await this.page?.$(recommendedElement.selector);
          if (locationInput) {
            console.log('✅ Found location input using survey data');
          }
        } catch (e) {
          console.log('⚠️ Survey recommendation failed, falling back to discovery');
        }
      }
      
      // Fallback to dynamic discovery if survey data failed
      if (!locationInput) {
        console.log('🔍 Discovering location input dynamically...');
        locationInput = await this.discoverLocationInput();
      }
      
      if (locationInput) {
        await this.setLocation(locationInput);
      } else {
        console.log('⚠️ Could not find location input, continuing without location selection');
      }
      
    } catch (error) {
      console.log(`⚠️ Error handling location selection: ${error}`);
    }
  }

  private async clickAddressSelectionText(): Promise<void> {
    try {
      console.log('🖱️ Looking for address selection text to click...');
      
      // Skip XPath for now and use CSS selectors directly
      
      // Fallback to CSS selectors
      const addressTextSelectors = [
        // Class-based patterns
        'p.sc-hKgILt',
        'p.jsQflH',
        'p.sc-hKgILt.jsQflH',
        // Generic patterns
        'p[class*="sc-"]',
        'p[class*="address"]',
        'p[class*="location"]',
        'p[class*="select"]',
        // Text content patterns
        'p',
        'span',
        'div'
      ];

      for (const selector of addressTextSelectors) {
        try {
          console.log(`🔍 Trying CSS selector: ${selector}`);
          
          const elements = await this.page?.$$(selector);
          if (elements && elements.length > 0) {
            for (const element of elements) {
              const textContent = await element.evaluate(el => el.textContent?.trim()) || '';
              const isVisible = await element.isIntersectingViewport();
              
              console.log(`🔍 Found element with text: "${textContent}", visible: ${isVisible}`);
              
              if (textContent.includes('آدرس') || textContent.includes('انتخاب') || textContent.includes('مکان')) {
                if (isVisible) {
                  console.log(`✅ Clicking on address text (CSS): "${textContent}"`);
                  await element.click();
                  await this.delay(1000);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.log(`⚠️ CSS selector failed: ${selector}, error: ${e}`);
          continue;
        }
      }
      
      // Ultimate fallback: try to click on any visible text that might be clickable
      console.log('🔍 Ultimate fallback: Looking for any clickable text...');
      try {
        const allTextElements = await this.page?.$$('p, span, div, button');
        if (allTextElements && allTextElements.length > 0) {
          for (const element of allTextElements) {
            const textContent = await element.evaluate(el => el.textContent?.trim()) || '';
            const isVisible = await element.isIntersectingViewport();
            
            if (isVisible && textContent.length > 0 && textContent.length < 100) {
              console.log(`🔍 Trying to click on text: "${textContent}"`);
              await element.click();
              await this.delay(1000);
              break;
            }
          }
        }
      } catch (e) {
        console.log(`⚠️ Ultimate fallback click failed: ${e}`);
      }
      
    } catch (error) {
      console.log(`⚠️ Error clicking address selection text: ${error}`);
    }
  }

  private async discoverLocationInput(): Promise<any> {
    if (!this.page) return null;

    console.log('🔍 Starting comprehensive location input discovery...');

    const locationSelectors = [
      // Persian patterns
      'input[placeholder*="آدرس"]',
      'input[placeholder*="انتخاب آدرس"]',
      'input[placeholder*="انتخاب"]',
      'input[placeholder*="مکان"]',
      'input[placeholder*="شهر"]',
      'input[placeholder*="منطقه"]',
      'input[placeholder*="تحویل"]',
      'input[placeholder*="موبایل"]',
      'input[placeholder*="تلفن"]',
      'input[placeholder*="شماره"]',
      // English patterns
      'input[placeholder*="address"]',
      'input[placeholder*="location"]',
      'input[placeholder*="select"]',
      'input[placeholder*="city"]',
      'input[placeholder*="area"]',
      'input[placeholder*="delivery"]',
      'input[placeholder*="phone"]',
      'input[placeholder*="mobile"]',
      'input[placeholder*="number"]',
      // Class-based patterns
      '.location-input input',
      '.address-input input',
      '.search-location input',
      '.phone-input input',
      '.mobile-input input',
      '[class*="location"] input',
      '[class*="address"] input',
      '[class*="search-location"] input',
      '[class*="phone"] input',
      '[class*="mobile"] input',
      '[class*="cellphone"] input',
      // Data attribute patterns
      '[data-testid*="location"]',
      '[data-testid*="address"]',
      '[data-testid*="city"]',
      '[data-testid*="phone"]',
      '[data-testid*="mobile"]',
      // Name attribute patterns
      'input[name*="location"]',
      'input[name*="address"]',
      'input[name*="city"]',
      'input[name*="phone"]',
      'input[name*="mobile"]',
      'input[name*="cellphone"]',
      // ID attribute patterns
      'input[id*="location"]',
      'input[id*="address"]',
      'input[id*="city"]',
      'input[id*="phone"]',
      'input[id*="mobile"]',
      'input[id*="cellphone"]',
      // SnappFood specific patterns
      'input[name="cellphone"]',
      'input[id="cellphone"]',
      'input[class*="cellphone"]',
      // Generic text inputs that might be location inputs (but exclude search inputs)
      'input[type="text"]:not([placeholder*="جستجو"]):not([placeholder*="search"]):not([placeholder*="غذا"]):not([placeholder*="food"])'
    ];

    // First pass: Try specific selectors
    for (const selector of locationSelectors) {
      try {
        console.log(`🔍 Trying location selector: ${selector}`);
        const elements = await this.page.$$(selector);
        console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
        
        for (const element of elements) {
          const isVisible = await element.isIntersectingViewport();
          const boundingBox = await element.boundingBox();
          
          if (isVisible && boundingBox && boundingBox.width > 0) {
            // Additional check: make sure it's actually a location input
            const placeholder = await element.evaluate(el => el.getAttribute('placeholder')) || '';
            const className = await element.evaluate(el => el.className) || '';
            const id = await element.evaluate(el => el.id) || '';
            const name = await element.evaluate(el => el.getAttribute('name')) || '';
            
            if (this.isLocationInput(placeholder, className, id, name) || this.isLikelyLocationInput(boundingBox)) {
              console.log(`✅ Found location input with selector: ${selector}`);
              return element;
            }
          }
        }
      } catch (e) {
        console.log(`⚠️ Location selector failed: ${selector}, error: ${e}`);
        continue;
      }
    }

    // Final fallback: try to find ANY visible text input that's not a search input
    console.log('🔍 Final fallback: Looking for any visible text input...');
    try {
      const allTextInputs = await this.page.$$('input[type="text"]');
      console.log(`🔍 Found ${allTextInputs.length} text inputs for fallback`);
      
      for (const input of allTextInputs) {
        const isVisible = await input.isIntersectingViewport();
        const boundingBox = await input.boundingBox();
        
        if (isVisible && boundingBox && boundingBox.width > 0) {
          // Get attributes to check if it's not a search input
          const placeholder = await input.evaluate(el => el.getAttribute('placeholder')) || '';
          const className = await input.evaluate(el => el.className) || '';
          const id = await input.evaluate(el => el.id) || '';
          const name = await input.evaluate(el => el.getAttribute('name')) || '';
          
          // Check if it's NOT a search input
          if (!this.isSearchInput(placeholder, className, id, name)) {
            console.log(`✅ Found fallback location input: placeholder="${placeholder}", name="${name}"`);
            return input;
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Final fallback failed: ${e}`);
    }

    console.log('❌ Could not find any location input');
    return null;
  }

  private isLikelyLocationInput(boundingBox: any): boolean {
    // Check if it's positioned at the top (likely to be location input)
    return boundingBox.y < 200;
  }

  private async setLocation(locationInput: any): Promise<void> {
    try {
      // Get input attributes to determine what to type
      const placeholder = await locationInput.evaluate((el: HTMLElement) => el.getAttribute('placeholder')) || '';
      const name = await locationInput.evaluate((el: HTMLElement) => el.getAttribute('name')) || '';
      const id = await locationInput.evaluate((el: HTMLElement) => el.id) || '';
      
      console.log(`📍 Setting location in field: placeholder="${placeholder}", name="${name}", id="${id}"`);
      
      // Determine what to type based on field type
      let locationText = 'استان تهران';
      if (placeholder.includes('موبایل') || placeholder.includes('تلفن') || placeholder.includes('شماره') || 
          name.includes('phone') || name.includes('mobile') || name.includes('cellphone')) {
        locationText = '09123456789'; // Default phone number
        console.log('📍 Detected phone field, using phone number');
      } else {
        console.log('📍 Detected location field, using location text');
      }
      
      // Scroll to input
      await locationInput.evaluate((el: HTMLElement) => el.scrollIntoView());
      await this.delay(1000);
      
      // Click and clear
      await locationInput.click();
      await this.delay(500);
      
      // Clear existing text
      await this.page?.keyboard.down('Control');
      await this.page?.keyboard.press('KeyA');
      await this.page?.keyboard.up('Control');
      
      // Type location/phone
      await this.page?.keyboard.type(locationText);
      await this.delay(2000);

      // Submit location
      await this.submitLocation();
      
    } catch (error) {
      console.log(`⚠️ Error setting location: ${error}`);
    }
  }

  private async submitLocation(): Promise<void> {
    try {
      // Try Enter key first
      await this.page?.keyboard.press('Enter');
      await this.delay(3000); // Wait longer for page to update
      
      // Check if location was accepted by looking for search input
      const searchInputs = await this.page?.$$('input[type="text"]');
      if (searchInputs && searchInputs.length > 0) {
        console.log('✅ Location submitted successfully');
        return;
      }
      
      // Try to find and click search button
      const searchButtonSelectors = [
        'button[type="submit"]',
        '.search-button',
        '[data-testid="search-button"]',
        'button[class*="search"]',
        'button[class*="primary"]',
        // SnappFood specific buttons
        '.sc-fFubgz', // From survey data
        'button[class*="sc-"]'
      ];

      for (const selector of searchButtonSelectors) {
        try {
          const button = await this.page?.$(selector);
          if (button) {
            await button.click();
            await this.delay(3000); // Wait longer for page to update
            console.log(`✅ Location submitted using button: ${selector}`);
            return;
          }
        } catch (e) {
          continue;
        }
      }
      
      console.log('⚠️ Could not find search button for location');
    } catch (error) {
      console.log(`⚠️ Error submitting location: ${error}`);
    }
  }

  private async clickSearchAreaToOpenInput(): Promise<void> {
    try {
      console.log('🖱️ Looking for search area to click...');
      
      // Fast approach: Try most common selectors first
      const fastSelectors = [
        'input[placeholder*="جست‌وجوی محله"]',
        'input[placeholder*="جستجو"]',
        'input.SearchInput-sc-17srts3-0',
        'input.eIpOhj',
        'input[class*="SearchInput"]',
        'input[class*="eIpOhj"]'
      ];

      for (const selector of fastSelectors) {
        try {
          const element = await this.page?.$(selector);
          if (element) {
            const isVisible = await element.isIntersectingViewport();
            if (isVisible) {
              console.log(`✅ Found search input directly: ${selector}`);
              return; // Input already visible, no need to click
            }
          }
        } catch (e) {
          continue;
        }
      }

      // If no input found, try clicking search areas quickly
      const clickSelectors = [
        'div[class*="search"]',
        'div[class*="Search"]',
        'div[role="button"]'
      ];

      for (const selector of clickSelectors) {
        try {
          const elements = await this.page?.$$(selector);
          if (elements && elements.length > 0) {
            for (const element of elements.slice(0, 3)) { // Only check first 3 elements
              try {
                const isVisible = await element.isIntersectingViewport();
                if (isVisible) {
                  await element.click();
                  await this.delay(500); // Reduced wait time
                  console.log(`✅ Clicked search area: ${selector}`);
                  return;
                }
              } catch (e) {
                continue;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      console.log('⚠️ Could not find search area to click');
      
    } catch (error) {
      console.log(`⚠️ Error clicking search area: ${error}`);
    }
  }

  private async performSearchWithSurvey(searchTerm: string): Promise<any[]> {
    try {
      console.log(`🔍 Performing fast food search for "${searchTerm}"...`);
      
      // Reduced wait time
      await this.delay(1000);
      
      // Fast search input detection
      let searchInput: any = null;
      
      // Try most common selectors first (fastest approach)
      const fastSelectors = [
        'input.SearchInput-sc-17srts3-0',
        'input.eIpOhj',
        'input[placeholder*="جست‌وجوی محله"]',
        'input[placeholder*="جستجو"]',
        'input[type="text"]'
      ];

      for (const selector of fastSelectors) {
        try {
          const element = await this.page?.$(selector);
          if (element) {
            const isVisible = await element.isIntersectingViewport();
            if (isVisible) {
              // Quick validation
              const placeholder = await element.evaluate(el => el.getAttribute('placeholder')) || '';
              if (!placeholder.includes('موبایل') && !placeholder.includes('تلفن') && !placeholder.includes('آدرس')) {
                console.log(`✅ Found search input: ${selector}`);
                searchInput = element;
                break;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!searchInput) {
        throw new Error('Could not find search input field');
      }
      
      // Perform search
      const products = await this.executeSearch(searchInput, searchTerm);
      return products;
      
    } catch (error) {
      console.error('❌ Error performing search:', error);
      throw error;
    }
  }

  private async discoverSearchInput(): Promise<any> {
    if (!this.page) return null;

    console.log('🔍 Starting comprehensive search input discovery...');

    const searchSelectors = [
      // SnappFood specific selectors based on DOM structure
      'input[placeholder*="جست‌وجوی محله"]',
      'input[placeholder*="جستجو"]',
      'input.Search__StyledInput-sc-14oku2g-3',
      'input.jNfgXJ',
      'input[class*="Search__StyledInput"]',
      'input[class*="jNfgXJ"]',
      '#__next input[type="text"]',
      'main input[type="text"]',
      '.sc-dlfnbm input[type="text"]',
      '.Hero__StyledHero-sc-15kg1ff-2 input[type="text"]',
      '.Hero__HeroContent-sc-15kg1ff-3 input[type="text"]',
      '.SelectLocationBox__Container-sc-1el54kc-0 input[type="text"]',
      // Persian patterns
      'input[placeholder*="جستجو"]',
      'input[placeholder*="غذا"]',
      'input[placeholder*="رستوران"]',
      'input[placeholder*="چی"]',
      'input[placeholder*="منو"]',
      'input[placeholder*="دنبال"]',
      'input[placeholder*="پیدا"]',
      // English patterns
      'input[placeholder*="search"]',
      'input[placeholder*="food"]',
      'input[placeholder*="restaurant"]',
      'input[placeholder*="what"]',
      'input[placeholder*="menu"]',
      'input[placeholder*="dish"]',
      'input[placeholder*="meal"]',
      'input[placeholder*="find"]',
      'input[placeholder*="look"]',
      // Type-based patterns
      'input[type="search"]',
      'input[type="text"]',
      // Class-based patterns
      '.search-input',
      '.food-search-input',
      '.restaurant-search-input',
      '.search-field',
      '.food-field',
      '.restaurant-field',
      // SnappFood specific class patterns
      '[class*="search"] input',
      '[class*="Search"] input',
      '[class*="food"] input',
      '[class*="Food"] input',
      '[class*="restaurant"] input',
      '[class*="Restaurant"] input',
      // Data attribute patterns
      '[data-testid="search-input"]',
      '[data-testid="food-search-input"]',
      '[data-testid="restaurant-search-input"]',
      '[data-testid*="search"]',
      '[data-testid*="food"]',
      '[data-testid*="restaurant"]',
      // Name attribute patterns
      'input[name="search"]',
      'input[name="food"]',
      'input[name="restaurant"]',
      'input[name*="search"]',
      'input[name*="food"]',
      'input[name*="restaurant"]',
      // ID attribute patterns
      'input[id*="search"]',
      'input[id*="food"]',
      'input[id*="restaurant"]',
      'input[id*="input"]',
      // Class attribute patterns
      'input[class*="search"]',
      'input[class*="food"]',
      'input[class*="restaurant"]',
      'input[class*="input"]',
      'input[class*="text"]',
      'input[class*="field"]',
      // Generic text inputs (excluding location inputs)
      'input[type="text"]:not([placeholder*="آدرس"]):not([placeholder*="address"]):not([placeholder*="انتخاب"]):not([placeholder*="select"]):not([placeholder*="مکان"]):not([placeholder*="location"]):not([placeholder*="موبایل"]):not([placeholder*="تلفن"]):not([placeholder*="شماره"]):not([name="cellphone"])'
    ];

    // First pass: Try specific selectors
    for (const selector of searchSelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        const elements = await this.page.$$(selector);
        console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
        
        for (const element of elements) {
          const isVisible = await element.isIntersectingViewport();
          const boundingBox = await element.boundingBox();
          
          console.log(`🔍 Element visibility: ${isVisible}, boundingBox: ${JSON.stringify(boundingBox)}`);
          
          if (boundingBox && boundingBox.width > 0) {
            // Try to scroll to element if not visible
            if (!isVisible) {
              console.log(`🔍 Scrolling to element with selector: ${selector}`);
              try {
                await element.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                await this.delay(1000);
                const newIsVisible = await element.isIntersectingViewport();
                console.log(`🔍 After scroll, visibility: ${newIsVisible}`);
              } catch (scrollError) {
                console.log(`⚠️ Scroll failed: ${scrollError}`);
              }
            }
            
            // Validate that this is actually a search input
            const isValid = await this.validateSearchInput(element);
            if (isValid) {
              console.log(`✅ Found validated search input with selector: ${selector}`);
              return element;
            } else {
              console.log(`❌ Element failed validation: ${selector}`);
            }
          }
        }
      } catch (e) {
        console.log(`⚠️ Selector failed: ${selector}, error: ${e}`);
        continue;
      }
    }

    // Second pass: Try all text inputs and analyze them
    console.log('🔍 Second pass: Analyzing all text inputs...');
    try {
      const allTextInputs = await this.page.$$('input[type="text"]');
      console.log(`🔍 Found ${allTextInputs.length} text inputs total`);
      
      for (const input of allTextInputs) {
        const isVisible = await input.isIntersectingViewport();
        const boundingBox = await input.boundingBox();
        
        if (isVisible && boundingBox && boundingBox.width > 0) {
          // Validate that this is actually a search input
          const isValid = await this.validateSearchInput(input);
          if (isValid) {
            console.log(`✅ Found validated search input (second pass)`);
            return input;
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Second pass failed: ${e}`);
    }

    console.log('❌ Could not find any search input');
    return null;
  }

  private isLocationInput(placeholder: string, className: string, id: string, name: string): boolean {
    const locationKeywords = [
      'address', 'آدرس', 'location', 'مکان', 'select', 'انتخاب', 'city', 'شهر', 'area', 'منطقه',
      'phone', 'موبایل', 'mobile', 'تلفن', 'شماره', 'number', 'cellphone',
      'delivery', 'تحویل', 'place', 'مکان', 'region', 'ناحیه', 'neighborhood', 'محله'
    ];
    const text = `${placeholder} ${className} ${id} ${name}`.toLowerCase();
    return locationKeywords.some(keyword => text.includes(keyword));
  }

  private isSearchInput(placeholder: string, className: string, id: string, name: string): boolean {
    // First, exclude non-search inputs
    if (this.isNonSearchInput(placeholder, className, id, name)) {
      return false;
    }

    const searchKeywords = [
      'search', 'جستجو', 'food', 'غذا', 'restaurant', 'رستوران', 'what', 'چی', 'menu', 'منو',
      'جست‌وجوی محله', 'جست‌وجو', 'محله', 'منطقه', 'neighborhood', 'area'
    ];
    const text = `${placeholder} ${className} ${id} ${name}`.toLowerCase();
    return searchKeywords.some(keyword => text.includes(keyword));
  }

  private isNonSearchInput(placeholder: string, className: string, id: string, name: string): boolean {
    const nonSearchKeywords = [
      // Phone number patterns
      'phone', 'mobile', 'تلفن', 'موبایل', 'شماره', 'number', 'phone number',
      'شماره موبایل', 'شماره تلفن', 'mobile number', 'phone number', 'cellphone',
      // Email patterns
      'email', 'ایمیل', 'mail', 'پست الکترونیک',
      // Password patterns
      'password', 'رمز', 'pass', 'کلمه عبور',
      // Name patterns
      'name', 'نام', 'first name', 'last name', 'نام خانوادگی',
      // Address patterns (for location inputs)
      'address', 'آدرس', 'location', 'مکان', 'select', 'انتخاب', 'place', 'مکان',
      'آدرس خود را وارد کنید', 'انتخاب آدرس', 'select address', 'choose location',
      'delivery', 'تحویل', 'city', 'شهر', 'area', 'منطقه', 'neighborhood', 'محله',
      // Other non-search patterns
      'code', 'کد', 'verification', 'تایید', 'confirm', 'تایید کردن'
    ];
    
    const text = `${placeholder} ${className} ${id} ${name}`.toLowerCase();
    return nonSearchKeywords.some(keyword => text.includes(keyword));
  }

  private isLikelySearchInput(boundingBox: any): boolean {
    // Check if it's positioned prominently and is wide enough
    return boundingBox.y < 400 && boundingBox.width > 150;
  }

  private async validateSearchInput(element: any): Promise<boolean> {
    try {
      // Get element attributes for validation
      const placeholder = await element.evaluate((el: HTMLElement) => el.getAttribute('placeholder')) || '';
      const className = await element.evaluate((el: HTMLElement) => el.className) || '';
      const id = await element.evaluate((el: HTMLElement) => el.id) || '';
      const name = await element.evaluate((el: HTMLElement) => el.getAttribute('name')) || '';
      const type = await element.evaluate((el: HTMLElement) => el.getAttribute('type')) || '';
      
      console.log(`🔍 Validating input: placeholder="${placeholder}", class="${className}", id="${id}", name="${name}", type="${type}"`);
      
      // Special case: accept "جست‌وجوی محله" as search input
      if (placeholder.includes('جست‌وجوی محله') || placeholder.includes('جستجو')) {
        console.log(`✅ Input validated: Persian search input detected`);
        return true;
      }
      
      // Check if it's a non-search input
      if (this.isNonSearchInput(placeholder, className, id, name)) {
        console.log(`❌ Input rejected: Non-search input detected`);
        return false;
      }
      
      // Check if it's a search input
      if (this.isSearchInput(placeholder, className, id, name)) {
        console.log(`✅ Input validated: Search input detected`);
        return true;
      }
      
      // Additional validation: check if it's likely a search input based on context
      const boundingBox = await element.boundingBox();
      if (boundingBox && this.isLikelySearchInput(boundingBox)) {
        console.log(`✅ Input validated: Likely search input based on position/size`);
        return true;
      }
      
      console.log(`❌ Input rejected: Not a valid search input`);
      return false;
    } catch (e) {
      console.log(`⚠️ Input validation failed: ${e}`);
      return false;
    }
  }

  private async findAnyVisibleInput(): Promise<any> {
    if (!this.page) return null;

    console.log('🔍 Final fallback: Finding any visible input...');
    
    try {
      const allInputs = await this.page.$$('input');
      console.log(`🔍 Found ${allInputs.length} total inputs`);
      
      for (const input of allInputs) {
        const isVisible = await input.isIntersectingViewport();
        const boundingBox = await input.boundingBox();
        const type = await input.evaluate(el => el.getAttribute('type')) || '';
        
        console.log(`🔍 Input type: ${type}, visible: ${isVisible}, boundingBox: ${JSON.stringify(boundingBox)}`);
        
        if (isVisible && boundingBox && boundingBox.width > 0 && (type === 'text' || type === 'search')) {
          // Validate that this is actually a search input
          const isValid = await this.validateSearchInput(input);
          if (isValid) {
            console.log(`✅ Found validated input as final fallback`);
            return input;
          } else {
            console.log(`❌ Input failed validation in final fallback`);
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Final fallback failed: ${e}`);
    }
    
    return null;
  }

  private async executeSearch(searchInput: any, searchTerm: string): Promise<any[]> {
    try {
      console.log(`⌨️ Fast typing "${searchTerm}" in search field...`);
      
      // Fast input method using evaluate
      await searchInput.evaluate((el: HTMLInputElement, term: string) => {
        el.focus();
        el.value = '';
        el.value = term;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, searchTerm);
      
      await this.delay(200); // Minimal delay

      // Submit search
      await this.submitSearch();
      
      // Reduced wait time for results
      await this.delay(1500);
      
      // Skip "مشاهده همه محصولات" click for speed - extract directly
      const products = await this.extractAllProducts();
      
      console.log(`📊 Extracted ${products.length} products`);
      return products;
      
    } catch (error) {
      console.error('❌ Error executing search:', error);
      throw error;
    }
  }

  private async executeVendorSearch(searchInput: any, searchTerm: string): Promise<VendorResult[]> {
    try {
      console.log(`⌨️ Fast typing "${searchTerm}" in search field for vendor search...`);
      
      // Fast input method using evaluate
      await searchInput.evaluate((el: HTMLInputElement, term: string) => {
        el.focus();
        el.value = '';
        el.value = term;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, searchTerm);
      
      await this.delay(200); // Minimal delay

      // Submit search
      await this.submitSearch();
      
      // Wait for results to load
      await this.delay(2000);
      
      // Look for "مشاهده همه فروشندگان" link and click it
      console.log('🔍 Looking for "مشاهده همه فروشندگان" link...');
      const viewAllVendorsLink = await this.page?.evaluateHandle(() => {
        const link = document.querySelector('a[href*="/service/search-vendors/"]');
        if (link && link.textContent?.includes('مشاهده همه فروشندگان')) {
          return link;
        }
        return null;
      });

      if (viewAllVendorsLink) {
        console.log('✅ Found "مشاهده همه فروشندگان" link, clicking...');
        await (viewAllVendorsLink as any).click();
        
        // Wait for navigation with error handling
        try {
          await this.page?.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
          console.log('✅ Navigated to all vendors page');
        } catch (navError) {
          console.log('⚠️ Navigation timeout, continuing with current page...');
        }
        await this.delay(2000); // Wait for the new page to load
      } else {
        console.log('⚠️ "مشاهده همه فروشندگان" link not found, proceeding with current page results');
      }

      // Scroll to load more vendors
      await this.scrollToLoadMoreVendors();
      
      // Extract vendor data
      const vendors = await this.extractAllVendors();
      
      console.log(`📊 Extracted ${vendors.length} vendors`);
      return vendors;
      
    } catch (error) {
      console.error('❌ Error executing vendor search:', error);
      throw error;
    }
  }

  private async extractAllProducts(): Promise<any[]> {
    try {
      console.log('📊 Fast extracting products data...');
      
      // Reduced wait time
      await this.delay(1000);
      
      // Extract products using multiple selectors for better coverage
      const products = await this.page?.evaluate(() => {
        const extractedProducts: any[] = [];
        
        // Try multiple selectors to find product cards
        const selectors = [
          'a.SearchProductCard__HtmlLink-sc-uxf9c9-3',
          'a[href*="/restaurant/"]',
          'a[href*="/food/"]',
          '.search-result-card',
          '.product-card',
          '.restaurant-card'
        ];
        
        let productCards: NodeListOf<Element> | null = null;
        for (const selector of selectors) {
          productCards = document.querySelectorAll(selector);
          if (productCards.length > 0) {
            console.log(`Found ${productCards.length} products with selector: ${selector}`);
            break;
          }
        }
        
        if (!productCards || productCards.length === 0) {
          console.log('No product cards found');
          return [];
        }
        
        productCards.forEach((card, index) => {
          try {
            // Extract all possible data points
            const titleElement = card.querySelector('h2, h3, .title, .product-title, .food-title');
            const vendorElement = card.querySelector('h3, .vendor, .restaurant-name, .seller');
            const priceElement = card.querySelector('span.price, .price, [class*="price"]');
            const deliveryFeeElement = card.querySelector('span.delivery, .delivery-fee, [class*="delivery"]');
            const ratingElement = card.querySelector('span.rating, .rating, [class*="rating"]');
            const reviewsElement = card.querySelector('p.reviews, .reviews, [class*="review"]');
            const imageElement = card.querySelector('img');
            const linkElement = card.querySelector('a') || card;
            
            // Get text content safely
            const getText = (el: Element | null): string => el?.textContent?.trim() || '';
            const getSrc = (el: Element | null): string => (el as HTMLImageElement)?.src || '';
            const getHref = (el: Element | null): string => (el as HTMLAnchorElement)?.href || '';
            
            const product = {
              id: index + 1,
              title: getText(titleElement),
              vendor: getText(vendorElement),
              price: getText(priceElement),
              deliveryFee: getText(deliveryFeeElement),
              rating: getText(ratingElement),
              reviews: getText(reviewsElement),
              imageUrl: getSrc(imageElement),
              imageAlt: imageElement?.getAttribute('alt') || '',
              productUrl: getHref(linkElement),
              linkTitle: linkElement?.getAttribute('title') || ''
            };
            
            // Only add if we have meaningful data
            if (product.title || product.vendor || product.price) {
              extractedProducts.push(product);
            }
          } catch (error) {
            console.log(`Error extracting product ${index}:`, error);
          }
        });
        
        return extractedProducts;
      });
      
      console.log(`✅ Successfully extracted ${products?.length || 0} products`);
      return products || [];
      
    } catch (error) {
      console.error('❌ Error extracting products:', error);
      return [];
    }
  }

  private async scrollToLoadMoreVendors(): Promise<void> {
    try {
      console.log('📜 Skipping scroll - limiting to first 20 vendors...');
      // No scrolling needed - we'll limit extraction to first 20 vendors
      return;
    } catch (error) {
      console.log(`⚠️ Error in scroll method: ${error}`);
    }
  }

  private async extractAllVendors(): Promise<VendorResult[]> {
    try {
      console.log('📊 Extracting vendor data (limited to 20)...');
      
      // Reduced wait time
      await this.delay(500);
      
      // Extract vendors using multiple selectors for better coverage
      const vendors = await this.page?.evaluate(() => {
        const extractedVendors: VendorResult[] = [];
        
        // Try multiple selectors to find vendor cards
        const selectors = [
          'a.VendorCard__HtmlLink-sc-6qaz7-4',
          'a[href*="/restaurant/menu/"]',
          '.vendor-card',
          '.restaurant-card'
        ];
        
        let vendorCards: NodeListOf<Element> | null = null;
        for (const selector of selectors) {
          vendorCards = document.querySelectorAll(selector);
          if (vendorCards.length > 0) {
            console.log(`Found vendor cards using selector: ${selector}`);
            break;
          }
        }
        
        if (!vendorCards || vendorCards.length === 0) {
          console.log('No vendor cards found with any selector.');
          return [];
        }
        
        // Limit to first 20 vendors
        const limitedCards = Array.from(vendorCards).slice(0, 20);
        console.log(`Processing ${limitedCards.length} vendors (limited to 20)`);
        
        limitedCards.forEach((card, index) => {
          try {
            const titleElement = card.querySelector('h2.VendorCard__VendorTitle-sc-6qaz7-5');
            const ratingElement = card.querySelector('span.sc-fubCfw.dHxJBl span.sc-hKgILt.jsaCNc');
            const reviewsElement = card.querySelector('p.sc-hKgILt.fYlAbO');
            const cuisineElement = card.querySelector('h3.sc-hKgILt.fYlAbO');
            const deliveryFeeElement = card.querySelector('.DeliveryBadge__DeliveryBox-sc-c1m1pa-0 .sc-hKgILt.jsaCNc');
            const deliveryTypeElement = card.querySelector('.DeliveryBadge__DeliveryBox-sc-c1m1pa-0 .sc-hKgILt.sFIZX');
            const discountElement = card.querySelector('.PromotionBadge__StyledPromotionBadge-sc-nkwc41-0 .sc-hKgILt.LJLCg');
            const couponTextElement = card.querySelector('.CouponBadge__CouponText-sc-137vup2-2');
            const coverImageElement = card.querySelector('.VendorCard__ImgWrapper-sc-6qaz7-2 img:not(.VendorLogo__Logo-sc-9mwh1-0 img)');
            const logoImageElement = card.querySelector('.VendorLogo__Logo-sc-9mwh1-0 img');
            
            const deliveryFeeText = deliveryFeeElement?.textContent?.trim();
            const deliveryTypeText = deliveryTypeElement?.textContent?.trim();
            let fullDeliveryText = '';
            if (deliveryTypeText && deliveryFeeText) {
              fullDeliveryText = `${deliveryTypeText} ${deliveryFeeText}`;
            } else if (deliveryTypeText) {
              fullDeliveryText = deliveryTypeText;
            } else if (deliveryFeeText) {
              fullDeliveryText = deliveryFeeText;
            }
            
            extractedVendors.push({
              id: index,
              title: titleElement?.textContent?.trim() || 'N/A',
              url: (card as HTMLAnchorElement).href,
              coverImageUrl: (coverImageElement as HTMLImageElement)?.src,
              logoImageUrl: (logoImageElement as HTMLImageElement)?.src,
              rating: ratingElement?.textContent?.trim(),
              reviews: reviewsElement?.textContent?.trim(),
              cuisine: cuisineElement?.textContent?.trim(),
              deliveryFee: fullDeliveryText,
              discount: discountElement?.textContent?.trim(),
              couponText: couponTextElement?.textContent?.trim(),
            });
          } catch (e) {
            console.error('Error extracting vendor card:', e);
          }
        });
        return extractedVendors;
      });
      
      return vendors || [];
    } catch (error) {
      console.error('❌ Error extracting all vendors:', error);
      return [];
    }
  }

  private async clickViewAllProducts(): Promise<void> {
    try {
      console.log('🖱️ Looking for "مشاهده همه محصولات" button...');
      
      // Try to find and click on "مشاهده همه محصولات" button
      const viewAllSelectors = [
        'p.sc-hKgILt.gTWpCI',
        'p[class*="sc-hKgILt"][class*="gTWpCI"]',
        '[class*="view-all"]',
        '[class*="ViewAll"]'
      ];

      for (const selector of viewAllSelectors) {
        try {
          console.log(`🔍 Trying view all selector: ${selector}`);
          
          if (!this.page || this.page.isClosed()) {
            throw new Error('Page is closed');
          }
          
          const elements = await this.page.$$(selector);
          if (elements && elements.length > 0) {
            for (const element of elements) {
              try {
                const textContent = await element.evaluate(el => el.textContent?.trim()) || '';
                const isVisible = await element.isIntersectingViewport();
                
                console.log(`🔍 Found element: text="${textContent}", visible=${isVisible}`);
                
                // Check if it contains the text "مشاهده همه محصولات"
                if (isVisible && textContent.includes('مشاهده همه محصولات')) {
                  console.log(`✅ Clicking on "مشاهده همه محصولات" button`);
                  
                  // Try to scroll to element first
                  try {
                    await element.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                    await this.delay(1000);
                  } catch (scrollError) {
                    console.log(`⚠️ Scroll failed: ${scrollError}`);
                  }
                  
                  // Click on the element
                  await element.click();
                  await this.delay(3000); // Wait for products page to load
                  
                  console.log('✅ "مشاهده همه محصولات" clicked, waiting for products to load...');
                  return;
                }
              } catch (elementError) {
                console.log(`⚠️ Error evaluating element: ${elementError}`);
                continue;
              }
            }
          }
        } catch (e) {
          console.log(`⚠️ View all selector failed: ${selector}, error: ${e}`);
          continue;
        }
      }
      
      console.log('⚠️ Could not find "مشاهده همه محصولات" button');
      
    } catch (error) {
      console.log(`⚠️ Error clicking view all products: ${error}`);
    }
  }

  private async submitSearch(): Promise<void> {
    try {
      // Fast submit using Enter key
      await this.page?.keyboard.press('Enter');
      await this.delay(300); // Reduced wait time
      console.log('✅ Search submitted using Enter key');
      
    } catch (error) {
      console.log('⚠️ Enter key failed, trying search button...');
      
      // Quick button search
      const searchButtonSelectors = [
        'button[type="submit"]',
        '.search-button',
        'button[class*="search"]',
        'button[class*="primary"]'
      ];

      for (const selector of searchButtonSelectors) {
        try {
          const searchButton = await this.page?.$(selector);
          if (searchButton) {
            await searchButton.click();
            await this.delay(300);
            console.log(`✅ Search submitted using button: ${selector}`);
            return;
          }
        } catch (e) {
          continue;
        }
      }
      
      console.log('⚠️ Could not find search button');
    }
  }

  private async extractResultsWithSurvey(): Promise<any[]> {
    try {
      console.log('📊 Extracting results using survey data...');
      
      let results: any[] = [];
      
      if (this.surveyData?.recommendations?.resultCards && this.surveyData.recommendations.resultCards.length > 0) {
        // Use survey recommendations
        console.log(`🎯 Using ${this.surveyData.recommendations.resultCards.length} survey recommended result cards`);
        
        for (const cardElement of this.surveyData.recommendations.resultCards) {
          try {
            const elements = await this.page?.$$(cardElement.selector);
            if (elements && elements.length > 0) {
              const cardResults = await this.extractCardData(elements.slice(0, 10));
              results.push(...cardResults);
              break; // Use first successful selector
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      // Fallback to dynamic discovery
      if (results.length === 0) {
        console.log('🔍 Discovering result cards dynamically...');
        results = await this.discoverAndExtractResults();
      }
      
      console.log(`📊 Extracted ${results.length} results`);
      return results;
      
    } catch (error) {
      console.error('❌ Error extracting results:', error);
      return [];
    }
  }

  private async discoverAndExtractResults(): Promise<any[]> {
    if (!this.page) return [];

    const resultSelectors = [
      '.restaurant-card',
      '.food-card',
      '.search-result',
      '[data-testid="restaurant-card"]',
      '.restaurant-item',
      '.food-item',
      '.restaurant',
      '.food',
      '.item',
      '.card',
      '.result'
    ];

    for (const selector of resultSelectors) {
      try {
        const elements = await this.page.$$(selector);
        if (elements.length > 0) {
          console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
          return await this.extractCardData(elements.slice(0, 20));
        }
      } catch (e) {
        continue;
      }
    }

    return [];
  }

  private async extractCardData(elements: any[]): Promise<any[]> {
    return await Promise.all(
      elements.map(async (element, index) => {
        try {
          const title = await element.$eval('h1, h2, h3, h4, .title, .name, .restaurant-name', (el: Element) => el.textContent?.trim()).catch(() => '');
          const description = await element.$eval('p, .description, .subtitle, .address', (el: Element) => el.textContent?.trim()).catch(() => '');
          const image = await element.$eval('img', (el: HTMLImageElement) => el.src).catch(() => '');
          const price = await element.$eval('.price, .cost, [class*="price"]', (el: Element) => el.textContent?.trim()).catch(() => '');
          const rating = await element.$eval('.rating, .score, [class*="rating"]', (el: Element) => el.textContent?.trim()).catch(() => '');
          
          return {
            id: index + 1,
            title: title || `Result ${index + 1}`,
            description: description || '',
            image: image || '',
            price: price || '',
            rating: rating || ''
          };
        } catch (e) {
          return {
            id: index + 1,
            title: `Result ${index + 1}`,
            description: '',
            image: '',
            price: '',
            rating: ''
          };
        }
      })
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async cleanupBrowser(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        console.log('🧹 Closing existing page...');
        await this.page.close();
        this.page = null;
      }
      
      if (this.browser) {
        console.log('🧹 Closing existing browser...');
        await this.browser.close();
        this.browser = null;
      }
      
      // Wait a bit for cleanup to complete
      await this.delay(1000);
      console.log('✅ Browser cleanup completed');
    } catch (error) {
      console.log('⚠️ Error during browser cleanup:', error);
      // Force reset even if cleanup fails
      this.browser = null;
      this.page = null;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.surveyService.isInitialized()) {
        await this.surveyService.close();
      }
      
      await this.cleanupBrowser();
      console.log('✅ Automation closed');
    } catch (error) {
      console.error('⚠️ Error closing automation:', error);
    }
  }

  async keepBrowserAlive(): Promise<void> {
    if (this.isBrowserOpen()) {
      try {
        // Just check if browser is still responsive by checking page title
        const title = await this.page?.title();
        console.log('✅ Browser is responsive and alive');
      } catch (error) {
        console.log('⚠️ Browser not responsive, will reinitialize on next use');
      }
    }
  }

  async takeScreenshot(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      const screenshot = await this.page.screenshot();
      return (screenshot as Buffer).toString('base64');
    } catch (error) {
      console.log(`⚠️ Could not take screenshot: ${error}`);
      throw new Error(`Screenshot failed: ${error}`);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isBrowserOpen(): boolean {
    const browserExists = this.browser !== null;
    const browserConnected = this.browser?.isConnected() || false;
    const pageExists = this.page !== null;
    
    // More lenient check - if browser exists and is connected, consider it open
    // Don't rely on page.isClosed() as it might be unreliable
    const isOpen = browserExists && browserConnected && pageExists;
    
    console.log('🔍 Browser status check:', {
      browserExists,
      browserConnected,
      pageExists,
      isOpen,
      pageClosed: this.page?.isClosed() || 'no-page'
    });
    
    return isOpen;
  }

  async ensureBrowserOpen(): Promise<void> {
    // NEVER create new browser - only use existing one
    if (this.browser && this.page) {
      console.log('✅ Using existing browser - NO NEW BROWSER');
      return;
    }
    
    console.log('❌ NO BROWSER EXISTS - This should not happen!');
    throw new Error('Browser should have been created at startup');
  }

  async ensurePageOpen(): Promise<void> {
    // NEVER create new page - only use existing one
    if (this.page) {
      console.log('✅ Using existing page - NO NEW PAGE');
      return;
    }
    
    console.log('❌ NO PAGE EXISTS - This should not happen!');
    throw new Error('Page should have been created at startup');
  }

  getSurveyData(): DOMSurveyResult | null {
    return this.surveyData;
  }

  getBrowserInfo(): any {
    return {
      browserExists: !!this.browser,
      browserConnected: this.browser?.isConnected() || false,
      pageExists: !!this.page,
      pageClosed: this.page?.isClosed() || 'no-page',
      sessionId: this.sessionId,
      url: this.page?.url() || 'no-url'
    };
  }

  async testBrowserUsability(): Promise<boolean> {
    if (!this.browser || !this.page) {
      return false;
    }
    
    try {
      // Try a simple operation to test if browser is usable
      await this.page.title();
      return true;
    } catch (error) {
      console.log('⚠️ Browser test failed:', error);
      return false;
    }
  }
}
