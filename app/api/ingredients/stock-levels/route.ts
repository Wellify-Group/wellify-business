import { NextRequest, NextResponse } from 'next/server';
import { 
  getStockLevels,
  getStockLevelsForCompany 
} from '@/lib/db-ingredients';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ingredients/stock-levels?companyId=xxx&pointId=xxx&days=7
 * Get stock levels for a point or all points in company
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const pointId = searchParams.get('pointId');
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 7;
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }
    
    let levels;
    if (pointId) {
      // Get levels for specific point
      levels = await getStockLevels(companyId, pointId, days);
    } else {
      // Get levels for all points
      levels = await getStockLevelsForCompany(companyId, undefined, days);
    }
    
    return NextResponse.json({
      success: true,
      levels,
    });
  } catch (error: any) {
    console.error('Error getting stock levels:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get stock levels' },
      { status: 500 }
    );
  }
}







