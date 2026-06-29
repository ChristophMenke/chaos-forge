"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Share2, Copy, Check, Globe, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareSessionButtonProps {
  sessionId: string;
  initialIsPublic: boolean;
}

export function ShareSessionButton({ sessionId, initialIsPublic }: ShareSessionButtonProps) {
  const t = useTranslations("sessions");
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/share/sessions/${sessionId}` : "";

  async function handleToggle(next: boolean) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_session_public", {
      p_session_id: sessionId,
      p_is_public: next,
    });
    setSaving(false);

    if (error) {
      toast.error(t("shareUpdateFailed"));
      return;
    }
    setIsPublic(next);
    toast.success(next ? t("shareEnabled") : t("shareDisabled"));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t("shareLinkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("shareCopyFailed"));
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid="session-share-button"
      >
        <Share2 className="mr-2 h-4 w-4" />
        {t("share")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shareTitle")}</DialogTitle>
            <DialogDescription>{t("shareDescription")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-green-400" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">{isPublic ? t("sharePublic") : t("sharePrivate")}</span>
              </div>
              <Button
                variant={isPublic ? "outline" : "default"}
                size="sm"
                disabled={saving}
                onClick={() => handleToggle(!isPublic)}
                data-testid="session-share-toggle"
              >
                {isPublic ? t("shareMakePrivate") : t("shareMakePublic")}
              </Button>
            </div>

            {isPublic && (
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="font-mono text-xs"
                  data-testid="session-share-url"
                  aria-label={t("shareLinkLabel")}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  data-testid="session-share-copy"
                  aria-label={t("shareCopy")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
