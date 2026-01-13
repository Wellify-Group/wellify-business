"use client";

import { useState, useMemo } from "react";
import useStore, { FormField } from "@/lib/store";
import { 
  Save, Plus, X, GripVertical, Settings, Eye, EyeOff, 
  Hash, Camera, FileText, CheckSquare, 
  DollarSign, CreditCard, ShoppingCart, Type, 
  AlertTriangle, Trash2, Copy, Move
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";

// Block types
type BlockType = 'number' | 'media' | 'text' | 'confirmation';

interface ReportBlock {
  id: string;
  type: BlockType;
  label: string;
  required: boolean;
  config: {
    min?: number;
    max?: number;
    placeholder?: string;
    problemTrigger?: boolean;
    problemMessage?: string;
  };
  icon: any;
  hint: string;
}

// Available blocks library
const BLOCK_LIBRARY: Record<string, ReportBlock[]> = {
  numbers: [
    {
      id: 'cash',
      type: 'number',
      label: 'Сумма наличных',
      required: true,
      config: { min: 0 },
      icon: DollarSign,
      hint: 'Сумма наличных денег в кассе'
    },
    {
      id: 'card',
      type: 'number',
      label: 'Сумма терминала',
      required: true,
      config: { min: 0 },
      icon: CreditCard,
      hint: 'Сумма по эквайрингу'
    },
    {
      id: 'orders',
      type: 'number',
      label: 'Число заказов',
      required: false,
      config: { min: 0 },
      icon: ShoppingCart,
      hint: 'Количество оформленных заказов'
    },
    {
      id: 'custom_number',
      type: 'number',
      label: 'Произвольное число',
      required: false,
      config: {},
      icon: Hash,
      hint: 'Любое числовое значение'
    }
  ],
  media: [
    {
      id: 'photo_cash',
      type: 'media',
      label: 'Фото кассы',
      required: false,
      config: { problemTrigger: true, problemMessage: 'Фото кассы отсутствует' },
      icon: Camera,
      hint: 'Фотография кассового аппарата'
    },
    {
      id: 'photo_report',
      type: 'media',
      label: 'Фото отчёта',
      required: false,
      config: { problemTrigger: true, problemMessage: 'Фото отчёта отсутствует' },
      icon: Camera,
      hint: 'Фотография Z-отчёта'
    },
    {
      id: 'photo_display',
      type: 'media',
      label: 'Фото витрины',
      required: false,
      config: {},
      icon: Camera,
      hint: 'Фотография витрины/зала'
    }
  ],
  text: [
    {
      id: 'comment',
      type: 'text',
      label: 'Комментарий',
      required: false,
      config: { placeholder: 'Дополнительная информация...' },
      icon: FileText,
      hint: 'Текстовый комментарий к смене'
    },
    {
      id: 'discrepancy_reason',
      type: 'text',
      label: 'Причина расхождения',
      required: false,
      config: { placeholder: 'Опишите причину расхождения...', problemTrigger: true },
      icon: AlertTriangle,
      hint: 'Объяснение расхождений в суммах'
    }
  ],
  confirmation: [
    {
      id: 'shift_correct',
      type: 'confirmation',
      label: 'Смена сдана корректно',
      required: true,
      config: {},
      icon: CheckSquare,
      hint: 'Подтверждение корректности смены'
    }
  ]
};

export default function ReportConstructorPage() {
  const { formConfig, updateFormConfig } = useStore();
  const { success } = useToast();
  const [template, setTemplate] = useState<ReportBlock[]>(() => {
    // Initialize from existing schema
    if (formConfig.shiftClosingFormSchema) {
      return formConfig.shiftClosingFormSchema.map(field => {
        const block = Object.values(BLOCK_LIBRARY)
          .flat()
          .find(b => b.id === field.id);
        if (block) {
          return {
            ...block,
            label: field.label,
            required: field.required,
            config: {
              ...block.config,
              placeholder: field.placeholder
            }
          };
        }
        // Fallback for unknown fields
        return {
          id: field.id,
          type: field.type as BlockType,
          label: field.label,
          required: field.required,
          config: { placeholder: field.placeholder },
          icon: FileText,
          hint: ''
        };
      });
    }
    return [];
  });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<ReportBlock | null>(null);

  const selectedBlockData = useMemo(() => {
    return template.find(b => b.id === selectedBlock);
  }, [template, selectedBlock]);

  const handleAddBlock = (block: ReportBlock) => {
    const newBlock: ReportBlock = {
      ...block,
      id: `${block.id}_${Date.now()}`
    };
    setTemplate([...template, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const handleRemoveBlock = (blockId: string) => {
    setTemplate(template.filter(b => b.id !== blockId));
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
    }
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ReportBlock>) => {
    setTemplate(template.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    ));
  };

  const handleMoveBlock = (fromIndex: number, toIndex: number) => {
    const newTemplate = [...template];
    const [removed] = newTemplate.splice(fromIndex, 1);
    newTemplate.splice(toIndex, 0, removed);
    setTemplate(newTemplate);
  };

  const handleSave = () => {
    const schema: FormField[] = template.map(block => ({
      id: block.id,
      label: block.label,
      type: block.type === 'number' ? 'number' : 
            block.type === 'text' ? 'text_multiline' : 
            block.type === 'confirmation' ? 'checkbox' : 'text',
      required: block.required,
      placeholder: block.config.placeholder
    }));

    updateFormConfig({ shiftClosingFormSchema: schema });
    success("Отчёт сохранён. Изменения применятся к следующим сменам.");
  };

  const handleReset = () => {
    setTemplate([]);
    setSelectedBlock(null);
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                isPreviewMode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              )}
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Редактировать
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Предпросмотр
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Изменения применяются ко всем новым сменам
        </p>
      </div>

      {isPreviewMode ? (
        <PreviewMode template={template} onClose={() => setIsPreviewMode(false)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL - Block Library */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Библиотека блоков
              </h2>
              <div className="space-y-6">
                {Object.entries(BLOCK_LIBRARY).map(([category, blocks]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      {category === 'numbers' && 'Числа'}
                      {category === 'media' && 'Медиа'}
                      {category === 'text' && 'Текст'}
                      {category === 'confirmation' && 'Подтверждения'}
                    </h3>
                    <div className="space-y-2">
                      {blocks.map((block) => {
                        const Icon = block.icon;
                        return (
                          <motion.div
                            key={block.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAddBlock(block)}
                            className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted rounded-lg cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                          >
                            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {block.label}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {block.hint}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Template Builder */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Шаблон отчёта
                </h2>
                {template.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Сбросить
                  </button>
                )}
              </div>

              {template.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Шаблон пуст
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Добавьте блоки из библиотеки слева
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {template.map((block, index) => {
                    const Icon = block.icon;
                    const isSelected = selectedBlock === block.id;
                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "group relative p-4 border rounded-lg transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 bg-background"
                        )}
                        onClick={() => setSelectedBlock(block.id)}
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">
                                {block.label}
                              </p>
                              {block.required && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                  Обязательно
                                </span>
                              )}
                              {block.config.problemTrigger && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                  Проблема
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {block.hint}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBlock(block.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Block Settings */}
            {selectedBlockData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Настройки блока
                  </h3>
                </div>
                <BlockSettings
                  block={selectedBlockData}
                  onUpdate={(updates) => handleUpdateBlock(selectedBlockData.id, updates)}
                />
              </motion.div>
            )}

            {/* Save Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={template.length === 0}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Сохранить отчёт
              </button>
              <button
                onClick={handleReset}
                disabled={template.length === 0}
                className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Block Settings Component
function BlockSettings({ block, onUpdate }: { block: ReportBlock, onUpdate: (updates: Partial<ReportBlock>) => void }) {
  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Название поля
        </label>
        <input
          type="text"
          value={block.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
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
            "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            block.required ? "bg-primary" : "bg-muted"
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

      {/* Number-specific settings */}
      {block.type === 'number' && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium text-foreground mb-3">Валидация</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Минимум
              </label>
              <input
                type="number"
                value={block.config.min ?? ''}
                onChange={(e) => onUpdate({
                  config: { ...block.config, min: e.target.value ? Number(e.target.value) : undefined }
                })}
                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Максимум
              </label>
              <input
                type="number"
                value={block.config.max ?? ''}
                onChange={(e) => onUpdate({
                  config: { ...block.config, max: e.target.value ? Number(e.target.value) : undefined }
                })}
                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none"
                placeholder="Не ограничено"
              />
            </div>
          </div>
        </div>
      )}

      {/* Text-specific settings */}
      {block.type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Подсказка (placeholder)
          </label>
          <input
            type="text"
            value={block.config.placeholder ?? ''}
            onChange={(e) => onUpdate({
              config: { ...block.config, placeholder: e.target.value }
            })}
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
            placeholder="Введите подсказку..."
          />
        </div>
      )}

      {/* Problem Trigger */}
      <div className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Создавать проблему</p>
          <p className="text-xs text-muted-foreground">
            Если поле не заполнено или неверно, создаётся проблема
          </p>
        </div>
        <button
          onClick={() => onUpdate({
            config: {
              ...block.config,
              problemTrigger: !block.config.problemTrigger
            }
          })}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            block.config.problemTrigger ? "bg-orange-500" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
              block.config.problemTrigger ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {block.config.problemTrigger && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Сообщение о проблеме
          </label>
          <input
            type="text"
            value={block.config.problemMessage ?? ''}
            onChange={(e) => onUpdate({
              config: { ...block.config, problemMessage: e.target.value }
            })}
            className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
            placeholder="Например: Фото отсутствует"
          />
        </div>
      )}
    </div>
  );
}

// Preview Mode Component
function PreviewMode({ template, onClose }: { template: ReportBlock[], onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Предпросмотр отчёта сотрудника</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Так будет выглядеть форма для сотрудника
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          Закрыть предпросмотр
        </button>
      </div>

      {/* Mobile Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">Ежедневный отчёт</h3>
            <p className="text-xs text-muted-foreground mt-1">Заполните все обязательные поля</p>
          </div>

          <div className="space-y-4">
            {template.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Нет полей в шаблоне
              </p>
            ) : (
              template.map((block) => {
                const Icon = block.icon;
                return (
                  <div key={block.id} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {block.label}
                      {block.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {block.type === 'number' && (
                      <input
                        type="number"
                        placeholder={block.config.placeholder || "0"}
                        disabled
                        className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50"
                      />
                    )}
                    {block.type === 'text' && (
                      <textarea
                        placeholder={block.config.placeholder || "Введите текст..."}
                        disabled
                        className="w-full h-24 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 resize-none"
                      />
                    )}
                    {block.type === 'media' && (
                      <div className="h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Camera className="h-6 w-6" />
                        <span className="text-xs">Добавить фото</span>
                      </div>
                    )}
                    {block.type === 'confirmation' && (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="w-5 h-5 border-2 border-border rounded" />
                        <span className="text-sm text-foreground">{block.label}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {template.length > 0 && (
            <button
              disabled
              className="w-full mt-6 py-3 bg-primary/50 text-primary-foreground rounded-xl font-medium"
            >
              Закрыть смену
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
