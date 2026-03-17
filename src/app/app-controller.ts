import { marked } from "marked";
import { parseTags } from "../tags";
import { getDomRefs } from "./dom";
import { ensurePermission, isFileSystemApiAvailable } from "./fs-api";
import { createAutoRefresh } from "./auto-refresh";
import { renderPreview, updateDirtyUi } from "./editor-preview";
import { createMenuActions, updateMenuShortcuts } from "./menu-actions";
import { applySidebarState, setSidebarCollapsed } from "./sidebar";
import { loadTheme } from "./theme";
import { createToastController, setStatus } from "./toast-status";
import { createTreeRenderer } from "./tree-render";
import { attachUiEvents } from "./ui-events";
import { createWorkspaceActions } from "./workspace-io";
import type { AppState, DomRefs } from "./types";

type RescanWorkspaceFn = (options?: { silent?: boolean }) => Promise<void>;

export function bootstrapInkApp(): void {
  const app = createAppController(getDomRefs());
  app.initialize();
}

export function createAppController(els: DomRefs) {
  const state: AppState = {
    workspaceHandle: null,
    workspaceName: "",
    fileTree: null,
    notes: [],
    inMemoryNotes: [],
    currentFileHandle: null,
    currentRelPath: "",
    currentContent: "",
    isDirty: false,
    searchQuery: "",
    tagFilter: "",
    sortMode: "name",
    collapsedDirs: new Set<string>(),
    autoRefreshMs: 10000,
    autoRefreshTimer: null,
    isSidebarCollapsed: false,
    isTemporarySession: false,
  };

  const toastTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
  const { showToast, hideToast } = createToastController(els, toastTimerRef);

  const treeHandlers = {
    openNoteByRelPath: async () => {},
    openInMemoryNote: async () => {},
  };

  const treeRenderer = createTreeRenderer({
    state,
    els,
    handlers: treeHandlers,
    showToast,
  });

  const rescanWorkspaceRef: { current: RescanWorkspaceFn } = {
    current: async () => {},
  };

  const autoRefresh = createAutoRefresh({
    state,
    ensurePermission,
    rescanWorkspace: (options) => rescanWorkspaceRef.current(options),
    showToast,
    setStatus: (message, kind) => setStatus(els, message, kind),
  });

  const workspaceActions = createWorkspaceActions({
    state,
    els,
    showToast,
    setStatus: (message, kind) => setStatus(els, message, kind),
    renderPreview,
    updateDirtyUi,
    renderTree: treeRenderer.renderTree,
    renderInMemoryTree: treeRenderer.renderInMemoryTree,
    renderTags: treeRenderer.renderTags,
    updateCountsPill: treeRenderer.updateCountsPill,
    fsApi: {
      ensurePermission,
      isFileSystemApiAvailable,
    },
    parseTags,
    autoRefresh,
  });

  rescanWorkspaceRef.current = workspaceActions.rescanWorkspace;
  treeHandlers.openNoteByRelPath = workspaceActions.openNoteByRelPath;
  treeHandlers.openInMemoryNote = workspaceActions.openInMemoryNote;

  const menuActions = createMenuActions({
    state,
    els,
    showToast,
    renderTree: treeRenderer.renderTree,
    callbacks: {
      createNewNote: workspaceActions.createNewNote,
      createNewFolder: workspaceActions.createNewFolder,
      openWorkspace: workspaceActions.openWorkspace,
      closeWorkspace: workspaceActions.closeWorkspace,
      saveCurrentNote: workspaceActions.saveCurrentNote,
      saveAsNewNote: workspaceActions.saveAsNewNote,
      handleRefresh: workspaceActions.handleRefresh,
      exportAsJson: workspaceActions.exportAsJson,
      exportAsMarkdown: workspaceActions.exportAsMarkdown,
      setSidebarCollapsed: (isCollapsed) => setSidebarCollapsed(els, state, isCollapsed),
    },
  });

  function handleSearchInput(value: string): void {
    state.searchQuery = value;
    treeRenderer.renderTree().catch((error: unknown) => {
      showToast(`Search render failed: ${String(error)}`, { persist: true });
    });
  }

  function handleEditorInput(value: string): void {
    state.isDirty = value !== state.currentContent;
    updateDirtyUi(els, state, (message, kind) => setStatus(els, message, kind));
    renderPreview(els, value);
  }

  function initialize(): void {
    marked.use({ breaks: true });

    const isMac = navigator.platform.toLowerCase().includes("mac");
    updateMenuShortcuts(els, isMac);

    attachUiEvents({
      state,
      els,
      actions: {
        handleMenuAction: menuActions.handleMenuAction,
        toggleSidebar: () => setSidebarCollapsed(els, state, !state.isSidebarCollapsed),
        handleRefresh: workspaceActions.handleRefresh,
        toggleSort: menuActions.toggleSort,
        handleSearchInput,
        handleEditorInput,
        saveCurrentNote: workspaceActions.saveCurrentNote,
        createNewNote: workspaceActions.createNewNote,
        openWorkspace: workspaceActions.openWorkspace,
        exportAsJson: workspaceActions.exportAsJson,
        exportAsMarkdown: workspaceActions.exportAsMarkdown,
        hideToast,
        showToast,
      },
    });

    loadTheme();
    applySidebarState(els, state);
    updateDirtyUi(els, state, (message, kind) => setStatus(els, message, kind));
    treeRenderer.renderTree().catch((error: unknown) => {
      showToast(`Failed to render tree: ${String(error)}`, { persist: true });
      setStatus(els, "Render failed", "err");
    });
  }

  return {
    initialize,
    state,
  };
}
