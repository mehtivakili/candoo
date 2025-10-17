import { NextRequest, NextResponse } from 'next/server';
import { DataGenerator, DataGenerationOptions } from '@/lib/data-generator';

export async function GET() {
  try {
    const vendorStats = await DataGenerator.getVendorStats();
    
    return NextResponse.json({
      success: true,
      vendors: vendorStats
    });
  } catch (error) {
    console.error('❌ Error fetching vendor stats:', error);
    return NextResponse.json(
      { success: false, message: `Error fetching vendor stats: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, options }: { action: string; options?: DataGenerationOptions } = await request.json();
    
    switch (action) {
      case 'generate':
        if (!options) {
          return NextResponse.json(
            { success: false, message: 'Generation options are required' },
            { status: 400 }
          );
        }
        
        const result = await DataGenerator.generateHistoricalData(options);
        return NextResponse.json(result);
        
      case 'cleanAll':
        const cleanResult = await DataGenerator.cleanAllData();
        return NextResponse.json(cleanResult);
        
      case 'cleanTimeline':
        const timelineResult = await DataGenerator.cleanTimelineData();
        return NextResponse.json(timelineResult);
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Error in data generation API:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error}` },
      { status: 500 }
    );
  }
}
