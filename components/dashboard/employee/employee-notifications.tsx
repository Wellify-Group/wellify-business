"use client";

import { NotificationsCard } from "./notifications-card";
import { ShiftMessagesCard } from "./shift-messages-card";
import { useStore } from "@/lib/store";

export function EmployeeNotifications() {
  const { currentShift } = useStore();

  return (
    <div className="flex flex-col gap-6">
      <NotificationsCard />
      {currentShift?.id && <ShiftMessagesCard shiftId={currentShift.id} />}
    </div>
  );
}
