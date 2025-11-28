import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductComponents, 
  saveProductComponent,
  deleteProductComponent 
} from '@/lib/db-ingredients';
import { ProductComponent } from '@/lib/store';

/**
 * GET /api/ingredients/product-components?companyId=xxx&productId=xxx
 * Get product components
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const productId = searchParams.get('productId');
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }
    
    const components = await getProductComponents(
      companyId, 
      productId ? (isNaN(Number(productId)) ? productId : Number(productId)) : undefined
    );
    
    return NextResponse.json({
      success: true,
      components,
    });
  } catch (error: any) {
    console.error('Error getting product components:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get product components' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingredients/product-components
 * Create a new product component
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      company_id,
      product_id,
      ingredient_id,
      amount_per_unit,
    } = body;
    
    // Validation
    if (!company_id || !product_id || !ingredient_id || amount_per_unit === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (amount_per_unit <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount_per_unit must be positive' },
        { status: 400 }
      );
    }
    
    const newComponent: ProductComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      company_id,
      product_id: typeof product_id === 'number' ? product_id : product_id,
      ingredient_id,
      amount_per_unit: Number(amount_per_unit),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await saveProductComponent(newComponent);
    
    return NextResponse.json({
      success: true,
      component: newComponent,
    });
  } catch (error: any) {
    console.error('Error creating product component:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product component' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ingredients/product-components?id=xxx&companyId=xxx
 * Delete a product component
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
    
    await deleteProductComponent(companyId, id);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting product component:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product component' },
      { status: 500 }
    );
  }
}









