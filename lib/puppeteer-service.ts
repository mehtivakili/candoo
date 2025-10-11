import puppeteer, { Browser, Page } from 'puppeteer';

export interface SearchResult {
  success: boolean;
  message: string;
  results?: any[];
  screenshot?: string;
}

export class SnappFoodAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting browser...');
      
      // Use Puppeteer's installed Chrome
      console.log('✅ Using Puppeteer\'s installed Chrome browser');
      
      this.browser = await puppeteer.launch({
        headless: false, // Always show browser window
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
          '--disable-extensions'
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8'
      });

      console.log('✅ Browser initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw new Error(`Failed to initialize browser: ${error}`);
    }
  }

  async searchOnSnappFood(searchTerm: string): Promise<SearchResult> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      console.log(`🔍 Searching for "${searchTerm}" on SnappFood...`);
      
      // Navigate to SnappFood
      console.log('🌐 Navigating to SnappFood...');
      await this.page.goto('https://snappfood.ir/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      console.log('✅ Successfully navigated to SnappFood');
      
      // Wait for the page to load completely
      console.log('⏳ Waiting for page to load completely...');
      await this.delay(5000);

      // Handle location selection in the main search bar
      await this.handleLocationSelection();
      
      // Wait a bit more after location selection
      console.log('⏳ Waiting after location selection...');
      await this.delay(3000);

      // Look for food search input field (different from location input)
      // This should be the input where we search for food items
      const searchSelectors = [
        // SnappFood specific selectors for food search
        'input[placeholder*="جستجو"]',
        'input[placeholder*="search"]',
        'input[placeholder*="غذا"]',
        'input[placeholder*="food"]',
        'input[placeholder*="رستوران"]',
        'input[placeholder*="restaurant"]',
        // Generic search selectors
        'input[type="search"]',
        '.search-input',
        '.food-search-input',
        '.restaurant-search-input',
        '[data-testid="search-input"]',
        '[data-testid="food-search-input"]',
        'input[name="search"]',
        'input[name="food"]',
        'input[class*="search"]',
        'input[class*="food"]',
        'input[id*="search"]',
        'input[id*="food"]',
        // Look for inputs that are specifically for food search (not location)
        'input[type="text"]:not([placeholder*="آدرس"]):not([placeholder*="address"]):not([placeholder*="انتخاب"])'
      ];

      let searchInput = null;
      let foundSelector = '';
      
      for (const selector of searchSelectors) {
        try {
          const elements = await this.page.$$(selector);
          if (elements && elements.length > 0) {
            // Check if the element is visible and not hidden
            for (const element of elements) {
              const isVisible = await element.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0;
              });
              
              if (isVisible) {
                searchInput = element;
                foundSelector = selector;
                console.log(`✅ Found visible food search input with selector: ${selector}`);
                break;
              }
            }
            if (searchInput) break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!searchInput) {
        console.log('❌ Could not find food search input field');
        
        // Debug: Take screenshot and log all inputs again
        const debugScreenshot = await this.page.screenshot();
        const allInputs = await this.page.$$('input');
        console.log(`🔍 Debug: Found ${allInputs?.length || 0} input elements after location selection`);
        
        if (allInputs && allInputs.length > 0) {
          for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
            try {
              const placeholder = await allInputs[i].evaluate(el => el.getAttribute('placeholder'));
              const className = await allInputs[i].evaluate(el => el.className);
              const id = await allInputs[i].evaluate(el => el.id);
              const type = await allInputs[i].evaluate(el => el.getAttribute('type'));
              const isVisible = await allInputs[i].evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0;
              });
              console.log(`Debug Input ${i + 1}: placeholder="${placeholder}", class="${className}", id="${id}", type="${type}", visible=${isVisible}`);
            } catch (e) {
              console.log(`Debug Input ${i + 1}: Could not get attributes`);
            }
          }
        }
        
        return {
          success: false,
          message: 'Could not find food search input field on SnappFood. Please check the screenshot.',
          screenshot: (debugScreenshot as Buffer).toString('base64')
        };
      }

      // Type the search term in the search field
      console.log(`⌨️ Typing "${searchTerm}" in search field...`);
      await searchInput.click();
      await this.page.keyboard.type(searchTerm);

      // Wait a bit for suggestions or results
      await this.delay(2000);

      // Try to submit the search
      console.log('🔍 Submitting search...');
      try {
        await this.page.keyboard.press('Enter');
        console.log('✅ Submitted search using Enter key');
      } catch (e) {
        // If Enter doesn't work, try to find and click search button
        const searchButtonSelectors = [
          'button[type="submit"]',
          '.search-button',
          '[data-testid="search-button"]',
          'button[class*="search"]',
          'button[id*="search"]'
        ];
        
        let searchButton = null;
        for (const selector of searchButtonSelectors) {
          try {
            searchButton = await this.page.$(selector);
            if (searchButton) {
              await searchButton.click();
              console.log(`✅ Submitted search using button: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!searchButton) {
          console.log('⚠️ Could not find search button, but search term was entered');
        }
      }

      // Wait for search results to load
      console.log('⏳ Waiting for search results...');
      await this.delay(5000);

      // Take screenshot of results
      const screenshot = await this.page.screenshot();
      console.log('📸 Screenshot captured');

      // Try to extract search results
      const results = await this.extractSearchResults();
      console.log(`📊 Found ${results.length} results`);

      return {
        success: true,
        message: `Successfully searched for "${searchTerm}" on SnappFood`,
        results,
        screenshot: (screenshot as Buffer).toString('base64')
      };

    } catch (error) {
      console.error('❌ Error during search:', error);
      
      const screenshot = this.page ? await this.page.screenshot() : null;
      
      return {
        success: false,
        message: `Search failed: ${error}`,
        screenshot: screenshot ? (screenshot as Buffer).toString('base64') : undefined
      };
    }
  }

  private async extractSearchResults(): Promise<any[]> {
    if (!this.page) return [];

    try {
      // Try to find restaurant/food cards with multiple selectors
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

      let results: any[] = [];
      
      for (const selector of resultSelectors) {
        try {
          const elements = await this.page.$$(selector);
          if (elements.length > 0) {
            console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
            
            results = await Promise.all(
              elements.slice(0, 20).map(async (element, index) => {
                try {
                  const title = await element.$eval('h1, h2, h3, h4, .title, .name, .restaurant-name', el => el.textContent?.trim()).catch(() => '');
                  const description = await element.$eval('p, .description, .subtitle, .address', el => el.textContent?.trim()).catch(() => '');
                  const image = await element.$eval('img', el => el.src).catch(() => '');
                  const price = await element.$eval('.price, .cost, [class*="price"]', el => el.textContent?.trim()).catch(() => '');
                  const rating = await element.$eval('.rating, .score, [class*="rating"]', el => el.textContent?.trim()).catch(() => '');
                  
                  return {
                    id: index + 1,
                    title: title || `Result ${index + 1}`,
                    description: description || '',
                    image: image || '',
                    price: price || '',
                    rating: rating || '',
                    selector: selector
                  };
                } catch (e) {
                  return {
                    id: index + 1,
                    title: `Result ${index + 1}`,
                    description: '',
                    image: '',
                    price: '',
                    rating: '',
                    selector: selector
                  };
                }
              })
            );
            break;
          }
        } catch (e) {
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error extracting results:', error);
      return [];
    }
  }

  private async handleLocationSelection(): Promise<void> {
    try {
      console.log('🔍 Looking for location input field...');
      
      // Wait for the page to fully load
      await this.delay(3000);
      
      // Debug: Log all input elements on the page
      const allInputs = await this.page?.$$('input');
      console.log(`🔍 Found ${allInputs?.length || 0} input elements on the page`);
      
      if (allInputs && allInputs.length > 0) {
        for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
          try {
            const placeholder = await allInputs[i].evaluate(el => el.getAttribute('placeholder'));
            const className = await allInputs[i].evaluate(el => el.className);
            const id = await allInputs[i].evaluate(el => el.id);
            const type = await allInputs[i].evaluate(el => el.getAttribute('type'));
            console.log(`Input ${i + 1}: placeholder="${placeholder}", class="${className}", id="${id}", type="${type}"`);
          } catch (e) {
            console.log(`Input ${i + 1}: Could not get attributes`);
          }
        }
      }
      
      // Look specifically for the location/address input field (NOT the food search field)
      // This should be the main input that appears when you first visit SnappFood
      const locationInputSelectors = [
        // SnappFood specific selectors for location input
        'input[placeholder*="آدرس"]',
        'input[placeholder*="address"]',
        'input[placeholder*="انتخاب آدرس"]',
        'input[placeholder*="انتخاب"]',
        'input[placeholder*="select"]',
        'input[placeholder*="مکان"]',
        'input[placeholder*="location"]',
        // Generic selectors that might match the location input
        '.location-input input',
        '.address-input input',
        '.search-location input',
        '[class*="location"] input',
        '[class*="address"] input',
        '[class*="search-location"] input',
        // Look for the first visible input that's not a search input
        'input[type="text"]:not([placeholder*="جستجو"]):not([placeholder*="search"])'
      ];

      let locationInput = null;
      let foundSelector = '';
      
      for (const selector of locationInputSelectors) {
        try {
          const elements = await this.page?.$$(selector);
          if (elements && elements.length > 0) {
            // Check if the element is visible and not hidden
            for (const element of elements) {
              const isVisible = await element.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0;
              });
              
              if (isVisible) {
                locationInput = element;
                foundSelector = selector;
                console.log(`✅ Found visible location input with selector: ${selector}`);
                break;
              }
            }
            if (locationInput) break;
          }
        } catch (e) {
          continue;
        }
      }

      if (locationInput) {
        console.log('📍 Location input found, setting location...');
        
        // Scroll to the input field to make sure it's visible
        await locationInput.evaluate(el => el.scrollIntoView());
        await this.delay(1000);
        
        // Click on the input field
        await locationInput.click();
        await this.delay(1000);
        
        // Clear any existing text and type the location
        console.log('⌨️ Typing "استان تهران" in location field...');
        await this.page?.keyboard.down('Control');
        await this.page?.keyboard.press('KeyA');
        await this.page?.keyboard.up('Control');
        await this.page?.keyboard.type('استان تهران');
        await this.delay(2000);

        // Look for the search/submit button specifically for location
        const locationSearchButtonSelectors = [
          // Look for buttons near the location input
          'button[class*="search"]',
          'button[class*="submit"]',
          'button[class*="location"]',
          'button[class*="address"]',
          '.search-button',
          '.submit-button',
          '.location-button',
          '[data-testid="search-button"]',
          '[data-testid="location-button"]',
          'button[type="submit"]',
          // Look for buttons with search icons
          'button:has(svg)',
          'button:has(.search-icon)',
          'button:has(.magnifying-glass)',
          // Look for the pink/orange search button
          'button[style*="background"]',
          'button[class*="primary"]'
        ];

        let searchButton = null;
        for (const selector of locationSearchButtonSelectors) {
          try {
            const buttons = await this.page?.$$(selector);
            if (buttons && buttons.length > 0) {
              for (const button of buttons) {
                const isVisible = await button.evaluate(el => {
                  const style = window.getComputedStyle(el);
                  return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0;
                });
                
                if (isVisible) {
                  searchButton = button;
                  console.log(`✅ Found visible search button with selector: ${selector}`);
                  break;
                }
              }
              if (searchButton) break;
            }
          } catch (e) {
            continue;
          }
        }

        if (searchButton) {
          console.log('🔍 Clicking search button to set location...');
          await searchButton.click();
          await this.delay(3000);
          console.log('✅ Location selection completed');
        } else {
          console.log('⚠️ Could not find search button, trying Enter key...');
          await this.page?.keyboard.press('Enter');
          await this.delay(3000);
          console.log('✅ Location submitted with Enter key');
        }
        
        // Take a screenshot to see the result
        const locationScreenshot = await this.page?.screenshot();
        console.log('📸 Screenshot taken after location selection');
      } else {
        console.log('⚠️ Could not find location input field, continuing without location selection');
      }
    } catch (error) {
      console.log(`⚠️ Error handling location selection: ${error}`);
      // Continue anyway, don't let this stop the search
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      console.log('🔒 Closing browser...');
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('✅ Browser closed');
    }
  }

  async takeScreenshot(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    const screenshot = await this.page.screenshot();
    return (screenshot as Buffer).toString('base64');
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isBrowserOpen(): boolean {
    return this.browser !== null && this.page !== null;
  }
}