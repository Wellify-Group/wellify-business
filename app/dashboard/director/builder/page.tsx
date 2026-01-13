"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import useStore, { FormField } from "@/lib/store";
import { 
  Save, Plus, X, Settings, Eye, EyeOff, GripVertical,
  Hash, Camera, FileText, CheckSquare, 
  DollarSign, CreditCard, ShoppingCart, Type, 
  AlertTriangle, Trash2, Package, Grid3x3, 
  TrendingUp, BarChart3, User, Monitor, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";

type TabType = 'constructor' | 'products' | 'inventory';
type PreviewMode = 'employee' | 'director';

// Block types
type BlockType = 'cash' | 'terminal' | 'photo_cash' | 'photo_report' | 'comment' | 'confirmation' | 
                 'sales_grid' | 'sales_total' | 'top_products' | 
                 'custom_text' | 'custom_number' | 'custom_photo' | 'custom_checkbox' | 'custom_select';

interface ReportBlock {
  id: string;
  type: BlockType;
  title: string;
  required: boolean;
  hint?: string;
  problemTrigger: boolean;
  problemMessage?: string;
  // Custom field specific
  options?: string[]; // For select
  // Position in canvas
  order: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  photo?: string;
  category: string;
  sku?: string;
  inventoryLinked: boolean;
  inventoryItemId?: string;
  active: boolean;
}

// Block library definitions
const BLOCK_LIBRARY = {
  core: [
    { type: 'cash' as BlockType, label: 'Наличные', icon: DollarSign, category: 'core' },
    { type: 'terminal' as BlockType, label: 'Терминал', icon: CreditCard, category: 'core' },
    { type: 'photo_cash' as BlockType, label: 'Фото кассы', icon: Camera, category: 'core' },
    { type: 'photo_report' as BlockType, label: 'Фото отчёта', icon: Camera, category: 'core' },
    { type: 'comment' as BlockType, label: 'Комментарий', icon: FileText, category: 'core' },
    { type: 'confirmation' as BlockType, label: 'Подтверждение', icon: CheckSquare, category: 'core' },
  ],
  sales: [
    { type: 'sales_grid' as BlockType, label: 'Сетка продаж', icon: Grid3x3, category: 'sales' },
    { type: 'sales_total' as BlockType, label: 'Итого продаж', icon: TrendingUp, category: 'sales' },
    { type: 'top_products' as BlockType, label: 'Топ продуктов', icon: BarChart3, category: 'sales' },
  ],
  custom: [
    { type: 'custom_text' as BlockType, label: 'Текст', icon: Type, category: 'custom' },
    { type: 'custom_number' as BlockType, label: 'Число', icon: Hash, category: 'custom' },
    { type: 'custom_photo' as BlockType, label: 'Фото', icon: Camera, category: 'custom' },
    { type: 'custom_checkbox' as BlockType, label: 'Чекбокс', icon: CheckSquare, category: 'custom' },
    { type: 'custom_select' as BlockType, label: 'Выбор', icon: ShoppingCart, category: 'custom' },
  ]
};

export default function ReportConstructorPage() {
  const { formConfig, updateFormConfig } = useStore();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('constructor');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('employee');
  const [canvasBlocks, setCanvasBlocks] = useState<ReportBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<{ type: BlockType; source: 'library' | 'canvas' } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const selectedBlockData = useMemo(() => {
    return canvasBlocks.find(b => b.id === selectedBlock);
  }, [canvasBlocks, selectedBlock]);

  // Handle drag start from library
  const handleLibraryDragStart = (e: React.DragEvent, blockType: BlockType) => {
    setDraggedBlock({ type: blockType, source: 'library' });
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drag start from canvas
  const handleCanvasDragStart = (e: React.DragEvent, blockId: string) => {
    const block = canvasBlocks.find(b => b.id === blockId);
    if (block) {
      setDraggedBlock({ type: block.type, source: 'canvas' });
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    if (!draggedBlock) return;

    if (draggedBlock.source === 'library') {
      // Add new block
      const libraryBlock = Object.values(BLOCK_LIBRARY)
        .flat()
        .find(b => b.type === draggedBlock.type);
      
      if (libraryBlock) {
        const newBlock: ReportBlock = {
          id: `block_${Date.now()}`,
          type: draggedBlock.type,
          title: libraryBlock.label,
          required: draggedBlock.type === 'cash' || draggedBlock.type === 'terminal',
          hint: '',
          problemTrigger: false,
          order: dropIndex !== undefined ? dropIndex : canvasBlocks.length,
        };
        
        // Adjust orders
        const updatedBlocks = [...canvasBlocks];
        if (dropIndex !== undefined) {
          updatedBlocks.forEach(b => {
            if (b.order >= dropIndex) b.order += 1;
          });
        }
        updatedBlocks.push(newBlock);
        setCanvasBlocks(updatedBlocks.sort((a, b) => a.order - b.order));
        setSelectedBlock(newBlock.id);
      }
    } else if (draggedBlock.source === 'canvas') {
      // Reorder existing block
      const draggedBlockId = canvasBlocks.find(b => b.type === draggedBlock.type)?.id;
      if (draggedBlockId && dropIndex !== undefined) {
        const updatedBlocks = canvasBlocks.map(b => ({ ...b }));
        const draggedBlockIndex = updatedBlocks.findIndex(b => b.id === draggedBlockId);
        if (draggedBlockIndex === -1) return;
        
        const draggedBlock = updatedBlocks[draggedBlockIndex];
        updatedBlocks.splice(draggedBlockIndex, 1);
        
        updatedBlocks.forEach(b => {
          if (b.order >= dropIndex!) b.order += 1;
        });
        draggedBlock.order = dropIndex;
        updatedBlocks.push(draggedBlock);
        
        setCanvasBlocks(updatedBlocks.sort((a, b) => a.order - b.order));
      }
    }

    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedBlock?.source === 'library' ? 'copy' : 'move';
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ReportBlock>) => {
    setCanvasBlocks(canvasBlocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    ));
  };

  const handleDeleteBlock = (blockId: string) => {
    const block = canvasBlocks.find(b => b.id === blockId);
    if (block) {
      const updatedBlocks = canvasBlocks
        .filter(b => b.id !== blockId)
        .map(b => {
          if (b.order > block.order) {
            return { ...b, order: b.order - 1 };
          }
          return b;
        });
      setCanvasBlocks(updatedBlocks);
      if (selectedBlock === blockId) {
        setSelectedBlock(null);
      }
    }
  };

  const handleSave = () => {
    const schema: FormField[] = canvasBlocks
      .sort((a, b) => a.order - b.order)
      .map(block => {
        let fieldType: 'number' | 'text' | 'text_multiline' | 'checkbox' = 'text';
        if (block.type === 'cash' || block.type === 'terminal' || block.type === 'custom_number') {
          fieldType = 'number';
        } else if (block.type === 'comment' || block.type === 'custom_text') {
          fieldType = 'text_multiline';
        } else if (block.type === 'confirmation' || block.type === 'custom_checkbox') {
          fieldType = 'checkbox';
        }
        
        return {
          id: block.id,
          label: block.title,
          type: fieldType,
          required: block.required,
          placeholder: block.hint
        };
      });

    updateFormConfig({ shiftClosingFormSchema: schema });
    success("Отчёт сохранён. Изменения применятся к следующим сменам.");
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
              Перетащите блоки из библиотеки на canvas для создания отчёта
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('employee')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  previewMode === 'employee'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="h-4 w-4" />
                Сотрудник
              </button>
              <button
                onClick={() => setPreviewMode('director')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  previewMode === 'director'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="h-4 w-4" />
                Директор
              </button>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('constructor')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === 'constructor'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Конструктор
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === 'products'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Продукция
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === 'inventory'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Склад
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'constructor' && (
          <motion.div
            key="constructor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* LEFT: Component Library */}
            <div className="lg:col-span-1 space-y-6">
              <ComponentLibrary onDragStart={handleLibraryDragStart} />
            </div>

            {/* RIGHT: Canvas Preview */}
            <div className="lg:col-span-2 space-y-6">
              <CanvasPreview
                blocks={canvasBlocks}
                previewMode={previewMode}
                selectedBlock={selectedBlock}
                dragOverIndex={dragOverIndex}
                onBlockSelect={setSelectedBlock}
                onBlockDelete={handleDeleteBlock}
                onCanvasDrop={handleCanvasDrop}
                onDragOver={handleDragOver}
                onCanvasDragStart={handleCanvasDragStart}
              />

              {/* Block Settings */}
              {selectedBlockData && (
                <BlockSettingsPanel
                  block={selectedBlockData}
                  onUpdate={(updates) => handleUpdateBlock(selectedBlockData.id, updates)}
                  onClose={() => setSelectedBlock(null)}
                />
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ProductsTab
              products={products}
              categories={categories}
              editingProduct={editingProduct}
              onProductsChange={setProducts}
              onCategoriesChange={setCategories}
              onEditingProductChange={setEditingProduct}
            />
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Управление складом
              </h3>
              <p className="text-sm text-muted-foreground">
                Склад управляется отдельно от конструктора отчёта
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component Library
function ComponentLibrary({ onDragStart }: { onDragStart: (e: React.DragEvent, type: BlockType) => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Библиотека блоков</h2>
      
      {/* Core Blocks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Основные блоки
        </h3>
        <div className="space-y-2">
          {BLOCK_LIBRARY.core.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.type}
                draggable
                onDragStart={(e) => onDragStart(e, block.type)}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-move hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">{block.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales Blocks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Продажи
        </h3>
        <div className="space-y-2">
          {BLOCK_LIBRARY.sales.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.type}
                draggable
                onDragStart={(e) => onDragStart(e, block.type)}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-move hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">{block.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Blocks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Пользовательские поля
        </h3>
        <div className="space-y-2">
          {BLOCK_LIBRARY.custom.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.type}
                draggable
                onDragStart={(e) => onDragStart(e, block.type)}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-move hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">{block.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Canvas Preview
function CanvasPreview({
  blocks,
  previewMode,
  selectedBlock,
  dragOverIndex,
  onBlockSelect,
  onBlockDelete,
  onCanvasDrop,
  onDragOver,
  onCanvasDragStart,
}: {
  blocks: ReportBlock[];
  previewMode: PreviewMode;
  selectedBlock: string | null;
  dragOverIndex: number | null;
  onBlockSelect: (id: string) => void;
  onBlockDelete: (id: string) => void;
  onCanvasDrop: (e: React.DragEvent, index?: number) => void;
  onDragOver: (e: React.DragEvent, index?: number) => void;
  onCanvasDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const getBlockIcon = (type: BlockType) => {
    const allBlocks = Object.values(BLOCK_LIBRARY).flat();
    const block = allBlocks.find(b => b.type === type);
    return block?.icon || FileText;
  };

  const getBlockLabel = (type: BlockType) => {
    const allBlocks = Object.values(BLOCK_LIBRARY).flat();
    const block = allBlocks.find(b => b.type === type);
    return block?.label || 'Блок';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Предпросмотр отчёта ({previewMode === 'employee' ? 'Сотрудник' : 'Директор'})
        </h2>
        {blocks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Перетащите блоки сюда
          </p>
        )}
      </div>

      <div
        onDrop={(e) => onCanvasDrop(e)}
        onDragOver={(e) => onDragOver(e)}
        className={cn(
          "min-h-[400px] space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors",
          blocks.length === 0
            ? "border-border bg-muted/20"
            : "border-transparent"
        )}
      >
        {sortedBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Canvas пуст
            </p>
            <p className="text-xs text-muted-foreground">
              Перетащите блоки из библиотеки слева
            </p>
          </div>
        ) : (
          sortedBlocks.map((block, index) => {
            const Icon = getBlockIcon(block.type);
            const isSelected = selectedBlock === block.id;
            const isDragOver = dragOverIndex === index;

            return (
              <div key={block.id}>
                {/* Drop zone before block */}
                <div
                  onDrop={(e) => onCanvasDrop(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  className={cn(
                    "h-2 -mb-1 transition-colors",
                    isDragOver && "bg-primary/20 border-t-2 border-primary"
                  )}
                />
                
                {/* Block */}
                <motion.div
                  draggable
                  onDragStart={(e) => onCanvasDragStart(e, block.id)}
                  onClick={() => onBlockSelect(block.id)}
                  className={cn(
                    "group relative p-4 border rounded-lg cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/30 bg-background"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5 cursor-move" />
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          {block.title}
                        </p>
                        {block.required && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Обязательно
                          </span>
                        )}
                        {block.problemTrigger && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                            Проблема
                          </span>
                        )}
                      </div>
                      {block.hint && (
                        <p className="text-xs text-muted-foreground">
                          {block.hint}
                        </p>
                      )}
                      {/* Preview content based on mode */}
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                        {previewMode === 'employee' ? (
                          <BlockEmployeePreview block={block} />
                        ) : (
                          <BlockDirectorPreview block={block} />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockDelete(block.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-destructive rounded transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        
        {/* Drop zone at the end */}
        {sortedBlocks.length > 0 && (
          <div
            onDrop={(e) => onCanvasDrop(e, sortedBlocks.length)}
            onDragOver={(e) => onDragOver(e, sortedBlocks.length)}
            className={cn(
              "h-2 transition-colors",
              dragOverIndex === sortedBlocks.length && "bg-primary/20 border-t-2 border-primary"
            )}
            />
        )}
      </div>
    </div>
  );
}

// Block Employee Preview
function BlockEmployeePreview({ block }: { block: ReportBlock }) {
  if (block.type === 'cash' || block.type === 'terminal' || block.type === 'custom_number') {
    return (
      <input
        type="number"
        placeholder={block.hint || "0"}
        disabled
        className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50"
      />
    );
  }
  if (block.type === 'comment' || block.type === 'custom_text') {
    return (
      <textarea
        placeholder={block.hint || "Введите текст..."}
        disabled
        className="w-full h-20 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 resize-none"
      />
    );
  }
  if (block.type === 'photo_cash' || block.type === 'photo_report' || block.type === 'custom_photo') {
    return (
      <div className="h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Camera className="h-6 w-6" />
        <span className="text-xs">Добавить фото</span>
      </div>
    );
  }
  if (block.type === 'confirmation' || block.type === 'custom_checkbox') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-border rounded" />
        <span className="text-sm text-foreground">{block.title}</span>
      </div>
    );
  }
  if (block.type === 'custom_select') {
    return (
      <select disabled className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground">
        <option>{block.hint || "Выберите..."}</option>
      </select>
    );
  }
  if (block.type === 'sales_grid') {
    return (
      <div className="text-xs text-muted-foreground">
        Сетка продуктов для отметки продаж
      </div>
    );
  }
  if (block.type === 'sales_total') {
    return (
      <div className="text-sm font-semibold text-foreground">
        Итого: 0 ₴
      </div>
    );
  }
  if (block.type === 'top_products') {
    return (
      <div className="text-xs text-muted-foreground">
        Топ-3 проданных продукта
      </div>
    );
  }
  return null;
}

// Block Director Preview
function BlockDirectorPreview({ block }: { block: ReportBlock }) {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Тип:</span>
        <span className="text-foreground font-medium">{block.type}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Обязательно:</span>
        <span className={cn(
          "font-medium",
          block.required ? "text-red-500" : "text-muted-foreground"
        )}>
          {block.required ? "Да" : "Нет"}
        </span>
      </div>
      {block.problemTrigger && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Создаёт проблему:</span>
          <span className="text-orange-500 font-medium">Да</span>
        </div>
      )}
    </div>
  );
}

// Block Settings Panel
function BlockSettingsPanel({
  block,
  onUpdate,
  onClose,
}: {
  block: ReportBlock;
  onUpdate: (updates: Partial<ReportBlock>) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Настройки блока</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Название поля
          </label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
          />
        </div>

        {/* Hint */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Подсказка
          </label>
          <input
            type="text"
            value={block.hint || ''}
            onChange={(e) => onUpdate({ hint: e.target.value })}
            placeholder="Текст подсказки для сотрудника"
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
          />
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Обязательное поле</p>
            <p className="text-xs text-muted-foreground">
              Сотрудник не сможет закрыть смену без заполнения
            </p>
          </div>
          <button
            onClick={() => onUpdate({ required: !block.required })}
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

        {/* Problem Trigger */}
        <div className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Создавать проблему</p>
            <p className="text-xs text-muted-foreground">
              Если поле не заполнено или неверно, создаётся проблема
            </p>
          </div>
          <button
            onClick={() => onUpdate({ problemTrigger: !block.problemTrigger })}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              block.problemTrigger ? "bg-orange-500" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
                block.problemTrigger ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Problem Message */}
        {block.problemTrigger && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Сообщение о проблеме
            </label>
            <input
              type="text"
              value={block.problemMessage || ''}
              onChange={(e) => onUpdate({ problemMessage: e.target.value })}
              placeholder="Например: Фото отсутствует"
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
            />
          </div>
        )}

        {/* Select Options */}
        {block.type === 'custom_select' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Варианты выбора (по одному на строку)
            </label>
            <textarea
              value={block.options?.join('\n') || ''}
              onChange={(e) => onUpdate({ 
                options: e.target.value.split('\n').filter(o => o.trim()) 
              })}
              placeholder="Вариант 1&#10;Вариант 2&#10;Вариант 3"
              className="w-full h-24 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none resize-none"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Products Tab
function ProductsTab({
  products,
  categories,
  editingProduct,
  onProductsChange,
  onCategoriesChange,
  onEditingProductChange,
}: {
  products: Product[];
  categories: string[];
  editingProduct: Product | null;
  onProductsChange: (products: Product[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onEditingProductChange: (product: Product | null) => void;
}) {
  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      name: '',
      price: 0,
      category: categories[0] || 'Без категории',
      active: true,
      inventoryLinked: false,
    };
    onProductsChange([...products, newProduct]);
    onEditingProductChange(newProduct);
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    onProductsChange(products.map(p => p.id === id ? { ...p, ...updates } : p));
    if (editingProduct?.id === id) {
      onEditingProductChange({ ...editingProduct, ...updates });
    }
  };

  const handleDeleteProduct = (id: string) => {
    onProductsChange(products.filter(p => p.id !== id));
    if (editingProduct?.id === id) {
      onEditingProductChange(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Управление продукцией</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Добавьте продукты, которые сотрудник будет отмечать во время смены
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Добавить продукт
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Нет добавленных продуктов
          </p>
          <p className="text-xs text-muted-foreground">
            Добавьте продукты для отслеживания продаж
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isEditing={editingProduct?.id === product.id}
              onEdit={() => onEditingProductChange(product)}
              onUpdate={(updates) => handleUpdateProduct(product.id, updates)}
              onDelete={() => handleDeleteProduct(product.id)}
              onCategoriesChange={onCategoriesChange}
            />
          ))}
        </div>
      )}

      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          categories={categories}
          onUpdate={(updates) => handleUpdateProduct(editingProduct.id, updates)}
          onClose={() => onEditingProductChange(null)}
          onCategoriesChange={onCategoriesChange}
        />
      )}
    </div>
  );
}

// Product Card
function ProductCard({
  product,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onCategoriesChange,
}: {
  product: Product;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<Product>) => void;
  onDelete: () => void;
  onCategoriesChange: (categories: string[]) => void;
}) {
  return (
    <div
      onClick={onEdit}
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all",
        isEditing
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30 bg-background"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
          {product.photo ? (
            <img src={product.photo} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{product.name || 'Без названия'}</p>
          <p className="text-xs text-muted-foreground">
            {product.price.toLocaleString('ru-RU')} ₴ • {product.category}
          </p>
          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
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

// Product Editor
function ProductEditor({
  product,
  categories,
  onUpdate,
  onClose,
  onCategoriesChange,
}: {
  product: Product;
  categories: string[];
  onUpdate: (updates: Partial<Product>) => void;
  onClose: () => void;
  onCategoriesChange: (categories: string[]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Редактирование продукта</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Название <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Цена <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            value={product.price}
            onChange={(e) => onUpdate({ price: Number(e.target.value) })}
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Категория
          </label>
          <input
            type="text"
            value={product.category}
            onChange={(e) => {
              onUpdate({ category: e.target.value });
              if (!categories.includes(e.target.value) && e.target.value) {
                onCategoriesChange([...categories, e.target.value]);
              }
            }}
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            SKU
          </label>
          <input
            type="text"
            value={product.sku || ''}
            onChange={(e) => onUpdate({ sku: e.target.value })}
            placeholder="Артикул"
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Активен</p>
          <p className="text-xs text-muted-foreground">
            Продукт доступен для выбора сотрудникам
          </p>
        </div>
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
      </div>

      <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Связь со складом</p>
          <p className="text-xs text-muted-foreground">
            Автоматически списывать со склада при продаже
          </p>
        </div>
        <button
          onClick={() => onUpdate({ inventoryLinked: !product.inventoryLinked })}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors",
            product.inventoryLinked ? "bg-blue-500" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
              product.inventoryLinked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </motion.div>
  );
}
