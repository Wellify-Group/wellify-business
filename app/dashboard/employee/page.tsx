"use client";

import useStore from "@/lib/store";
import { EmployeeShift } from "@/components/dashboard/employee/employee-shift";

export default function EmployeePage() {
  const { locations, savedLocationId, currentUser } = useStore();
  
  // Get assigned location
  const assignedLocation = locations.find(loc => 
    loc.id === savedLocationId || loc.id === currentUser?.assignedPointId
  );

  return <EmployeeShift location={assignedLocation} />;
}
