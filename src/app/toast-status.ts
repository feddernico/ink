import type { DomRefs } from "./types";

export type ToastTimerRef = {
  current: ReturnType<typeof setTimeout> | null;
};

export type StatusKind = "neutral" | "ok" | "warn" | "err";

export function setStatus(els: DomRefs, message: string | null, kind: StatusKind = "neutral"): void {
  els.statusBadge.textContent = message;
  els.statusBadge.classList.remove("ok", "warn", "err");
  if (kind !== "neutral") {
    els.statusBadge.classList.add(kind);
  }
}

export function createToastController(els: DomRefs, toastTimerRef: ToastTimerRef) {
  function showToast(message: string, options: { persist?: boolean } = {}): void {
    els.toastMsg.textContent = message;
    els.toast.classList.add("show");

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    if (!options.persist) {
      toastTimerRef.current = setTimeout(() => {
        els.toast.classList.remove("show");
      }, 3500);
    }
  }

  function hideToast(): void {
    els.toast.classList.remove("show");
  }

  return { showToast, hideToast };
}
