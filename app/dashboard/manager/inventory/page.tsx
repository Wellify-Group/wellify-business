"use client";

import { useState, useEffect } from "react";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Package, 
  TrendingDown, 
  AlertTriangle,
  Edit,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Ingredient, IngredientStockLevel, IngredientUnit } from "@/lib/store";
import { InventoryIngredientModal } from "@/components/dashboard/manager/inventory-ingredient-modal";
import { InventoryPurchaseModal } from "@/components/dashboard/manager/inventory-purchase-modal";
import { InventoryStockLevels } from "@/components/dashboard/manager/inventory-stock-levels";

export default function ManagerInventoryPage() {
  const { currentUser, savedLocationId, locations } = useStore();
  const { success, error } = useToast();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stockLevels, setStockLevels] = useState<IngredientStockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  
  const companyId = currentUser?.businessId || currentUser?.id;
  const pointId = savedLocationId || locations[0]?.id;

  useEffect(() => {
    if (companyId) {
      loadIngredients();
      if (pointId) {
        loadStockLevels();
      }
    }
  }, [companyId, pointId]);

  const loadIngredients = async () => {
    if (!companyId) return;
    
    try {
      const response = await fetch(`/api/ingredients?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setIngredients(data.ingredients);
      } else {
        error('Ошибка загрузки ингредиентов');
      }
    } catch (err) {
      console.error('Error loading ingredients:', err);
      error('Ошибка загрузки ингредиентов');
    } finally {
      setLoading(false);
    }
  };

  const loadStockLevels = async () => {
    if (!companyId || !pointId) return;
    
    try {
      const response = await fetch(`/api/ingredients/stock-levels?companyId=${companyId}&pointId=${pointId}`);
      const data = await response.json();
      
      if (data.success) {
        setStockLevels(data.levels);
      }
    } catch (err) {
      console.error('Error loading stock levels:', err);
    }
  };

  const handleDeleteIngredient = async (ingredient: Ingredient) => {
    if (!confirm(`Удалить ингредиент "${ingredient.name}"?`)) return;
    
    try {
      const response = await fetch(`/api/ingredients?id=${ingredient.id}&companyId=${companyId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        success('Ингредиент удалён');
        loadIngredients();
        loadStockLevels();
      } else {
        error('Ошибка удаления ингредиента');
      }
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      error('Ошибка удаления ингредиента');
    }
  };

  const getStockForIngredient = (ingredientId: string): IngredientStockLevel | undefined => {
    return stockLevels.find(level => level.ingredient_id === ingredientId);
  };

  const formatUnit = (unit: IngredientUnit): string => {
    const units: Record<IngredientUnit, string> = {
      g: 'г',
      kg: 'кг',
      ml: 'мл',
      l: 'л',
      pcs: 'шт',
    };
    return units[unit] || unit;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление складом</h1>
          <p className="text-muted-foreground mt-1">Ингредиенты и приходы</p>
        </div>
        <Button 
          onClick={() => {
            setEditingIngredient(null);
            setIngredientModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить ингредиент
        </Button>
      </div>

      {/* Таблица ингредиентов */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Название</th>
                <th className="text-left p-3">Ед. измерения</th>
                <th className="text-left p-3">Остаток</th>
                <th className="text-left p-3">Статус</th>
                <th className="text-right p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {ingredients
                .filter(ing => ing.is_active)
                .map((ingredient) => {
                  const stock = getStockForIngredient(ingredient.id);
                  const currentStock = stock?.current_stock ?? 0;
                  const status = stock?.status ?? 'ok';
                  
                  return (
                    <tr key={ingredient.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{ingredient.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {formatUnit(ingredient.unit)}
                      </td>
                      <td className="p-3">
                        {currentStock.toFixed(2)} {formatUnit(ingredient.unit)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            status === 'critical'
                              ? 'error'
                              : status === 'low'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {status === 'critical'
                            ? 'Критично'
                            : status === 'low'
                            ? 'Мало'
                            : 'ОК'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIngredient(ingredient);
                              setPurchaseModalOpen(true);
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Приход
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingIngredient(ingredient);
                              setIngredientModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteIngredient(ingredient)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {ingredients.filter(ing => ing.is_active).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Нет ингредиентов. Добавьте первый ингредиент.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Дашборд остатков */}
      {pointId && (
        <InventoryStockLevels 
          companyId={companyId!} 
          pointId={pointId} 
        />
      )}

      {/* Модалка добавления/редактирования ингредиента */}
      <InventoryIngredientModal
        isOpen={ingredientModalOpen}
        onClose={() => {
          setIngredientModalOpen(false);
          setEditingIngredient(null);
        }}
        onSave={() => {
          loadIngredients();
          loadStockLevels();
        }}
        companyId={companyId!}
        ingredient={editingIngredient}
      />

      {/* Модалка добавления прихода */}
      <InventoryPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => {
          setPurchaseModalOpen(false);
          setSelectedIngredient(null);
        }}
        onSave={() => {
          loadStockLevels();
        }}
        companyId={companyId!}
        pointId={pointId!}
        ingredient={selectedIngredient}
        userId={currentUser?.id || ''}
      />
    </div>
  );
}







