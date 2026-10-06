"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Mounts a full-screen overlay directly under `document.body`.
 *
 * `position: fixed` is relative to the nearest ancestor with a transform,
 * filter or backdrop-filter — every `.glass` card has one. Rendered in place,
 * an overlay shrinks to that card and later siblings paint over it (iPad in
 * desktop view: the inventory panel covered the pay dialog's button).
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  if (!isClient) return null;
  return createPortal(children, document.body);
}
