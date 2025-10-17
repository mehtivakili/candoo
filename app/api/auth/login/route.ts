import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12345';
const TOKEN_EXPIRY_HOURS = 6;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create JWT token
      const token = jwt.sign(
        { 
          username: ADMIN_USERNAME,
          loginTime: Date.now()
        },
        JWT_SECRET,
        { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
      );

      // Calculate expiry time
      const expiryTime = Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      return NextResponse.json({
        success: true,
        token,
        expiry: expiryTime,
        message: 'ورود موفقیت‌آمیز'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است'
      }, { status: 401 });
    }

  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطا در پردازش درخواست ورود'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'توکن احراز هویت یافت نشد'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      return NextResponse.json({
        success: true,
        user: {
          username: decoded.username,
          loginTime: decoded.loginTime
        }
      });
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'توکن نامعتبر یا منقضی شده'
      }, { status: 401 });
    }

  } catch (error: any) {
    console.error('❌ Token verification error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطا در بررسی توکن'
    }, { status: 500 });
  }
}

