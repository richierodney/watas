"use client";

import AdminDashboard from "@/components/admin-dashboard";
import { usePageVisit } from "@/hooks/use-page-visit";

export default function AdminPage() {
  usePageVisit("/admin");
  return <AdminDashboard />;
}

