import { requireAuth } from "@/lib/supabase/auth";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <div
      className="fixed inset-0 z-10 flex flex-col sm:flex-row bg-background"
      data-testid="rulebook-layout"
    >
      <AppSidebar userEmail={user.email ?? ""} />
      <AppNav userEmail={user.email ?? ""} />
      <div className="flex flex-1 flex-col overflow-hidden sm:ml-16 xl:ml-48 pb-16 sm:pb-0">
        {children}
      </div>
    </div>
  );
}
