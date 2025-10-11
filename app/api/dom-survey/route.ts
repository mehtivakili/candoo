import { NextRequest, NextResponse } from 'next/server';
import { DOMSurveyService } from '@/lib/dom-survey-service';

export async function POST(request: NextRequest) {
  try {
    const { url = 'https://snappfood.ir/' } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting DOM survey for: ${url}`);

    const surveyService = new DOMSurveyService();
    
    try {
      // Initialize the survey service
      await surveyService.initialize();
      
      // Perform the survey
      const surveyResult = await surveyService.surveyPage(url);
      
      return NextResponse.json({
        success: true,
        message: `DOM survey completed for ${url}`,
        surveyData: surveyResult
      });
      
    } catch (error) {
      console.error('❌ DOM survey error:', error);
      
      return NextResponse.json({
        success: false,
        message: `DOM survey failed: ${error}`
      });
      
    } finally {
      // Always close the survey service
      try {
        await surveyService.close();
        console.log('✅ DOM survey service closed successfully');
      } catch (closeError) {
        console.error('⚠️ Error closing DOM survey service:', closeError);
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
    message: 'DOM Survey Service API',
    endpoints: {
      POST: '/api/dom-survey - Perform DOM survey on a given URL'
    },
    description: 'This service analyzes web pages using multiple strategies to identify key elements like search inputs, location inputs, search buttons, and result cards.',
    strategies: [
      {
        name: 'Semantic Analysis',
        weight: 0.4,
        description: 'Analyzes element attributes, text content, and semantic meaning to identify element types'
      },
      {
        name: 'Attribute Pattern Matching',
        weight: 0.3,
        description: 'Uses common CSS selectors and attribute patterns to find elements'
      },
      {
        name: 'Visual Layout Analysis',
        weight: 0.2,
        description: 'Analyzes element position, size, and visual characteristics'
      },
      {
        name: 'Behavioral Analysis',
        weight: 0.1,
        description: 'Tests element behavior and interaction patterns'
      }
    ],
    elementTypes: [
      'search-input: Input fields for searching food/restaurants',
      'location-input: Input fields for selecting location/address',
      'search-button: Buttons for submitting searches',
      'result-card: Cards containing search results'
    ]
  });
}

