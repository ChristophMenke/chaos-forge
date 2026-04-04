import { requireAuth } from "@/lib/supabase/auth";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <div className="flex flex-1 flex-col sm:flex-row" data-testid="dashboard-layout">
      <AppSidebar userEmail={user.email ?? ""} userId={user.id} />
      <AppNav userEmail={user.email ?? ""} userId={user.id} />
      <div className="flex flex-1 flex-col sm:ml-16 xl:ml-48">{children}</div>
    </div>
  );
}
