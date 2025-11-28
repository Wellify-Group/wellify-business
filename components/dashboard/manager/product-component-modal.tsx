"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { ProductComponent, Ingredient, IngredientUnit } from "@/lib/store";

interface ProductComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  companyId: string;
  productId: number | string;
  productName: string;
  ingredient?: ProductComponent;
  ingredients: Ingredient[];
}

export function ProductComponentModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  productId,
  productName,
  ingredient,
  ingredients,
}: ProductComponentModalProps) {
  const { success, error } = useToast();
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [amountPerUnit, setAmountPerUnit] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ingredient) {
      setSelectedIngredientId(ingredient.ingredient_id);
      setAmountPerUnit(ingredient.amount_per_unit.toString());
    } else {
      setSelectedIngredientId("");
      setAmountPerUnit("");
    }
  }, [ingredient, isOpen]);

  const selectedIngredient = ingredients.find(ing => ing.id === selectedIngredientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIngredientId) {
      error("Выберите ингредиент");
      return;
    }

    const amount = parseFloat(amountPerUnit);
    if (isNaN(amount) || amount <= 0) {
      error("Введите корректное количество");
      return;
    }

    setLoading(true);

    try {
      if (ingredient) {
        // Обновление существующего компонента - нужно удалить старый и создать новый
        // (или можно добавить PUT endpoint, но для простоты делаем так)
        await fetch(`/api/ingredients/product-components?id=${ingredient.id}&companyId=${companyId}`, {
          method: 'DELETE',
        });
      }

      const response = await fetch("/api/ingredients/product-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          product_id: productId,
          ingredient_id: selectedIngredientId,
          amount_per_unit: amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        success(ingredient ? "Компонент обновлён" : "Компонент добавлен");
        onSave();
        onClose();
      } else {
        error(data.error || "Ошибка сохранения");
      }
    } catch (err) {
      console.error("Error saving product component:", err);
      error("Ошибка сохранения компонента");
    } finally {
      setLoading(false);
    }
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={ingredient ? "Редактировать компонент" : "Добавить компонент"}
    >
      <div className="mb-4 text-sm text-muted-foreground">
        Товар: <strong>{productName}</strong>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="ingredient">Ингредиент</Label>
          <select
            id="ingredient"
            value={selectedIngredientId}
            onChange={(e) => setSelectedIngredientId(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
            required
          >
            <option value="">Выберите ингредиент</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({formatUnit(ing.unit)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="amount">
            Количество на 1 единицу товара
            {selectedIngredient && ` (в ${formatUnit(selectedIngredient.unit)})`}
          </Label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amountPerUnit}
            onChange={(e) => setAmountPerUnit(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
            placeholder="0.00"
            required
          />
          <div className="text-xs text-muted-foreground mt-1">
            Например: для Капучино может быть 12 г кофе на 1 шт
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading || !selectedIngredientId}>
            {loading ? "Сохранение..." : ingredient ? "Сохранить" : "Добавить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}









