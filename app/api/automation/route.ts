import { NextRequest, NextResponse } from 'next/server';
import { SnappFoodAutomation } from '@/lib/puppeteer-service';

export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();

    if (!searchTerm || typeof searchTerm !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Search term is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting SnappFood automation for: "${searchTerm}"`);

    const automation = new SnappFoodAutomation();
    
    try {
      // Initialize the browser
      await automation.initialize();
      
      // Perform the search
      const result = await automation.searchOnSnappFood(searchTerm);
      
      return NextResponse.json(result);
      
    } catch (error) {
      console.error('❌ Automation error:', error);
      
      return NextResponse.json({
        success: false,
        message: `Automation failed: ${error}`,
        screenshot: automation.isBrowserOpen() ? await automation.takeScreenshot() : undefined
      });
      
    } finally {
      // Always close the browser to prevent memory leaks
      try {
        await automation.close();
        console.log('✅ Browser closed successfully');
      } catch (closeError) {
        console.error('⚠️ Error closing browser:', closeError);
      }
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
    message: 'SnappFood Automation API',
    endpoints: {
      POST: '/api/automation - Start a search automation'
    }
  });
}