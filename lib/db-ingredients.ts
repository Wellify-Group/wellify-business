import { promises as fs } from 'fs';
import path from 'path';
import { 
  Ingredient, 
  ProductComponent, 
  IngredientStockMovement, 
  IngredientStockLevel,
  IngredientUnit,
  StockMovementType 
} from './store';
import { getLocationById } from './db';

/**
 * DATA STORAGE SYSTEM FOR INGREDIENTS
 * 
 * Files are stored as:
 * - data/ingredients/{companyId}/{ingredientId}.json
 * - data/product-components/{companyId}/{componentId}.json
 * - data/ingredient-movements/{companyId}/{pointId}/{movementId}.json
 */

const INGREDIENTS_DIR = path.join(process.cwd(), 'data', 'ingredients');
const PRODUCT_COMPONENTS_DIR = path.join(process.cwd(), 'data', 'product-components');
const MOVEMENTS_DIR = path.join(process.cwd(), 'data', 'ingredient-movements');
const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');

/**
 * Ensures a directory exists, creating it recursively if needed
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// ===== INGREDIENTS =====

/**
 * Saves an ingredient to a JSON file
 */
export async function saveIngredient(ingredient: Ingredient): Promise<void> {
  const companyDir = path.join(INGREDIENTS_DIR, ingredient.company_id);
  await ensureDirectoryExists(companyDir);
  
  const filename = `${ingredient.id}.json`;
  const filePath = path.join(companyDir, filename);
  
  const ingredientData = JSON.stringify(ingredient, null, 2);
  await fs.writeFile(filePath, ingredientData, 'utf-8');
}

/**
 * Gets all ingredients for a company
 */
export async function getIngredients(companyId: string): Promise<Ingredient[]> {
  const companyDir = path.join(INGREDIENTS_DIR, companyId);
  
  try {
    await fs.access(companyDir);
  } catch {
    return [];
  }
  
  try {
    const files = await fs.readdir(companyDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const ingredients: Ingredient[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(companyDir, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const ingredient: Ingredient = JSON.parse(fileContent);
        ingredients.push(ingredient);
      } catch (error) {
        console.error(`Error reading ingredient file ${filePath}:`, error);
        continue;
      }
    }
    
    return ingredients;
  } catch (error) {
    console.error(`Error reading ingredients directory:`, error);
    return [];
  }
}

/**
 * Gets a single ingredient by ID
 */
export async function getIngredientById(companyId: string, ingredientId: string): Promise<Ingredient | null> {
  const filePath = path.join(INGREDIENTS_DIR, companyId, `${ingredientId}.json`);
  
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as Ingredient;
  } catch {
    return null;
  }
}

/**
 * Deletes an ingredient
 */
export async function deleteIngredient(companyId: string, ingredientId: string): Promise<void> {
  const filePath = path.join(INGREDIENTS_DIR, companyId, `${ingredientId}.json`);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error deleting ingredient:`, error);
    throw error;
  }
}

// ===== PRODUCT COMPONENTS =====

/**
 * Saves a product component to a JSON file
 */
export async function saveProductComponent(component: ProductComponent): Promise<void> {
  const companyDir = path.join(PRODUCT_COMPONENTS_DIR, component.company_id);
  await ensureDirectoryExists(companyDir);
  
  const filename = `${component.id}.json`;
  const filePath = path.join(companyDir, filename);
  
  const componentData = JSON.stringify(component, null, 2);
  await fs.writeFile(filePath, componentData, 'utf-8');
}

/**
 * Gets all product components for a company
 */
export async function getProductComponents(companyId: string, productId?: string | number): Promise<ProductComponent[]> {
  const companyDir = path.join(PRODUCT_COMPONENTS_DIR, companyId);
  
  try {
    await fs.access(companyDir);
  } catch {
    return [];
  }
  
  try {
    const files = await fs.readdir(companyDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const components: ProductComponent[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(companyDir, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const component: ProductComponent = JSON.parse(fileContent);
        
        // Filter by product_id if provided
        if (!productId || component.product_id === productId || String(component.product_id) === String(productId)) {
          components.push(component);
        }
      } catch (error) {
        console.error(`Error reading component file ${filePath}:`, error);
        continue;
      }
    }
    
    return components;
  } catch (error) {
    console.error(`Error reading product components directory:`, error);
    return [];
  }
}

/**
 * Deletes a product component
 */
export async function deleteProductComponent(companyId: string, componentId: string): Promise<void> {
  const filePath = path.join(PRODUCT_COMPONENTS_DIR, companyId, `${componentId}.json`);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error deleting product component:`, error);
    throw error;
  }
}

// ===== STOCK MOVEMENTS =====

/**
 * Saves a stock movement to a JSON file
 */
export async function saveStockMovement(movement: IngredientStockMovement): Promise<void> {
  const pointDir = path.join(MOVEMENTS_DIR, movement.company_id, movement.point_id);
  await ensureDirectoryExists(pointDir);
  
  const filename = `${movement.id}.json`;
  const filePath = path.join(pointDir, filename);
  
  const movementData = JSON.stringify(movement, null, 2);
  await fs.writeFile(filePath, movementData, 'utf-8');
}

/**
 * Gets all stock movements for a point (optionally filtered by ingredient)
 */
export async function getStockMovements(
  companyId: string, 
  pointId: string, 
  ingredientId?: string
): Promise<IngredientStockMovement[]> {
  const pointDir = path.join(MOVEMENTS_DIR, companyId, pointId);
  
  try {
    await fs.access(pointDir);
  } catch {
    return [];
  }
  
  try {
    const files = await fs.readdir(pointDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const movements: IngredientStockMovement[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(pointDir, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const movement: IngredientStockMovement = JSON.parse(fileContent);
        
        // Filter by ingredient_id if provided
        if (!ingredientId || movement.ingredient_id === ingredientId) {
          movements.push(movement);
        }
      } catch (error) {
        console.error(`Error reading movement file ${filePath}:`, error);
        continue;
      }
    }
    
    // Sort by created_at descending
    return movements.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error(`Error reading stock movements directory:`, error);
    return [];
  }
}

/**
 * Calculates current stock level for an ingredient at a point
 */
export async function calculateStockLevel(
  companyId: string,
  pointId: string,
  ingredientId: string
): Promise<number> {
  const movements = await getStockMovements(companyId, pointId, ingredientId);
  
  let stock = 0;
  
  for (const movement of movements) {
    if (movement.type === 'purchase' || movement.type === 'adjustment') {
      stock += movement.quantity;
    } else if (movement.type === 'sale' || movement.type === 'writeoff') {
      stock -= movement.quantity;
    }
  }
  
  return stock;
}

/**
 * Gets stock levels for all ingredients at a point
 */
export async function getStockLevels(
  companyId: string,
  pointId: string,
  daysForAverage: number = 7
): Promise<IngredientStockLevel[]> {
  const ingredients = await getIngredients(companyId);
  const location = await getLocationById(pointId);
  
  const levels: IngredientStockLevel[] = [];
  
  for (const ingredient of ingredients) {
    if (!ingredient.is_active) continue;
    
    const currentStock = await calculateStockLevel(companyId, pointId, ingredient.id);
    
    // Calculate average daily consumption
    const movements = await getStockMovements(companyId, pointId, ingredient.id);
    const salesMovements = movements.filter(m => m.type === 'sale');
    
    if (salesMovements.length === 0) {
      levels.push({
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        point_id: pointId,
        point_name: location?.name,
        unit: ingredient.unit,
        current_stock: currentStock,
        days_left: null,
        status: 'ok',
        avg_daily_consumption: 0,
      });
      continue;
    }
    
    // Get date N days ago
    const now = new Date();
    const daysAgo = new Date(now.getTime() - daysForAverage * 24 * 60 * 60 * 1000);
    
    // Filter movements from last N days
    const recentSales = salesMovements.filter(m => {
      const movementDate = new Date(m.created_at);
      return movementDate >= daysAgo;
    });
    
    // Calculate total consumption in period
    const totalConsumption = recentSales.reduce((sum, m) => sum + m.quantity, 0);
    const daysInPeriod = Math.max(1, daysForAverage); // At least 1 day
    const avgDailyConsumption = totalConsumption / daysInPeriod;
    
    // Calculate days left
    let daysLeft: number | null = null;
    let status: 'ok' | 'low' | 'critical' = 'ok';
    
    if (avgDailyConsumption > 0) {
      daysLeft = currentStock / avgDailyConsumption;
      
      if (daysLeft <= 1) {
        status = 'critical';
      } else if (daysLeft <= 3) {
        status = 'low';
      }
    }
    
    levels.push({
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      point_id: pointId,
      point_name: location?.name,
      unit: ingredient.unit,
      current_stock: currentStock,
      days_left: daysLeft,
      status,
      avg_daily_consumption: avgDailyConsumption,
    });
  }
  
  return levels;
}

/**
 * Gets stock levels for all points in a company
 */
export async function getStockLevelsForCompany(
  companyId: string,
  pointId?: string,
  daysForAverage: number = 7
): Promise<IngredientStockLevel[]> {
  const { getLocations } = await import('./db');
  const locations = await getLocations(companyId);
  
  const allLevels: IngredientStockLevel[] = [];
  
  for (const location of locations) {
    if (pointId && location.id !== pointId) continue;
    
    const levels = await getStockLevels(companyId, location.id, daysForAverage);
    allLevels.push(...levels);
  }
  
  return allLevels;
}









