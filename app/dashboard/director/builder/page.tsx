"use client";

import { useState, useMemo } from "react";
import useStore, { FormField } from "@/lib/store";
import { 
  Save, Plus, X, Settings, Eye, EyeOff, 
  Hash, Camera, FileText, CheckSquare, 
  DollarSign, CreditCard, ShoppingCart, Type, 
  AlertTriangle, Trash2, Copy, Move, Package, 
  Grid3x3, List, Image as ImageIcon, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";

type TabType = 'shift' | 'sales' | 'custom';

// Default shift blocks (cannot be deleted, only enabled/disabled)
interface DefaultBlock {
  id: string;
  label: string;
  type: 'number' | 'media' | 'text' | 'confirmation';
  icon: any;
  hint: string;
  enabled: boolean;
  required: boolean;
}

// Custom field
interface CustomField {
  id: string;
  name: string;
  description?: string;
  type: 'number' | 'text' | 'checkbox' | 'photo' | 'select';
  required: boolean;
  appearsAt: 'during' | 'close';
  options?: string[]; // For select type
}

// Product card
interface Product {
  id: string;
  name: string;
  price: number;
  photo?: string;
  category: string;
  active: boolean;
}

export default function ReportConstructorPage() {
  const { formConfig, updateFormConfig } = useStore();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('shift');
  
  // Default blocks state
  const [defaultBlocks, setDefaultBlocks] = useState<DefaultBlock[]>([
    {
      id: 'cash',
      label: 'Наличные',
      type: 'number',
      icon: DollarSign,
      hint: 'Сумма наличных денег в кассе',
      enabled: true,
      required: true
    },
    {
      id: 'card',
      label: 'Терминал',
      type: 'number',
      icon: CreditCard,
      hint: 'Сумма по эквайрингу',
      enabled: true,
      required: true
    },
    {
      id: 'photo_cash',
      label: 'Фото кассы',
      type: 'media',
      icon: Camera,
      hint: 'Фотография кассового аппарата',
      enabled: false,
      required: false
    },
    {
      id: 'photo_report',
      label: 'Фото отчёта (Z-report)',
      type: 'media',
      icon: Camera,
      hint: 'Фотография Z-отчёта',
      enabled: false,
      required: false
    },
    {
      id: 'comment',
      label: 'Комментарий',
      type: 'text',
      icon: FileText,
      hint: 'Текстовый комментарий к смене',
      enabled: true,
      required: false
    },
    {
      id: 'shift_correct',
      label: 'Смена сдана корректно',
      type: 'confirmation',
      icon: CheckSquare,
      hint: 'Подтверждение корректности смены',
      enabled: true,
      required: true
    }
  ]);

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [salesInputMode, setSalesInputMode] = useState<'quick' | 'quantity'>('quick');

  const handleSave = () => {
    // Build schema from enabled default blocks
    const enabledBlocks = defaultBlocks.filter(b => b.enabled);
    const schema: FormField[] = [
      ...enabledBlocks.map(block => ({
        id: block.id,
        label: block.label,
        type: block.type === 'number' ? 'number' : 
              block.type === 'text' ? 'text_multiline' : 
              block.type === 'confirmation' ? 'checkbox' : 'text',
        required: block.required,
        placeholder: block.hint
      })),
      ...customFields.map(field => ({
        id: field.id,
        label: field.name,
        type: field.type === 'number' ? 'number' : 
              field.type === 'text' ? 'text_multiline' : 
              field.type === 'checkbox' ? 'checkbox' : 
              field.type === 'photo' ? 'text' : 'text',
        required: field.required,
        placeholder: field.description
      }))
    ];

    updateFormConfig({ 
      shiftClosingFormSchema: schema,
      // TODO: Save products and custom fields to separate config
    });
    success("Настройки сохранены. Изменения применятся к следующим сменам.");
  };

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      name: '',
      description: '',
      type: 'text',
      required: false,
      appearsAt: 'close'
    };
    setCustomFields([...customFields, newField]);
    setEditingField(newField);
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, ...updates } : f));
    if (editingField?.id === id) {
      setEditingField({ ...editingField, ...updates });
    }
  };

  const handleDeleteCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
    if (editingField?.id === id) {
      setEditingField(null);
    }
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      name: '',
      price: 0,
      category: categories[0] || 'Без категории',
      active: true
    };
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Конструктор отчёта смены
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Настройте, какие данные сотрудник обязан сдавать в конце смены
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <Save className="h-4 w-4" />
            Сохранить
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Изменения применяются ко всем новым сменам
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('shift')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === 'shift'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Смена
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === 'sales'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Продажи / Продукция
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === 'custom'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Пользовательские поля
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'shift' && (
          <motion.div
            key="shift"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ShiftTab 
              blocks={defaultBlocks}
              onUpdate={(id, updates) => {
                setDefaultBlocks(defaultBlocks.map(b => 
                  b.id === id ? { ...b, ...updates } : b
                ));
              }}
            />
          </motion.div>
        )}

        {activeTab === 'sales' && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SalesTab
              products={products}
              categories={categories}
              salesInputMode={salesInputMode}
              onProductsChange={setProducts}
              onCategoriesChange={setCategories}
              onSalesInputModeChange={setSalesInputMode}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </motion.div>
        )}

        {activeTab === 'custom' && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CustomFieldsTab
              fields={customFields}
              editingField={editingField}
              onFieldsChange={setCustomFields}
              onEditingFieldChange={setEditingField}
              onAdd={handleAddCustomField}
              onUpdate={handleUpdateCustomField}
              onDelete={handleDeleteCustomField}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// TAB 1: Shift Tab
function ShiftTab({ blocks, onUpdate }: { 
  blocks: DefaultBlock[], 
  onUpdate: (id: string, updates: Partial<DefaultBlock>) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Блоки отчёта смены
          </h2>
          <p className="text-sm text-muted-foreground">
            Эти блоки всегда доступны. Вы можете включать или выключать их, а также делать обязательными или необязательными.
          </p>
        </div>

        <div className="space-y-3">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg bg-background"
              >
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {block.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {block.hint}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Enabled Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Включено</span>
                    <button
                      onClick={() => onUpdate(block.id, { enabled: !block.enabled })}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        block.enabled ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
                          block.enabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* Required Toggle (only if enabled) */}
                  {block.enabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Обязательно</span>
                      <button
                        onClick={() => onUpdate(block.id, { required: !block.required })}
                        className={cn(
                          "relative w-11 h-6 rounded-full transition-colors",
                          block.required ? "bg-red-500" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
                            block.required ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Проблемы генерируются автоматически
              </p>
              <p className="text-xs text-muted-foreground">
                Система автоматически создаёт проблемы при отсутствии обязательных полей или расхождении сумм наличных и терминала.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// TAB 2: Sales Tab
function SalesTab({
  products,
  categories,
  salesInputMode,
  onProductsChange,
  onCategoriesChange,
  onSalesInputModeChange,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: {
  products: Product[];
  categories: string[];
  salesInputMode: 'quick' | 'quantity';
  onProductsChange: (products: Product[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onSalesInputModeChange: (mode: 'quick' | 'quantity') => void;
  onAddProduct: () => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Sales Input Mode */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Режим ввода продаж
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSalesInputModeChange('quick')}
            className={cn(
              "p-4 border-2 rounded-xl transition-all text-left",
              salesInputMode === 'quick'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <Grid3x3 className={cn(
                "h-5 w-5",
                salesInputMode === 'quick' ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="font-semibold text-foreground">Быстрый тап</span>
            </div>
            <p className="text-xs text-muted-foreground">
              +1 за каждый тап по карточке
            </p>
          </button>

          <button
            onClick={() => onSalesInputModeChange('quantity')}
            className={cn(
              "p-4 border-2 rounded-xl transition-all text-left",
              salesInputMode === 'quantity'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <List className={cn(
                "h-5 w-5",
                salesInputMode === 'quantity' ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="font-semibold text-foreground">Выбор количества</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Открывается окно выбора количества
            </p>
          </button>
        </div>
      </div>

      {/* Products Management */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Продукция
          </h2>
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Добавить продукт
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Нет добавленных продуктов
              </p>
              <p className="text-xs text-muted-foreground">
                Добавьте продукты, которые сотрудник будет отмечать во время смены
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                onUpdate={(updates) => onUpdateProduct(product.id, updates)}
                onDelete={() => onDeleteProduct(product.id)}
                onCategoriesChange={onCategoriesChange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  categories,
  onUpdate,
  onDelete,
  onCategoriesChange,
}: {
  product: Product;
  categories: string[];
  onUpdate: (updates: Partial<Product>) => void;
  onDelete: () => void;
  onCategoriesChange: (categories: string[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(!product.name);

  if (isEditing) {
    return (
      <div className="p-4 border border-border rounded-lg bg-background space-y-3">
        <input
          type="text"
          value={product.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Название продукта"
          className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Цена</label>
            <input
              type="number"
              value={product.price}
              onChange={(e) => onUpdate({ price: Number(e.target.value) })}
              placeholder="0"
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Категория</label>
            <input
              type="text"
              value={product.category}
              onChange={(e) => {
                onUpdate({ category: e.target.value });
                if (!categories.includes(e.target.value) && e.target.value) {
                  onCategoriesChange([...categories, e.target.value]);
                }
              }}
              placeholder="Категория"
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
            />
          </div>
                </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ active: !product.active })}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                product.active ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
                  product.active ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <span className="text-xs text-muted-foreground">
              {product.active ? 'Активен' : 'Неактивен'}
            </span>
            </div>
          <div className="flex items-center gap-2">
            {product.name && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Готово
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border rounded-lg bg-background flex items-center gap-4">
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
        {product.photo ? (
          <img src={product.photo} alt={product.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.price.toLocaleString('ru-RU')} ₴ • {product.category}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          product.active 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            : "bg-muted text-muted-foreground border border-border"
        )}>
          {product.active ? 'Активен' : 'Неактивен'}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// TAB 3: Custom Fields Tab
function CustomFieldsTab({
  fields,
  editingField,
  onFieldsChange,
  onEditingFieldChange,
  onAdd,
  onUpdate,
  onDelete,
}: {
  fields: CustomField[];
  editingField: CustomField | null;
  onFieldsChange: (fields: CustomField[]) => void;
  onEditingFieldChange: (field: CustomField | null) => void;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<CustomField>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header with emphasis */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Пользовательские поля
        </h2>
        <p className="text-lg font-semibold text-primary mb-2">
          Ваши поля. Под ваш бизнес.
        </p>
        <p className="text-sm text-muted-foreground">
          Создавайте любые поля для сбора специфичных данных вашего бизнеса. Эти поля не валидируются системой и существуют только для ваших нужд.
        </p>
      </div>

      {/* Add Field Button */}
      <button
        onClick={onAdd}
        className="w-full py-4 border-2 border-dashed border-border hover:border-primary/50 rounded-xl transition-colors flex items-center justify-center gap-2 text-foreground"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Добавить пользовательское поле</span>
      </button>

      {/* Fields List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Type className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Нет пользовательских полей
            </p>
            <p className="text-xs text-muted-foreground">
              Добавьте поля для сбора специфичных данных вашего бизнеса
            </p>
          </div>
        ) : (
          fields.map((field) => (
            <CustomFieldCard
              key={field.id}
              field={field}
              isEditing={editingField?.id === field.id}
              onEdit={() => onEditingFieldChange(field)}
              onUpdate={(updates) => onUpdate(field.id, updates)}
              onDelete={() => onDelete(field.id)}
            />
          ))
        )}
      </div>

      {/* Field Editor */}
      {editingField && (
        <CustomFieldEditor
          field={editingField}
          onUpdate={(updates) => onUpdate(editingField.id, updates)}
          onClose={() => onEditingFieldChange(null)}
        />
      )}
    </div>
  );
}

// Custom Field Card
function CustomFieldCard({
  field,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
}: {
  field: CustomField;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<CustomField>) => void;
  onDelete: () => void;
}) {
  const typeIcons = {
    number: Hash,
    text: FileText,
    checkbox: CheckSquare,
    photo: Camera,
    select: ChevronDown,
  };

  const typeLabels = {
    number: 'Число',
    text: 'Текст',
    checkbox: 'Чекбокс',
    photo: 'Фото',
    select: 'Выбор',
  };

  const Icon = typeIcons[field.type];

  return (
    <div
      className={cn(
        "p-4 border rounded-lg transition-all cursor-pointer",
        isEditing
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30 bg-background"
      )}
      onClick={onEdit}
    >
      <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">
              {field.name || 'Без названия'}
            </p>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
              {typeLabels[field.type]}
            </span>
            {field.required && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Обязательно
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {field.appearsAt === 'during' ? 'Во время смены' : 'При закрытии'}
            </span>
          </div>
          {field.description && (
            <p className="text-xs text-muted-foreground">
              {field.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Custom Field Editor
function CustomFieldEditor({
  field,
  onUpdate,
  onClose,
}: {
  field: CustomField;
  onUpdate: (updates: Partial<CustomField>) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Настройки поля
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Field Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Название поля <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Например: Количество испечённых круассанов"
          className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Описание / Подсказка
        </label>
        <input
          type="text"
          value={field.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Краткое описание поля"
          className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
        />
      </div>

      {/* Field Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Тип поля
        </label>
        <select
          value={field.type}
          onChange={(e) => onUpdate({ type: e.target.value as CustomField['type'] })}
          className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
        >
          <option value="number">Число</option>
          <option value="text">Текст</option>
          <option value="checkbox">Чекбокс</option>
          <option value="photo">Фото</option>
          <option value="select">Выбор (dropdown)</option>
        </select>
      </div>

      {/* Select Options */}
      {field.type === 'select' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Варианты выбора (по одному на строку)
          </label>
          <textarea
            value={field.options?.join('\n') || ''}
            onChange={(e) => onUpdate({ 
              options: e.target.value.split('\n').filter(o => o.trim()) 
            })}
            placeholder="Вариант 1&#10;Вариант 2&#10;Вариант 3"
            className="w-full h-24 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none resize-none"
          />
        </div>
      )}

      {/* Required */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Обязательное поле</p>
          <p className="text-xs text-muted-foreground">
            Сотрудник не сможет закрыть смену без заполнения
          </p>
        </div>
        <button
          onClick={() => onUpdate({ required: !field.required })}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors",
            field.required ? "bg-red-500" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
              field.required ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Appears At */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Когда появляется
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onUpdate({ appearsAt: 'during' })}
            className={cn(
              "p-3 border-2 rounded-lg transition-all text-left",
              field.appearsAt === 'during'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <p className="text-sm font-medium text-foreground">Во время смены</p>
            <p className="text-xs text-muted-foreground">Доступно сразу</p>
          </button>
          <button
            onClick={() => onUpdate({ appearsAt: 'close' })}
            className={cn(
              "p-3 border-2 rounded-lg transition-all text-left",
              field.appearsAt === 'close'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <p className="text-sm font-medium text-foreground">При закрытии</p>
            <p className="text-xs text-muted-foreground">В форме закрытия</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
