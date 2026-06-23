// src/app/auto-refresh.ts
var MINIMUM_IDLE_MS = 5e3;
function createAutoRefresh({
  state,
  ensurePermission,
  rescanWorkspace,
  showToast,
  setStatus
}) {
  function startAutoRefresh() {
    stopAutoRefresh();
    state.autoRefreshTimer = setInterval(() => {
      runAutoRefresh().catch((error) => {
        showToast(`Auto-refresh failed: ${String(error)}`, { persist: true });
        setStatus("Auto-refresh failed", "err");
      });
    }, state.autoRefreshMs);
  }
  async function runAutoRefresh() {
    if (!state.workspaceHandle) {
      return;
    }
    if (state.isDirty) {
      return;
    }
    if (Date.now() - state.lastWorkspaceInteractionAt < MINIMUM_IDLE_MS) {
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
    await rescanWorkspace({ silent: true });
  }
  function stopAutoRefresh() {
    if (state.autoRefreshTimer) {
      clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = null;
    }
  }
  return {
    startAutoRefresh,
    stopAutoRefresh,
    runAutoRefresh
  };
}
export {
  createAutoRefresh
};
