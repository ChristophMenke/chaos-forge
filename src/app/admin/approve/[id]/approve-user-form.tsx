"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ApproveUserFormProps {
  targetId: string;
  targetEmail: string;
  approveLabel: string;
  rejectLabel: string;
  rejectConfirm: string;
  successLabel: string;
  errorLabel: string;
  rejectSuccessLabel: string;
  rejectErrorLabel: string;
}

export function ApproveUserForm({
  targetId,
  targetEmail,
  approveLabel,
  rejectLabel,
  rejectConfirm,
  successLabel,
  errorLabel,
  rejectSuccessLabel,
  rejectErrorLabel,
}: ApproveUserFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  async function handleApprove() {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("approve_user", { target_user_id: targetId });
      if (error) throw error;
      toast.success(successLabel.replace("{email}", targetEmail));
      router.refresh();
    } catch {
      toast.error(errorLabel);
      setPending(false);
    }
  }

  async function handleReject() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/reject-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(rejectSuccessLabel.replace("{email}", targetEmail));
      router.push("/dashboard");
    } catch {
      toast.error(rejectErrorLabel);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleApprove}
        disabled={pending}
        className="w-full"
        size="lg"
        data-testid="admin-approve-submit"
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {approveLabel}
      </Button>

      {confirmReject ? (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
          <p className="text-sm text-destructive" data-testid="admin-reject-confirm-message">
            {rejectConfirm}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={pending}
              className="flex-1"
              data-testid="admin-reject-submit"
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {rejectLabel}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmReject(false)}
              disabled={pending}
              className="flex-1"
              data-testid="admin-reject-cancel"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setConfirmReject(true)}
          disabled={pending}
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
          data-testid="admin-reject-button"
        >
          <XCircle className="mr-2 h-4 w-4" />
          {rejectLabel}
        </Button>
      )}
    </div>
  );
}
