"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, AlertTriangle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  time: number;
  message: string;
  type: 'finance' | 'incident' | 'personnel' | 'other';
}

interface EventJournalProps {
  events: Event[];
}

export function EventJournal({ events }: EventJournalProps) {
  const [filter, setFilter] = useState<'all' | 'finance' | 'incident' | 'personnel'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter);

  const typeIcons = {
    finance: DollarSign,
    incident: AlertTriangle,
    personnel: Users,
    other: FileText
  };

  const typeLabels = {
    finance: 'Финансы',
    incident: 'Инциденты',
    personnel: 'Персонал',
    other: 'Прочее'
  };

  const typeColors = {
    finance: 'bg-primary/10 text-primary border-primary/20',
    incident: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border-[color:var(--color-danger)]/20',
    personnel: 'bg-accent/10 text-accent border-accent/20',
    other: 'bg-muted/50 text-muted-foreground border-border/50'
  };

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground">Журнал событий</h3>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Все события</option>
              <option value="finance">Финансы</option>
              <option value="incident">Инциденты</option>
              <option value="personnel">Персонал</option>
            </select>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет событий
            </p>
          ) : (
            filteredEvents.map(event => {
              const Icon = typeIcons[event.type] || FileText;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xs text-muted-foreground font-mono min-w-[60px]">
                    {new Date(event.time).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{event.message}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", typeColors[event.type])}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {typeLabels[event.type]}
                  </Badge>
                </div>
              );
            })
          )}
          </div>
        )}
      </div>
    </Card>
  );
}


