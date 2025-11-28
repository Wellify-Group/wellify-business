"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Ingredient, IngredientUnit } from "@/lib/store";

interface InventoryIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  companyId: string;
  ingredient?: Ingredient | null;
}

export function InventoryIngredientModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  ingredient,
}: InventoryIngredientModalProps) {
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<IngredientUnit>("g");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setUnit(ingredient.unit);
      setIsActive(ingredient.is_active);
    } else {
      setName("");
      setUnit("g");
      setIsActive(true);
    }
  }, [ingredient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      error("Введите название ингредиента");
      return;
    }

    setLoading(true);

    try {
      const url = ingredient ? "/api/ingredients" : "/api/ingredients";
      const method = ingredient ? "PUT" : "POST";
      
      const body: any = {
        company_id: companyId,
        name: name.trim(),
        unit,
        is_active: isActive,
      };

      if (ingredient) {
        body.id = ingredient.id;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        success(ingredient ? "Ингредиент обновлён" : "Ингредиент добавлен");
        onSave();
        onClose();
      } else {
        error(data.error || "Ошибка сохранения");
      }
    } catch (err) {
      console.error("Error saving ingredient:", err);
      error("Ошибка сохранения ингредиента");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ingredient ? "Редактировать ингредиент" : "Добавить ингредиент"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Название</Label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
            placeholder="Например: Зерно кофе Lavazza"
            required
          />
        </div>

        <div>
          <Label htmlFor="unit">Единица измерения</Label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as IngredientUnit)}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="g">Граммы (г)</option>
            <option value="kg">Килограммы (кг)</option>
            <option value="ml">Миллилитры (мл)</option>
            <option value="l">Литры (л)</option>
            <option value="pcs">Штуки (шт)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="isActive">Активен</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Сохранение..." : ingredient ? "Сохранить" : "Добавить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}









