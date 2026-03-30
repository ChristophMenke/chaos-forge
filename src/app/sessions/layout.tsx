import { requireAuth } from "@/lib/supabase/auth";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { FabNewCharacter } from "@/components/fab-new-character";

export default async function SessionsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <div className="flex flex-1 flex-col sm:flex-row" data-testid="sessions-layout">
      <AppSidebar userEmail={user.email ?? ""} />
      <AppNav userEmail={user.email ?? ""} />
      <FabNewCharacter />
      <div className="flex flex-1 flex-col sm:ml-16 xl:ml-48">{children}</div>
    </div>
  );
}
