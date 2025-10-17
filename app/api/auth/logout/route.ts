import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success since the client will remove the token
    
    return NextResponse.json({
      success: true,
      message: 'خروج موفقیت‌آمیز'
    });

  } catch (error: any) {
    console.error('❌ Logout error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطا در خروج'
    }, { status: 500 });
  }
}

