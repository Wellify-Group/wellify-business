"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Users, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AttentionItem {
  id: string;
  type: 'finance' | 'personnel' | 'operations';
  message: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
}

interface AttentionRequiredProps {
  items: AttentionItem[];
}

export function AttentionRequired({ items }: AttentionRequiredProps) {
  const [filter, setFilter] = useState<'all' | 'finance' | 'personnel' | 'operations'>('all');

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter);

  const typeIcons = {
    finance: DollarSign,
    personnel: Users,
    operations: Settings
  };

  const typeLabels = {
    finance: 'Финансы',
    personnel: 'Персонал',
    operations: 'Операции'
  };

  const priorityColors = {
    high: 'text-rose-500',
    medium: 'text-amber-500',
    low: 'text-blue-500'
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Требуют внимания</h3>
        
        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">Все</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs">Финансы</TabsTrigger>
            <TabsTrigger value="personnel" className="text-xs">Персонал</TabsTrigger>
            <TabsTrigger value="operations" className="text-xs">Операции</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Items list */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет элементов, требующих внимания
            </p>
          ) : (
            filteredItems
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map(item => {
                const Icon = typeIcons[item.type];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <AlertTriangle className={cn(
                      "h-4 w-4 flex-shrink-0 mt-0.5",
                      priorityColors[item.priority]
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {typeLabels[item.type]}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  </Link>
                );
              })
          )}
        </div>
      </div>
    </Card>
  );
}















