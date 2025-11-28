"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Ingredient, IngredientUnit } from "@/lib/store";

interface InventoryPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  companyId: string;
  pointId: string;
  userId: string;
  ingredient?: Ingredient | null;
}

export function InventoryPurchaseModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  pointId,
  userId,
  ingredient,
}: InventoryPurchaseModalProps) {
  const { success, error } = useToast();
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadIngredients();
      if (ingredient) {
        setSelectedIngredientId(ingredient.id);
      } else {
        setSelectedIngredientId("");
      }
      setQuantity("");
      setComment("");
    }
  }, [isOpen, ingredient]);

  const loadIngredients = async () => {
    try {
      const response = await fetch(`/api/ingredients?companyId=${companyId}`);
      const data = await response.json();
      if (data.success) {
        setIngredients(data.ingredients.filter((ing: Ingredient) => ing.is_active));
      }
    } catch (err) {
      console.error("Error loading ingredients:", err);
    }
  };

  const selectedIngredient = ingredients.find(ing => ing.id === selectedIngredientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIngredientId) {
      error("Выберите ингредиент");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      error("Введите корректное количество");
      return;
    }

    if (!selectedIngredient) {
      error("Ингредиент не найден");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ingredients/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          point_id: pointId,
          ingredient_id: selectedIngredientId,
          type: "purchase",
          quantity: quantityNum,
          unit: selectedIngredient.unit,
          comment: comment.trim() || null,
          created_by_user_id: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        success("Приход добавлен");
        onSave();
        onClose();
      } else {
        error(data.error || "Ошибка добавления прихода");
      }
    } catch (err) {
      console.error("Error adding purchase:", err);
      error("Ошибка добавления прихода");
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
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить приход">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="ingredient">Ингредиент</Label>
          <select
            id="ingredient"
            value={selectedIngredientId}
            onChange={(e) => setSelectedIngredientId(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
            required
            disabled={!!ingredient}
          >
            {!ingredient && <option value="">Выберите ингредиент</option>}
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name}
              </option>
            ))}
          </select>
        </div>

        {selectedIngredient && (
          <div className="text-sm text-muted-foreground">
            Единица измерения: {formatUnit(selectedIngredient.unit)}
          </div>
        )}

        <div>
          <Label htmlFor="quantity">Количество</Label>
          <input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="comment">Комментарий (опционально)</Label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
            placeholder="Номер накладной, поставщик и т.д."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading || !selectedIngredientId}>
            {loading ? "Сохранение..." : "Добавить приход"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}









