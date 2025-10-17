import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    console.log('📊 Fetching saved comparison filters...');
    
    const result = await query(`
      SELECT id, name, items, created_at, updated_at
      FROM comparison_filters
      ORDER BY updated_at DESC
    `);

    return NextResponse.json({
      success: true,
      filters: result.rows
    });

  } catch (error: any) {
    console.error('❌ Error fetching comparison filters:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch comparison filters'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, items } = await request.json();
    
    console.log('📊 Saving comparison filter:', { name, items });

    if (!name || !items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Name and items are required'
      }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO comparison_filters (name, items)
      VALUES ($1, $2)
      RETURNING id, name, items, created_at, updated_at
    `, [name, JSON.stringify(items)]);

    return NextResponse.json({
      success: true,
      filter: result.rows[0]
    });

  } catch (error: any) {
    console.error('❌ Error saving comparison filter:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save comparison filter'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, items } = await request.json();
    
    console.log('📊 Updating comparison filter:', { id, items });

    if (!id || !items) {
      return NextResponse.json({
        success: false,
        error: 'ID and items are required'
      }, { status: 400 });
    }

    const result = await query(`
      UPDATE comparison_filters 
      SET items = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, items, created_at, updated_at
    `, [JSON.stringify(items), id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Filter not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      filter: result.rows[0]
    });

  } catch (error: any) {
    console.error('❌ Error updating comparison filter:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update comparison filter'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    console.log('📊 Deleting comparison filter:', id);

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Filter ID is required'
      }, { status: 400 });
    }

    await query(`
      DELETE FROM comparison_filters
      WHERE id = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      message: 'Filter deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting comparison filter:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete comparison filter'
    }, { status: 500 });
  }
}
