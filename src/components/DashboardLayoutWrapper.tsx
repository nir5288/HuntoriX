import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";

export function DashboardLayoutWrapper() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
