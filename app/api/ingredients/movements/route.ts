import { NextRequest, NextResponse } from 'next/server';
import { 
  getStockMovements,
  saveStockMovement 
} from '@/lib/db-ingredients';
import { IngredientStockMovement, StockMovementType } from '@/lib/store';

export const runtime = 'edge';

/**
 * GET /api/ingredients/movements?companyId=xxx&pointId=xxx&ingredientId=xxx
 * Get stock movements
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const pointId = searchParams.get('pointId');
    const ingredientId = searchParams.get('ingredientId');
    
    if (!companyId || !pointId) {
      return NextResponse.json(
        { success: false, error: 'companyId and pointId are required' },
        { status: 400 }
      );
    }
    
    const movements = await getStockMovements(
      companyId, 
      pointId, 
      ingredientId || undefined
    );
    
    return NextResponse.json({
      success: true,
      movements,
    });
  } catch (error: any) {
    console.error('Error getting stock movements:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get stock movements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingredients/movements
 * Create a new stock movement (purchase, writeoff, adjustment)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      company_id,
      point_id,
      ingredient_id,
      type,
      quantity,
      unit,
      comment,
      created_by_user_id,
      related_order_id,
      related_shift_id,
    } = body;
    
    // Validation
    if (!company_id || !point_id || !ingredient_id || !type || quantity === undefined || !unit || !created_by_user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const validTypes: StockMovementType[] = ['purchase', 'sale', 'writeoff', 'adjustment'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movement type' },
        { status: 400 }
      );
    }
    
    if (quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'quantity must be positive' },
        { status: 400 }
      );
    }
    
    const newMovement: IngredientStockMovement = {
      id: `movement-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      company_id,
      point_id,
      ingredient_id,
      type,
      quantity: Number(quantity),
      unit,
      related_order_id: related_order_id || null,
      related_shift_id: related_shift_id || null,
      comment: comment || null,
      created_by_user_id,
      created_at: new Date().toISOString(),
    };
    
    await saveStockMovement(newMovement);
    
    return NextResponse.json({
      success: true,
      movement: newMovement,
    });
  } catch (error: any) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create stock movement' },
      { status: 500 }
    );
  }
}









