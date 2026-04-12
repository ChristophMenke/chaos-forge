"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ApproveUserFormProps {
  targetId: string;
  targetEmail: string;
  approveLabel: string;
  successLabel: string;
  errorLabel: string;
}

export function ApproveUserForm({
  targetId,
  targetEmail,
  approveLabel,
  successLabel,
  errorLabel,
}: ApproveUserFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

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

  return (
    <Button
      onClick={handleApprove}
      disabled={pending}
      className="w-full"
      size="lg"
      data-testid="admin-approve-submit"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {approveLabel}
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {approveLabel}
        </>
      )}
    </Button>
  );
}
