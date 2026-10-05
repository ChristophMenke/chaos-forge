"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ position, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  // Sonner only switches to its mobile layout by width; in forced mobile view
  // the bottom nav would cover bottom-anchored toasts on wide screens.
  const [viewMode] = useViewMode();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={viewMode === "mobile" ? "top-center" : position}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
