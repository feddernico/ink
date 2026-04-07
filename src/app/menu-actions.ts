import type { AppState, DomRefs } from "./types";
import { applyTheme, VALID_THEMES } from "./theme";

type ToastFn = (message: string, options?: { persist?: boolean }) => void;
type MenuCallbacks = {
  createNewNote: () => Promise<void>;
  createNewFolder: () => Promise<void>;
  openWorkspace: () => Promise<void>;
  closeWorkspace: () => void;
  saveCurrentNote: () => Promise<void>;
  saveAsNewNote: () => Promise<void>;
  handleRefresh: () => void;
  exportAsJson: () => void;
  exportAsMarkdown: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
};

export function updateMenuShortcuts(els: DomRefs, isMac: boolean): void {
  const modifier = isMac ? "Cmd" : "Ctrl";
  const shortcuts = els.menuBar.querySelectorAll(".menu-shortcut");
  shortcuts.forEach((el) => {
    const text = el.textContent;
    if (text) {
      if (text.includes("Cmd/Ctrl")) {
        el.textContent = text.replace("Cmd/Ctrl", modifier);
      } else if (text.includes("Ctrl")) {
        el.textContent = text.replace("Ctrl", modifier);
      }
    }
  });
}

export function createMenuActions({
  state,
  els,
  showToast,
  renderTree,
  callbacks,
}: {
  state: AppState;
  els: DomRefs;
  showToast: ToastFn;
  renderTree: () => Promise<void>;
  callbacks: MenuCallbacks;
}) {
  function toggleSort(): void {
    state.sortMode = state.sortMode === "name" ? "modified" : "name";
    els.sortBtn.textContent = `Sort: ${state.sortMode === "name" ? "Name" : "Last modified"}`;

    const sortMenuItem = document.querySelector('[data-action="sort"] .menu-label-text');
    if (sortMenuItem) {
      sortMenuItem.textContent = `Sort: ${state.sortMode === "name" ? "Name" : "Modified"}`;
    }

    renderTree().catch((error: unknown) => {
      showToast(`Sort render failed: ${String(error)}`, { persist: true });
    });
  }

  function handleExit(): void {
    if (state.isDirty) {
      const shouldExit = confirm("You have unsaved changes. Are you sure you want to exit?");
      if (!shouldExit) {
        return;
      }
    }
    window.close();
  }

  function handleMenuAction(action: string): void {
    switch (action) {
      case "new-note":
        callbacks.createNewNote().catch((error: unknown) => {
          showToast(`Create note failed: ${String(error)}`, { persist: true });
        });
        break;
      case "new-folder":
        callbacks.createNewFolder().catch((error: unknown) => {
          showToast(`Create folder failed: ${String(error)}`, { persist: true });
        });
        break;
      case "open-workspace":
        callbacks.openWorkspace().catch((error: unknown) => {
          showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
        });
        break;
      case "close-workspace":
        callbacks.closeWorkspace();
        break;
      case "exit":
        handleExit();
        break;
      case "save":
        callbacks.saveCurrentNote().catch((error: unknown) => {
          showToast(`Save failed: ${String(error)}`, { persist: true });
        });
        break;
      case "save-as":
        callbacks.saveAsNewNote().catch((error: unknown) => {
          showToast(`Save As failed: ${String(error)}`, { persist: true });
        });
        break;
      case "refresh":
        callbacks.handleRefresh();
        break;
      case "sort":
        toggleSort();
        break;
      case "collapse-sidebar":
        callbacks.setSidebarCollapsed(!state.isSidebarCollapsed);
        break;
      case "export-json":
        callbacks.exportAsJson();
        break;
      case "export-markdown":
        callbacks.exportAsMarkdown();
        break;
      case "theme-default":
      case "theme-classic":
      case "theme-cobalt":
      case "theme-monokai":
      case "theme-office":
      case "theme-twilight":
      case "theme-xcode": {
        const themeName = action.replace("theme-", "");
        if (VALID_THEMES.includes(themeName)) {
          applyTheme(themeName);
        }
        break;
      }
    }
  }

  return {
    toggleSort,
    handleMenuAction,
    handleExit,
  };
}
