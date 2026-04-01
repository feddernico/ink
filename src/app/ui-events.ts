import type { AppState, DomRefs } from "./types";

type ToastFn = (message: string, options?: { persist?: boolean }) => void;

export type UiActions = {
  handleMenuAction: (action: string) => void;
  toggleSidebar: () => void;
  handleRefresh: () => void;
  toggleSort: () => void;
  handleSearchInput: (value: string) => void;
  handleEditorInput: (value: string) => void;
  saveCurrentNote: () => Promise<void>;
  createNewNote: () => Promise<void>;
  openWorkspace: () => Promise<void>;
  exportAsJson: () => void;
  exportAsMarkdown: () => void;
  toggleCogitoPanel: () => void;
  generateCogitoQuestions: () => Promise<void>;
  insertCogitoQuestion: (index: number) => void;
  hideToast: () => void;
  showToast: ToastFn;
};

export function attachUiEvents({
  state,
  els,
  actions,
}: {
  state: AppState;
  els: DomRefs;
  actions: UiActions;
}): void {
  attachMenuEventListeners(els, actions.handleMenuAction);

  els.sidebarToggleBtn.addEventListener("click", () => {
    actions.toggleSidebar();
  });

  els.refreshBtn.addEventListener("click", () => {
    actions.handleRefresh();
  });

  els.sortBtn.addEventListener("click", () => {
    actions.toggleSort();
  });

  els.searchInput.addEventListener("input", () => {
    actions.handleSearchInput(els.searchInput.value);
  });

  els.editor.addEventListener("input", () => {
    if (!state.currentRelPath) {
      return;
    }

    actions.handleEditorInput(els.editor.value);
  });

  els.editor.addEventListener("keydown", (event: KeyboardEvent) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;

    if (isModifierPressed && !event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      actions.saveCurrentNote().catch((error: unknown) => {
        actions.showToast(`Save failed: ${String(error)}`, { persist: true });
      });
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const start = els.editor.selectionStart;
      els.editor.setRangeText("  ", start, start, "end");
    }
  });

  els.toastCloseBtn.addEventListener("click", () => {
    actions.hideToast();
  });

  els.cogitoToggleBtn.addEventListener("click", () => {
    actions.toggleCogitoPanel();
  });

  els.cogitoGenerateBtn.addEventListener("click", () => {
    actions.generateCogitoQuestions().catch((error: unknown) => {
      actions.showToast(`Cogito generation failed: ${String(error)}`, { persist: true });
    });
  });

  els.cogitoQuestionList.addEventListener("click", (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    const insertButton = target.closest("[data-question-index]");
    if (!insertButton) {
      return;
    }
    const indexText = insertButton.getAttribute("data-question-index");
    const index = Number(indexText);
    if (Number.isNaN(index)) {
      return;
    }
    actions.insertCogitoQuestion(index);
  });

  window.addEventListener("beforeunload", (event: BeforeUnloadEvent) => {
    if (state.isDirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  attachGlobalKeyboardShortcuts(actions);
}

function attachMenuEventListeners(els: DomRefs, handleMenuAction: (action: string) => void): void {
  const menuItems = els.menuBar.querySelectorAll(".menu-item");

  menuItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const isExpanded = item.getAttribute("aria-expanded") === "true";

      menuItems.forEach((mi) => mi.setAttribute("aria-expanded", "false"));

      if (!isExpanded) {
        item.setAttribute("aria-expanded", "true");
      }
    });

    item.addEventListener("keydown", (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        item.setAttribute("aria-expanded", "false");
      }
    });
  });

  const submenuParents = els.menuBar.querySelectorAll(".submenu-parent");
  submenuParents.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const isExpanded = item.getAttribute("aria-expanded") === "true";

      submenuParents.forEach((sp) => sp.setAttribute("aria-expanded", "false"));

      if (!isExpanded) {
        item.setAttribute("aria-expanded", "true");
      }
    });

    item.addEventListener("keydown", (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        item.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("click", () => {
    menuItems.forEach((mi) => mi.setAttribute("aria-expanded", "false"));
    submenuParents.forEach((sp) => sp.setAttribute("aria-expanded", "false"));
  });

  const dropdownItems = els.menuBar.querySelectorAll(".dropdown li[data-action]");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.getAttribute("data-action");
      if (action) {
        handleMenuAction(action);
      }
      menuItems.forEach((mi) => mi.setAttribute("aria-expanded", "false"));
      submenuParents.forEach((sp) => sp.setAttribute("aria-expanded", "false"));
    });
  });
}

function attachGlobalKeyboardShortcuts(actions: UiActions): void {
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;
    const isAltPressed = event.altKey;

    if (isModifierPressed && event.key.toLowerCase() === "l") {
      event.preventDefault();
      actions.handleRefresh();
      return;
    }

    if (isModifierPressed && event.key.toLowerCase() === "s" && !event.shiftKey) {
      event.preventDefault();
      actions.saveCurrentNote().catch((error: unknown) => {
        actions.showToast(`Save failed: ${String(error)}`, { persist: true });
      });
      return;
    }

    if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      actions.exportAsJson();
      return;
    }

    if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === "m") {
      event.preventDefault();
      actions.exportAsMarkdown();
      return;
    }

    if (isModifierPressed && event.key.toLowerCase() === "e") {
      event.preventDefault();
      actions.createNewNote().catch((error: unknown) => {
        actions.showToast(`Create note failed: ${String(error)}`, { persist: true });
      });
      return;
    }

    if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === "o") {
      event.preventDefault();
      actions.openWorkspace().catch((error: unknown) => {
        actions.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
      });
      return;
    }

    if (isAltPressed && event.shiftKey && event.key.toLowerCase() === "o") {
      event.preventDefault();
      actions.openWorkspace().catch((error: unknown) => {
        actions.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
      });
    }
  });
}
