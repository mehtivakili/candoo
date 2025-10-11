import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';

export interface DOMElement {
  selector: string;
  tagName: string;
  attributes: Record<string, string>;
  textContent: string;
  isVisible: boolean;
  boundingBox: any;
  confidence: number;
  elementType: 'search-input' | 'location-input' | 'search-button' | 'result-card' | 'unknown';
}

export interface DOMSurveyResult {
  url: string;
  timestamp: Date;
  elements: DOMElement[];
  pageTitle: string;
  pageDescription: string;
  recommendations: {
    searchInput: DOMElement | null;
    locationInput: DOMElement | null;
    searchButton: DOMElement | null;
    resultCards: DOMElement[];
  };
  screenshot: string;
}

export interface SurveyStrategy {
  name: string;
  weight: number;
  analyze: (page: Page) => Promise<DOMElement[]>;
}

export class DOMSurveyService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private strategies: SurveyStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'Semantic Analysis',
        weight: 0.4,
        analyze: this.semanticAnalysis.bind(this)
      },
      {
        name: 'Attribute Pattern Matching',
        weight: 0.3,
        analyze: this.attributePatternMatching.bind(this)
      },
      {
        name: 'Visual Layout Analysis',
        weight: 0.2,
        analyze: this.visualLayoutAnalysis.bind(this)
      },
      {
        name: 'Behavioral Analysis',
        weight: 0.1,
        analyze: this.behavioralAnalysis.bind(this)
      }
    ];
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing DOM Survey Service...');
      
      this.browser = await puppeteer.launch({
        headless: true, // Run in headless mode for survey
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--window-size=1920,1080'
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

      console.log('✅ DOM Survey Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize DOM Survey Service:', error);
      throw new Error(`Failed to initialize DOM Survey Service: ${error}`);
    }
  }

  async surveyPage(url: string): Promise<DOMSurveyResult> {
    if (!this.page) {
      throw new Error('DOM Survey Service not initialized. Call initialize() first.');
    }

    try {
      console.log(`🔍 Surveying page: ${url}`);
      
      // Navigate to the page
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for dynamic content to load
      await this.delay(5000);

      // Get page metadata
      const pageTitle = await this.page.title();
      const pageDescription = await this.page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => '') || '';

      // Run all survey strategies
      const allElements: DOMElement[] = [];
      
      for (const strategy of this.strategies) {
        try {
          console.log(`🔍 Running strategy: ${strategy.name}`);
          const elements = await strategy.analyze(this.page);
          elements.forEach(element => {
            element.confidence *= strategy.weight;
          });
          allElements.push(...elements);
        } catch (error) {
          console.error(`❌ Strategy ${strategy.name} failed:`, error);
        }
      }

      // Deduplicate and rank elements
      const uniqueElements = this.deduplicateElements(allElements);
      const rankedElements = this.rankElements(uniqueElements);

      // Generate recommendations
      const recommendations = this.generateRecommendations(rankedElements);

      // Take screenshot
      const screenshot = await this.page.screenshot();
      
      const result: DOMSurveyResult = {
        url,
        timestamp: new Date(),
        elements: rankedElements,
        pageTitle,
        pageDescription,
        recommendations,
        screenshot: (screenshot as Buffer).toString('base64')
      };

      console.log(`✅ Survey completed. Found ${rankedElements.length} elements`);
      return result;

    } catch (error) {
      console.error('❌ Error during page survey:', error);
      throw new Error(`Page survey failed: ${error}`);
    }
  }

  private async semanticAnalysis(page: Page): Promise<DOMElement[]> {
    const elements: DOMElement[] = [];

    try {
      // Analyze input elements for semantic meaning
      const inputs = await page.$$('input');
      console.log(`🔍 Semantic Analysis: Found ${inputs.length} input elements`);
      
      for (const input of inputs) {
        const element = await this.createElementFromHandle(input, 'unknown');
        
        // Debug: Log all input attributes
        console.log(`🔍 Input Debug: placeholder="${element.attributes.placeholder}", class="${element.attributes.class}", id="${element.attributes.id}", name="${element.attributes.name}", type="${element.attributes.type}"`);
        
        // Analyze placeholder text for semantic meaning
        const placeholder = element.attributes.placeholder?.toLowerCase() || '';
        const className = element.attributes.class?.toLowerCase() || '';
        const id = element.attributes.id?.toLowerCase() || '';
        const name = element.attributes.name?.toLowerCase() || '';
        const type = element.attributes.type?.toLowerCase() || '';

        // Enhanced search input detection
        if (this.isSearchInput(placeholder, className, id, name, type)) {
          element.elementType = 'search-input';
          element.confidence = 0.9;
          console.log(`✅ Found search input: ${element.selector}`);
        }
        // Enhanced location input detection
        else if (this.isLocationInput(placeholder, className, id, name, type)) {
          element.elementType = 'location-input';
          element.confidence = 0.9;
          console.log(`✅ Found location input: ${element.selector}`);
        }
        // Generic text input detection (fallback)
        else if (type === 'text' && element.isVisible) {
          // First check if it's a non-search input
          if (!this.isNonSearchInput(placeholder, className, id, name, type)) {
            // Check if it's likely a search input based on position and context
            if (this.isLikelySearchInput(element)) {
              element.elementType = 'search-input';
              element.confidence = 0.6;
              console.log(`✅ Found likely search input (fallback): ${element.selector}`);
            }
            // Check if it's likely a location input
            else if (this.isLikelyLocationInput(element)) {
              element.elementType = 'location-input';
              element.confidence = 0.6;
              console.log(`✅ Found likely location input (fallback): ${element.selector}`);
            }
          } else {
            console.log(`❌ Excluded non-search input: ${element.selector}`);
          }
        }

        if (element.elementType !== 'unknown') {
          elements.push(element);
        }
      }

      // Analyze button elements
      const buttons = await page.$$('button');
      
      for (const button of buttons) {
        const element = await this.createElementFromHandle(button, 'unknown');
        
        const textContent = element.textContent.toLowerCase();
        const className = element.attributes.class?.toLowerCase() || '';
        const id = element.attributes.id?.toLowerCase() || '';

        if (this.isSearchButton(textContent, className, id)) {
          element.elementType = 'search-button';
          element.confidence = 0.8;
          elements.push(element);
        }
      }

      // Analyze result cards
      const cards = await page.$$('[class*="card"], [class*="item"], [class*="result"]');
      
      for (const card of cards) {
        const element = await this.createElementFromHandle(card, 'unknown');
        
        if (this.isResultCard(element)) {
          element.elementType = 'result-card';
          element.confidence = 0.7;
          elements.push(element);
        }
      }

    } catch (error) {
      console.error('❌ Semantic analysis failed:', error);
    }

    return elements;
  }

  private async attributePatternMatching(page: Page): Promise<DOMElement[]> {
    const elements: DOMElement[] = [];

    try {
      // Common patterns for search inputs
      const searchPatterns = [
        'input[placeholder*="search"]',
        'input[placeholder*="جستجو"]',
        'input[placeholder*="food"]',
        'input[placeholder*="غذا"]',
        'input[placeholder*="restaurant"]',
        'input[placeholder*="رستوران"]',
        'input[placeholder*="what"]',
        'input[placeholder*="چی"]',
        'input[placeholder*="menu"]',
        'input[placeholder*="منو"]',
        'input[type="search"]',
        'input[type="text"]',
        'input[name*="search"]',
        'input[name*="food"]',
        'input[name*="restaurant"]',
        'input[id*="search"]',
        'input[id*="food"]',
        'input[id*="restaurant"]',
        'input[class*="search"]',
        'input[class*="food"]',
        'input[class*="restaurant"]',
        'input[class*="input"]',
        'input[class*="text"]',
        '[data-testid*="search"]',
        '[data-testid*="food"]',
        '[data-testid*="restaurant"]',
        '[data-testid*="input"]',
        // Generic input patterns
        'input[type="text"]:not([placeholder*="آدرس"]):not([placeholder*="address"])',
        'input[type="text"]:not([placeholder*="انتخاب"]):not([placeholder*="select"])'
      ];

      for (const pattern of searchPatterns) {
        try {
          const foundElements = await page.$$(pattern);
          for (const element of foundElements) {
            const domElement = await this.createElementFromHandle(element, 'search-input');
            domElement.confidence = 0.8;
            elements.push(domElement);
          }
        } catch (e) {
          continue;
        }
      }

      // Common patterns for location inputs
      const locationPatterns = [
        'input[placeholder*="address"]',
        'input[placeholder*="آدرس"]',
        'input[placeholder*="location"]',
        'input[placeholder*="مکان"]',
        'input[placeholder*="select"]',
        'input[placeholder*="انتخاب"]',
        'input[placeholder*="city"]',
        'input[placeholder*="شهر"]',
        'input[placeholder*="area"]',
        'input[placeholder*="منطقه"]',
        'input[placeholder*="delivery"]',
        'input[placeholder*="تحویل"]',
        'input[name*="location"]',
        'input[name*="address"]',
        'input[name*="city"]',
        'input[id*="location"]',
        'input[id*="address"]',
        'input[id*="city"]',
        'input[class*="location"]',
        'input[class*="address"]',
        'input[class*="city"]',
        '[data-testid*="location"]',
        '[data-testid*="address"]',
        '[data-testid*="city"]'
      ];

      for (const pattern of locationPatterns) {
        try {
          const foundElements = await page.$$(pattern);
          for (const element of foundElements) {
            const domElement = await this.createElementFromHandle(element, 'location-input');
            domElement.confidence = 0.8;
            elements.push(domElement);
          }
        } catch (e) {
          continue;
        }
      }

      // Common patterns for search buttons
      const buttonPatterns = [
        'button[type="submit"]',
        'button[class*="search"]',
        'button[id*="search"]',
        '[data-testid*="search-button"]',
        'button:has(svg)',
        'button[class*="primary"]'
      ];

      for (const pattern of buttonPatterns) {
        try {
          const foundElements = await page.$$(pattern);
          for (const element of foundElements) {
            const domElement = await this.createElementFromHandle(element, 'search-button');
            domElement.confidence = 0.7;
            elements.push(domElement);
          }
        } catch (e) {
          continue;
        }
      }

    } catch (error) {
      console.error('❌ Attribute pattern matching failed:', error);
    }

    return elements;
  }

  private async visualLayoutAnalysis(page: Page): Promise<DOMElement[]> {
    const elements: DOMElement[] = [];

    try {
      // Analyze elements based on their visual position and size
      const allElements = await page.$$('input, button, [class*="card"], [class*="item"]');
      
      for (const element of allElements) {
        const boundingBox = await element.boundingBox();
        const isVisible = await element.isIntersectingViewport();
        
        if (!boundingBox || !isVisible) continue;

        const domElement = await this.createElementFromHandle(element, 'unknown');
        
        // Analyze position and size for element type inference
        const { width, height, x, y } = boundingBox;
        
        // Search inputs are typically wider and positioned prominently
        if (width > 200 && height > 30 && y < 200) {
          if (domElement.tagName === 'input') {
            domElement.elementType = 'search-input';
            domElement.confidence = 0.6;
            elements.push(domElement);
          }
        }
        
        // Search buttons are typically near search inputs
        if (domElement.tagName === 'button' && width > 50 && height > 30) {
          domElement.elementType = 'search-button';
          domElement.confidence = 0.5;
          elements.push(domElement);
        }
        
        // Result cards are typically below the search area
        if (y > 200 && width > 150 && height > 100) {
          domElement.elementType = 'result-card';
          domElement.confidence = 0.4;
          elements.push(domElement);
        }
      }

    } catch (error) {
      console.error('❌ Visual layout analysis failed:', error);
    }

    return elements;
  }

  private async behavioralAnalysis(page: Page): Promise<DOMElement[]> {
    const elements: DOMElement[] = [];

    try {
      // Analyze elements based on their behavior and interactions
      const inputs = await page.$$('input');
      
      for (const input of inputs) {
        const domElement = await this.createElementFromHandle(input, 'unknown');
        
        // Test if element responds to focus
        try {
          await input.focus();
          await this.delay(100);
          
          const isFocused = await input.evaluate(el => document.activeElement === el);
          if (isFocused) {
            // Check if it shows suggestions or dropdowns
            const hasSuggestions = await page.$('.suggestions, .dropdown, .autocomplete').catch(() => null);
            
            if (hasSuggestions) {
              domElement.elementType = 'search-input';
              domElement.confidence = 0.9;
              elements.push(domElement);
            }
          }
        } catch (e) {
          continue;
        }
      }

    } catch (error) {
      console.error('❌ Behavioral analysis failed:', error);
    }

    return elements;
  }

  private async createElementFromHandle(element: ElementHandle, defaultType: string): Promise<DOMElement> {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const attributes = await element.evaluate(el => {
      const attrs: Record<string, string> = {};
      for (const attr of el.attributes) {
        attrs[attr.name] = attr.value;
      }
      return attrs;
    });
    
    const textContent = await element.evaluate(el => el.textContent?.trim() || '');
    const isVisible = await element.isIntersectingViewport();
    const boundingBox = await element.boundingBox();

    return {
      selector: await this.generateSelector(element),
      tagName,
      attributes,
      textContent,
      isVisible,
      boundingBox,
      confidence: 0.5,
      elementType: defaultType as any
    };
  }

  private async generateSelector(element: ElementHandle): Promise<string> {
    try {
      return await element.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.className) {
          const classes = el.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            return `.${classes[0]}`;
          }
        }
        return el.tagName.toLowerCase();
      });
    } catch (e) {
      return 'unknown';
    }
  }

  private isSearchInput(placeholder: string, className: string, id: string, name: string, type: string): boolean {
    // First, exclude non-search inputs
    if (this.isNonSearchInput(placeholder, className, id, name, type)) {
      return false;
    }

    const searchKeywords = [
      'search', 'جستجو', 'food', 'غذا', 'restaurant', 'رستوران', 'find', 'look',
      'جستجو کنید', 'غذا جستجو', 'رستوران جستجو', 'search food', 'search restaurant',
      'what', 'چی', 'کجا', 'where', 'menu', 'منو', 'dish', 'غذا', 'meal'
    ];
    const text = `${placeholder} ${className} ${id} ${name} ${type}`.toLowerCase();
    return searchKeywords.some(keyword => text.includes(keyword));
  }

  private isNonSearchInput(placeholder: string, className: string, id: string, name: string, type: string): boolean {
    const nonSearchKeywords = [
      // Phone number patterns
      'phone', 'mobile', 'تلفن', 'موبایل', 'شماره', 'number', 'phone number',
      'شماره موبایل', 'شماره تلفن', 'mobile number', 'phone number',
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
    
    const text = `${placeholder} ${className} ${id} ${name} ${type}`.toLowerCase();
    return nonSearchKeywords.some(keyword => text.includes(keyword));
  }

  private isLocationInput(placeholder: string, className: string, id: string, name: string, type: string): boolean {
    const locationKeywords = [
      'address', 'آدرس', 'location', 'مکان', 'select', 'انتخاب', 'place', 'مکان',
      'آدرس خود را وارد کنید', 'انتخاب آدرس', 'select address', 'choose location',
      'delivery', 'تحویل', 'city', 'شهر', 'area', 'منطقه', 'neighborhood', 'محله',
      // Additional patterns for SnappFood
      'cellphone', 'موبایل', 'phone', 'تلفن', 'شماره', 'number',
      // Generic location patterns
      'where', 'کجا', 'position', 'موقعیت', 'region', 'ناحیه'
    ];
    const text = `${placeholder} ${className} ${id} ${name} ${type}`.toLowerCase();
    return locationKeywords.some(keyword => text.includes(keyword));
  }

  private isSearchButton(textContent: string, className: string, id: string): boolean {
    const buttonKeywords = ['search', 'جستجو', 'find', 'submit', 'go', 'برو'];
    const text = `${textContent} ${className} ${id}`.toLowerCase();
    return buttonKeywords.some(keyword => text.includes(keyword));
  }

  private isResultCard(element: DOMElement): boolean {
    const cardKeywords = ['card', 'item', 'result', 'restaurant', 'food'];
    const text = `${element.attributes.class} ${element.attributes.id}`.toLowerCase();
    return cardKeywords.some(keyword => text.includes(keyword));
  }

  private isLikelySearchInput(element: DOMElement): boolean {
    // Check if it's positioned prominently (likely to be a main search input)
    if (element.boundingBox && element.boundingBox.y < 300) {
      // Check if it's wide enough to be a search input
      if (element.boundingBox.width > 200) {
        return true;
      }
    }
    
    // Check for common search input patterns in class names
    const className = element.attributes.class?.toLowerCase() || '';
    const searchPatterns = ['search', 'input', 'text', 'field', 'box'];
    return searchPatterns.some(pattern => className.includes(pattern));
  }

  private isLikelyLocationInput(element: DOMElement): boolean {
    // Check if it's positioned at the top (likely to be location input)
    if (element.boundingBox && element.boundingBox.y < 200) {
      return true;
    }
    
    // Check for common location input patterns
    const className = element.attributes.class?.toLowerCase() || '';
    const locationPatterns = ['location', 'address', 'place', 'city', 'area'];
    return locationPatterns.some(pattern => className.includes(pattern));
  }

  private deduplicateElements(elements: DOMElement[]): DOMElement[] {
    const unique = new Map<string, DOMElement>();
    
    for (const element of elements) {
      const key = `${element.tagName}-${element.attributes.id}-${element.attributes.class}`;
      if (!unique.has(key) || unique.get(key)!.confidence < element.confidence) {
        unique.set(key, element);
      }
    }
    
    return Array.from(unique.values());
  }

  private rankElements(elements: DOMElement[]): DOMElement[] {
    return elements.sort((a, b) => {
      // Sort by confidence first
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      
      // Then by visibility
      if (a.isVisible !== b.isVisible) {
        return a.isVisible ? -1 : 1;
      }
      
      // Finally by element type priority
      const typePriority = {
        'search-input': 4,
        'location-input': 3,
        'search-button': 2,
        'result-card': 1,
        'unknown': 0
      };
      
      return typePriority[b.elementType] - typePriority[a.elementType];
    });
  }

  private generateRecommendations(elements: DOMElement[]): DOMSurveyResult['recommendations'] {
    const searchInputs = elements.filter(e => e.elementType === 'search-input');
    const locationInputs = elements.filter(e => e.elementType === 'location-input');
    const searchButtons = elements.filter(e => e.elementType === 'search-button');
    const resultCards = elements.filter(e => e.elementType === 'result-card');

    return {
      searchInput: searchInputs.length > 0 ? searchInputs[0] : null,
      locationInput: locationInputs.length > 0 ? locationInputs[0] : null,
      searchButton: searchButtons.length > 0 ? searchButtons[0] : null,
      resultCards: resultCards.slice(0, 10) // Top 10 result cards
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      console.log('🔒 Closing DOM Survey Service...');
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('✅ DOM Survey Service closed');
    }
  }

  isInitialized(): boolean {
    return this.browser !== null && this.page !== null;
  }
}
