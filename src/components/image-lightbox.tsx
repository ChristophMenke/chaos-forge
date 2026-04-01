"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-[10vh_10vw]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      data-testid="image-lightbox"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-[101] rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Close"
        data-testid="image-lightbox-close"
      >
        <XIcon className="h-6 w-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-[80vh] w-[80vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
        data-testid="image-lightbox-img"
      />
    </div>,
    document.body
  );
}
