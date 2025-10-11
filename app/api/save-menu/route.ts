/**
 * API Route: Save Menu Items to Database
 * 
 * POST /api/save-menu
 * 
 * Saves menu items from a vendor to the PostgreSQL database
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertMenuItems, testConnection, MenuItem } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received save menu request');
    
    // Parse request body
    const body = await request.json();
    const { menuData } = body;
    
    if (!menuData) {
      return NextResponse.json({
        success: false,
        error: 'Menu data is required'
      }, { status: 400 });
    }
    
    // Validate menuData structure
    if (!menuData.restaurant || !menuData.categories) {
      return NextResponse.json({
        success: false,
        error: 'Invalid menu data structure'
      }, { status: 400 });
    }
    
    console.log('🔍 Testing database connection...');
    
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed. Please check your PostgreSQL server.'
      }, { status: 500 });
    }
    
    console.log('✅ Database connected, preparing items...');
    
    // Prepare menu items for database insertion
    const items: MenuItem[] = [];
    
    menuData.categories.forEach((category: any) => {
      category.items.forEach((item: any) => {
        items.push({
          article_id: item.name || 'Unknown Product',
          vendor_id: menuData.restaurant.url,
          vendor_name: menuData.restaurant.name,
          group: category.name,
          price: item.pricing?.finalPrice || null,
          original_price: item.pricing?.originalPrice || null,
          discount: item.pricing?.discount || null,
          item_count: 1,
          description: item.description || null,
          image_url: item.imageUrl || null,
          has_discount: item.pricing?.hasDiscount || false
        });
      });
    });
    
    console.log(`📊 Prepared ${items.length} items for insertion`);
    
    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items to save'
      }, { status: 400 });
    }
    
    // Insert items into database
    const insertedCount = await upsertMenuItems(items);
    
    console.log(`✅ Successfully saved ${insertedCount} items`);
    
    return NextResponse.json({
      success: true,
      message: `${insertedCount} آیتم با موفقیت ذخیره شد`,
      data: {
        insertedCount,
        vendorName: menuData.restaurant.name,
        categoriesCount: menuData.categories.length,
        totalItems: items.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error saving menu to database:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save menu items',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Test endpoint to check database connection
export async function GET(request: NextRequest) {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        database: 'candoo'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

