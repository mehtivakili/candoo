import { NextRequest, NextResponse } from 'next/server';
import BrowserManager from '@/lib/browser-manager';

export async function POST(request: NextRequest) {
  try {
    const { searchTerm, searchType = 'products', useSurvey = true, surveyUrl = 'https://snappfood.ir/' } = await request.json();

    if (!searchTerm || typeof searchTerm !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Search term is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting sophisticated SnappFood automation for: "${searchTerm}"`);
    console.log(`🔍 Search type: ${searchType}`);
    console.log(`🔍 Using DOM survey: ${useSurvey ? 'Yes' : 'No'}`);

    const browserManager = BrowserManager.getInstance();
    
    try {
      let result;
      
      if (searchType === 'vendors') {
        // Search for vendors using sophisticated method
        const vendors = await browserManager.searchVendors(searchTerm, {
          useSurvey,
          surveyUrl,
          maxRetries: 3,
          timeout: 30000,
          waitForResults: 5000
        });

        result = {
          success: true,
          vendors,
          message: `Found ${vendors.length} vendors for "${searchTerm}" using sophisticated method`,
          searchType: 'vendors',
          timestamp: new Date().toISOString()
        };
      } else {
        // Search for products using sophisticated method
        const searchResult = await browserManager.searchProducts(searchTerm, {
          useSurvey,
          surveyUrl,
          maxRetries: 3,
          timeout: 30000,
          waitForResults: 5000
        });

        result = {
          ...searchResult,
          searchType: 'products'
        };
      }
      
      return NextResponse.json(result);
      
    } catch (error) {
      console.error('❌ Sophisticated automation error:', error);
      
      return NextResponse.json({
        success: false,
        message: `Sophisticated automation failed: ${error}`,
        screenshot: browserManager.isBrowserOpen() ? await browserManager.takeScreenshot() : undefined,
        surveyData: browserManager.getSurveyData() || undefined,
        searchType: searchType
      });
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
  const browserManager = BrowserManager.getInstance();
  
  return NextResponse.json({
    message: 'SnappFood Search API',
    browserStatus: {
      isOpen: browserManager.isBrowserOpen(),
      sessionId: browserManager.getSessionId()
    },
    endpoints: {
      POST: '/api/sophisticated-automation - Search for products or vendors',
      DELETE: '/api/sophisticated-automation - Close the browser instance'
    },
    features: [
      'Direct URL navigation for faster searches',
      'Product search: https://snappfood.ir/products/?query=',
      'Vendor search: https://snappfood.ir/search/?query= + click "مشاهده همه فروشندگان"',
      'Persistent browser sessions',
      'Comprehensive result extraction',
      'Persian text support'
    ],
    searchTypes: {
      products: 'Search for food products and dishes',
      vendors: 'Search for restaurants and vendors'
    }
  });
}

export async function DELETE() {
  try {
    const browserManager = BrowserManager.getInstance();
    await browserManager.forceCloseIfNeeded();
    
    return NextResponse.json({
      success: true,
      message: 'Browser instances cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error cleaning up browsers:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to clean up browsers: ${error}` 
      },
      { status: 500 }
    );
  }
}

