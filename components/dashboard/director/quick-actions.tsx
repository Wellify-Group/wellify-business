"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Navigate to assign manager page or open modal
          router.push('/dashboard/director/staff');
        }}
        className="text-xs"
      >
        <UserPlus className="h-3 w-3 mr-1.5" />
        Назначить менеджера
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Open manual shift modal or navigate
          console.log('Open manual shift');
        }}
        className="text-xs"
      >
        <Clock className="h-3 w-3 mr-1.5" />
        Открыть смену вручную
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Create task/note modal
          console.log('Create task');
        }}
        className="text-xs"
      >
        <FileText className="h-3 w-3 mr-1.5" />
        Создать задачу
      </Button>
    </div>
  );
}














