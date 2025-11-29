"use client";

import { useState, useEffect } from "react";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { ProductComponent, Ingredient } from "@/lib/store";
import { ProductComponentModal } from "@/components/dashboard/manager/product-component-modal";

const mockProducts = [
  { id: 1, name: 'Капучино', price: 60 },
  { id: 2, name: 'Капучино XL', price: 85 },
  { id: 3, name: 'Латте', price: 65 },
  { id: 4, name: 'Чизкейк', price: 120 },
  { id: 5, name: 'Кальян', price: 450 },
  { id: 6, name: 'Лимонад', price: 90 },
];

export default function ProductsComponentsPage() {
  const { currentUser } = useStore();
  const { success, error } = useToast();
  
  const [products, setProducts] = useState(mockProducts);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number | string; name: string } | null>(null);
  const [editingComponent, setEditingComponent] = useState<ProductComponent | null>(null);
  
  const companyId = currentUser?.businessId || currentUser?.id;

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем ингредиенты
      const ingResponse = await fetch(`/api/ingredients?companyId=${companyId}`);
      const ingData = await ingResponse.json();
      if (ingData.success) {
        setIngredients(ingData.ingredients.filter((ing: Ingredient) => ing.is_active));
      }

      // Загружаем компоненты для всех товаров
      const compResponse = await fetch(`/api/ingredients/product-components?companyId=${companyId}`);
      const compData = await compResponse.json();
      if (compData.success) {
        setComponents(compData.components);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const getComponentsForProduct = (productId: number | string) => {
    return components.filter(comp => 
      comp.product_id === productId || String(comp.product_id) === String(productId)
    );
  };

  const getIngredientName = (ingredientId: string) => {
    const ing = ingredients.find(i => i.id === ingredientId);
    return ing?.name || ingredientId;
  };

  const getIngredientUnit = (ingredientId: string) => {
    const ing = ingredients.find(i => i.id === ingredientId);
    return ing?.unit || 'g';
  };

  const formatUnit = (unit: string): string => {
    const units: Record<string, string> = {
      g: 'г',
      kg: 'кг',
      ml: 'мл',
      l: 'л',
      pcs: 'шт',
    };
    return units[unit] || unit;
  };

  const handleDeleteComponent = async (component: ProductComponent) => {
    if (!confirm('Удалить компонент из рецептуры?')) return;
    
    try {
      const response = await fetch(`/api/ingredients/product-components?id=${component.id}&companyId=${companyId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        success('Компонент удалён');
        loadData();
      } else {
        error('Ошибка удаления компонента');
      }
    } catch (err) {
      console.error('Error deleting component:', err);
      error('Ошибка удаления компонента');
    }
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
          <h1 className="text-3xl font-bold">Рецептурная карта</h1>
          <p className="text-muted-foreground mt-1">Состав товаров (из чего состоит каждый товар)</p>
        </div>
      </div>

      {/* Список товаров с компонентами */}
      <div className="space-y-4">
        {products.map((product) => {
          const productComponents = getComponentsForProduct(product.id);
          
          return (
            <Card key={product.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{product.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {productComponents.length === 0 
                      ? 'Нет компонентов' 
                      : `${productComponents.length} компонент${productComponents.length > 1 ? 'ов' : ''}`}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedProduct({ id: product.id, name: product.name });
                    setEditingComponent(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить компонент
                </Button>
              </div>

              {productComponents.length > 0 && (
                <div className="space-y-2">
                  {productComponents.map((component) => {
                    const ingName = getIngredientName(component.ingredient_id);
                    const ingUnit = getIngredientUnit(component.ingredient_id);
                    
                    return (
                      <div
                        key={component.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{ingName}</div>
                            <div className="text-sm text-muted-foreground">
                              {component.amount_per_unit} {formatUnit(ingUnit)} на 1 шт товара
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct({ id: product.id, name: product.name });
                              setEditingComponent(component);
                              setModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteComponent(component)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Модалка добавления/редактирования компонента */}
      {selectedProduct && (
        <ProductComponentModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProduct(null);
            setEditingComponent(null);
          }}
          onSave={() => {
            loadData();
          }}
          companyId={companyId!}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          ingredient={editingComponent || undefined}
          ingredients={ingredients}
        />
      )}
    </div>
  );
}









