import { NextRequest, NextResponse } from 'next/server';
import { 
  getIngredients, 
  saveIngredient, 
  deleteIngredient,
  getIngredientById 
} from '@/lib/db-ingredients';
import { Ingredient, IngredientUnit } from '@/lib/store';

export const runtime = 'edge';

/**
 * GET /api/ingredients?companyId=xxx
 * Get all ingredients for a company
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }
    
    const ingredients = await getIngredients(companyId);
    
    return NextResponse.json({
      success: true,
      ingredients,
    });
  } catch (error: any) {
    console.error('Error getting ingredients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get ingredients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingredients
 * Create a new ingredient
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      company_id,
      name,
      unit,
      is_active = true,
    } = body;
    
    // Validation
    if (!company_id || !name || !unit) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const validUnits: IngredientUnit[] = ['g', 'ml', 'pcs', 'kg', 'l'];
    if (!validUnits.includes(unit)) {
      return NextResponse.json(
        { success: false, error: 'Invalid unit' },
        { status: 400 }
      );
    }
    
    const newIngredient: Ingredient = {
      id: `ingredient-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      company_id,
      name: name.trim(),
      unit,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await saveIngredient(newIngredient);
    
    return NextResponse.json({
      success: true,
      ingredient: newIngredient,
    });
  } catch (error: any) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ingredient' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ingredients
 * Update an existing ingredient
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      company_id,
      name,
      unit,
      is_active,
    } = body;
    
    if (!id || !company_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id and company_id' },
        { status: 400 }
      );
    }
    
    const existing = await getIngredientById(company_id, id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Ingredient not found' },
        { status: 404 }
      );
    }
    
    const updatedIngredient: Ingredient = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      unit: unit !== undefined ? unit : existing.unit,
      is_active: is_active !== undefined ? is_active : existing.is_active,
      updated_at: new Date().toISOString(),
    };
    
    if (unit) {
      const validUnits: IngredientUnit[] = ['g', 'ml', 'pcs', 'kg', 'l'];
      if (!validUnits.includes(unit)) {
        return NextResponse.json(
          { success: false, error: 'Invalid unit' },
          { status: 400 }
        );
      }
    }
    
    await saveIngredient(updatedIngredient);
    
    return NextResponse.json({
      success: true,
      ingredient: updatedIngredient,
    });
  } catch (error: any) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ingredient' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ingredients?id=xxx&companyId=xxx
 * Delete an ingredient
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const companyId = searchParams.get('companyId');
    
    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'id and companyId are required' },
        { status: 400 }
      );
    }
    
    await deleteIngredient(companyId, id);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete ingredient' },
      { status: 500 }
    );
  }
}









