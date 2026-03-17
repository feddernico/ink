import type { AppState } from "./types";

type ToastFn = (message: string, options?: { persist?: boolean }) => void;
type StatusFn = (message: string | null, kind?: "neutral" | "ok" | "warn" | "err") => void;

type EnsurePermission = (handle: NonNullable<AppState["workspaceHandle"]>, mode: "read" | "readwrite") => Promise<boolean>;

type RescanWorkspace = (options?: { silent?: boolean }) => Promise<void>;

export function createAutoRefresh({
  state,
  ensurePermission,
  rescanWorkspace,
  showToast,
  setStatus,
}: {
  state: AppState;
  ensurePermission: EnsurePermission;
  rescanWorkspace: RescanWorkspace;
  showToast: ToastFn;
  setStatus: StatusFn;
}) {
  function startAutoRefresh(): void {
    stopAutoRefresh();
    state.autoRefreshTimer = setInterval(() => {
      runAutoRefresh().catch((error: unknown) => {
        showToast(`Auto-refresh failed: ${String(error)}`, { persist: true });
        setStatus("Auto-refresh failed", "err");
      });
    }, state.autoRefreshMs);
  }

  async function runAutoRefresh(): Promise<void> {
    if (!state.workspaceHandle) {
      return;
    }

    try {
      const permissionGranted = await ensurePermission(state.workspaceHandle, "read");
      if (!permissionGranted) {
        throw new Error("Folder permission revoked.");
      }
    } catch {
      stopAutoRefresh();
      showToast("Auto-refresh stopped: folder permission revoked.", { persist: true });
      setStatus("Permission revoked", "err");
      return;
    }

    if (state.isDirty) {
      return;
    }

    await rescanWorkspace({ silent: true });
  }

  function stopAutoRefresh(): void {
    if (state.autoRefreshTimer) {
      clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = null;
    }
  }

  return {
    startAutoRefresh,
    stopAutoRefresh,
  };
}
