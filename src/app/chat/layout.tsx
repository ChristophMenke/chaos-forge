import { requireAuth } from "@/lib/supabase/auth";
import { getUserNavContext } from "@/lib/supabase/nav-context";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const nav = await getUserNavContext(user.id, user.email ?? "");

  return (
    <div className="flex flex-1 flex-col sm:flex-row" data-testid="rulebook-layout">
      <AppSidebar userEmail={nav.userEmail} userId={nav.userId} userAvatarUrl={nav.userAvatarUrl} />
      <AppNav userEmail={nav.userEmail} userId={nav.userId} userAvatarUrl={nav.userAvatarUrl} />
      <div className="flex flex-1 flex-col overflow-hidden sm:ml-[calc(4rem_+_env(safe-area-inset-left,0px))] xl:ml-[calc(12rem_+_env(safe-area-inset-left,0px))]">
        {children}
      </div>
    </div>
  );
}
