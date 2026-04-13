import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { GlassCard } from "@/components/glass-card";
import { ApproveUserForm } from "./approve-user-form";

interface ApproveUserPageProps {
  params: Promise<{ id: string }>;
}

const ADMIN_EMAIL = "christoph.menke@gmail.com";

export default async function ApproveUserPage({ params }: ApproveUserPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const t = await getTranslations("approval");
  const tCommon = await getTranslations("common");

  // Admin-only gate
  const supabase = await createClient();
  const { data: self } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  if (self?.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  // Load target profile via service client so it also works if for some
  // reason the profile row has weird RLS. This endpoint is already
  // admin-gated above.
  const service = createServiceClient();
  const { data: target } = await service
    .from("profiles")
    .select("id, email, display_name, is_approved, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!target) notFound();

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10"
      data-testid="admin-approve-page"
    >
      <GlassCard glow="neutral">
        <div className="space-y-4 p-2 sm:p-4">
          <h1 className="font-heading text-2xl tracking-wide text-primary sm:text-3xl">
            {t("adminApproveTitle")}
          </h1>

          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">E-Mail</dt>
              <dd className="font-mono text-foreground" data-testid="admin-approve-email">
                {target.email}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Display Name</dt>
              <dd className="text-foreground">{target.display_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Registriert</dt>
              <dd className="text-foreground">
                {new Date(target.created_at).toLocaleString("de-DE")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd
                className={target.is_approved ? "text-emerald-400" : "text-amber-400"}
                data-testid="admin-approve-status"
              >
                {target.is_approved ? t("adminApprovedAlready") : t("adminPending")}
              </dd>
            </div>
          </dl>

          {target.is_approved ? (
            <div className="rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
              {t("adminAlreadyApprovedMsg")}
            </div>
          ) : (
            <ApproveUserForm
              targetId={target.id}
              targetEmail={target.email ?? ""}
              approveLabel={t("adminApproveButton")}
              rejectLabel={t("adminRejectButton")}
              rejectConfirm={t("adminRejectConfirm", { email: target.email ?? "" })}
              successLabel={t("adminApproveSuccess")}
              errorLabel={t("adminApproveError")}
              rejectSuccessLabel={t("adminRejectSuccess")}
              rejectErrorLabel={t("adminRejectError")}
            />
          )}

          <Link
            href="/dashboard"
            className="block pt-2 text-center text-xs text-muted-foreground hover:text-primary"
          >
            ← {tCommon("back")}
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
