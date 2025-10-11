import { NextRequest, NextResponse } from 'next/server';
import BrowserManager from '@/lib/browser-manager';

export async function POST(request: NextRequest) {
  try {
    const { vendorUrl } = await request.json();

    if (!vendorUrl || typeof vendorUrl !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Vendor URL is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Extracting vendor menu from: ${vendorUrl}`);

    const browserManager = BrowserManager.getInstance();
    
    try {
      const menuData = await browserManager.extractVendorMenu(vendorUrl);
      
      return NextResponse.json({
        success: true,
        menuData,
        message: `Successfully extracted ${menuData.totalItems} items from ${menuData.restaurant.name} (${menuData.categories.length} categories)`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Vendor menu extraction error:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('Navigation timeout')) {
          errorMessage = 'Page took too long to load. This might be due to slow internet or SnappFood blocking automated browsers. Please try again.';
        } else if (error.message.includes('Page not available')) {
          errorMessage = 'Browser page is not available. Please refresh and try again.';
        }
      }
      
      return NextResponse.json({
        success: false,
        message: `Vendor menu extraction failed: ${errorMessage}`,
        error: error instanceof Error ? error.name : 'Error',
        screenshot: browserManager.isBrowserOpen() ? await browserManager.takeScreenshot() : undefined
      }, { status: 200 }); // Return 200 so frontend can handle the error message properly
    }

  } catch (error) {
    console.error('❌ API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `API error: ${error}` 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vendor Menu Extraction API',
    description: 'Extract detailed menu data from a SnappFood vendor URL using professional DOM scraping',
    endpoints: {
      POST: '/api/vendor-menu - Extract menu data from vendor URL'
    },
    features: [
      'Extracts restaurant information (name, rating)',
      'Extracts all product categories with items',
      'Extracts detailed pricing information (original, discounted)',
      'Calculates discount percentages automatically',
      'Extracts product images',
      'Returns clean, structured JSON data',
      'Supports Persian text and RTL layout',
      'Professional-grade DOM scraping with specific selectors'
    ],
    dataStructure: {
      restaurant: {
        name: 'Restaurant name',
        rating: 'Restaurant rating',
        url: 'Restaurant URL'
      },
      categories: 'Array of category objects',
      totalItems: 'Total number of items across all categories',
      scrapedAt: 'ISO timestamp of extraction'
    },
    categoryStructure: {
      id: 'Category ID',
      name: 'Category name',
      itemCount: 'Number of items in category',
      items: 'Array of product items'
    },
    productFields: {
      name: 'Product name',
      description: 'Product description',
      pricing: {
        originalPrice: 'Original price (number)',
        finalPrice: 'Discounted/final price (number)',
        discount: 'Discount percentage string (e.g., "5%")',
        hasDiscount: 'Boolean indicating if product has discount'
      },
      imageUrl: 'Product image URL'
    }
  });
}

