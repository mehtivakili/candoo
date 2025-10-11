import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

interface MenuFilter {
  id?: number;
  name: string;
  from_date?: string | null;
  to_date?: string | null;
  vendor?: string | null;
  category?: string | null;
  item?: string | null;
  created_at?: string;
}

// GET - Fetch all filters
export async function GET() {
  try {
    const result = await query<MenuFilter>(`
      SELECT id, name, from_date, to_date, vendor, category, item, created_at
      FROM menu_filters
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      filters: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching filters:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new filter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, from_date, to_date, vendor, category, item } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Filter name is required'
        },
        { status: 400 }
      );
    }

    const result = await query<MenuFilter>(`
      INSERT INTO menu_filters (name, from_date, to_date, vendor, category, item)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      name,
      from_date || null,
      to_date || null,
      vendor === 'all' ? null : vendor,
      category === 'all' ? null : category,
      item === 'all' ? null : item
    ]);

    return NextResponse.json({
      success: true,
      filter: result.rows[0],
      message: 'فیلتر با موفقیت ذخیره شد'
    });

  } catch (error) {
    console.error('❌ Error creating filter:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove filter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Filter ID is required'
        },
        { status: 400 }
      );
    }

    await query(`
      DELETE FROM menu_filters WHERE id = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      message: 'فیلتر حذف شد'
    });

  } catch (error) {
    console.error('❌ Error deleting filter:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

