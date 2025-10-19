import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        message: 'شناسه رستوران الزامی است' 
      }, { status: 400 });
    }

    // Decode the vendor ID to handle URL encoding
    const decodedVendorId = decodeURIComponent(vendorId);
    console.log('Deleting vendor:', decodedVendorId);

    // Delete all menu items for this vendor
    const result = await query(
      `DELETE FROM menus WHERE vendor_id = $1`,
      [decodedVendorId]
    );

    console.log(`Deleted ${result.rowCount} menu items for vendor ${decodedVendorId}`);

    return NextResponse.json({
      success: true,
      message: 'تمام داده‌های رستوران با موفقیت حذف شد',
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف رستوران'
    }, { status: 500 });
  }
}
