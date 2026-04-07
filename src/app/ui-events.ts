import type { AppState, DeclarativeNoteInput, DeclarativeNoteResult, DomRefs } from "./types";

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
  createNoteFromTool: (input: DeclarativeNoteInput) => Promise<DeclarativeNoteResult>; 
  openWorkspace: () => Promise<void>;
  exportAsJson: () => void;
  exportAsMarkdown: () => void;
  toggleCogitoPanel: () => void;
  selectCogitoModel: (model: "lite" | "deep") => void;
  generateCogitoQuestions: () => Promise<void>;
  insertCogitoQuestion: (index: number) => void;
  hideToast: () => void;
  showToast: ToastFn;
};

type WebMcpSubmitEvent = SubmitEvent & {
  agentInvoked?: boolean;
  respondWith?: (response: Promise<unknown>) => void;
};

type WebMcpInputElement = HTMLInputElement | HTMLTextAreaElement;

export function attachUiEvents({
  state,
  els,
  actions,
}: {
  state: AppState;
  els: DomRefs;
  actions: UiActions;
}): void {
  let wasWebMcpModalShownByAgent = false;
  let webMcpAutofillSignature = getWebMcpValueSignature(els);
  let webMcpWatcherTimer: ReturnType<typeof window.setInterval> | null = null;

  function openWebMcpModal(options?: { focusTitle?: boolean }): void {
    els.webmcpNoteModal.setAttribute("aria-hidden", "false");
    els.webmcpNoteModal.classList.add("show");

    if (options?.focusTitle) {
      queueMicrotask(() => {
        els.webmcpTitleInput.focus();
      });
    }
  }

  function closeWebMcpModal(): void {
    els.webmcpNoteModal.classList.remove("show");
    els.webmcpNoteModal.setAttribute("aria-hidden", "true");
  }

  function showWebMcpModalForAgent(options?: { focusTitle?: boolean }): void {
    wasWebMcpModalShownByAgent = true;
    openWebMcpModal(options);
  }

  function toggleWebMcpModalForDebug(): void {
    if (els.webmcpNoteModal.classList.contains("show")) {
      closeWebMcpModal();
      return;
    }
    openWebMcpModal({ focusTitle: true });
  }

  function syncWebMcpModalToAutofill(): void {
    const nextSignature = getWebMcpValueSignature(els);
    if (nextSignature === webMcpAutofillSignature) {
      return;
    }

    webMcpAutofillSignature = nextSignature;

    if (hasAnyWebMcpValue(els)) {
      showWebMcpModalForAgent();
    }
  }

  function startWebMcpAutofillWatcher(): void {
    if (webMcpWatcherTimer !== null) {
      return;
    }

    webMcpWatcherTimer = window.setInterval(() => {
      syncWebMcpModalToAutofill();
    }, 150);
  }

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

  const webMcpInputs: WebMcpInputElement[] = [
    els.webmcpTitleInput,
    els.webmcpBodyInput,
    els.webmcpTagInput,
  ];

  webMcpInputs.forEach((input) => {
    input.addEventListener("input", syncWebMcpModalToAutofill);
    input.addEventListener("change", syncWebMcpModalToAutofill);
    input.addEventListener("focus", () => {
      if (!els.webmcpNoteModal.classList.contains("show")) {
        showWebMcpModalForAgent();
      }
    });
  });

  webMcpInputs.forEach((input) => {
    instrumentWebMcpValueSetter(input, syncWebMcpModalToAutofill);
  });

  els.webmcpNoteModalCloseBtn.addEventListener("click", () => {
    closeWebMcpModal();
  });

  els.webmcpNoteModalBackdrop.addEventListener("click", () => {
    closeWebMcpModal();
  });

  els.webmcpNoteForm.addEventListener("submit", (event: Event) => {
    const submitEvent = event as WebMcpSubmitEvent;
    const isAgentSubmission = typeof submitEvent.respondWith === "function";
    event.preventDefault();

    if (submitEvent.agentInvoked) {
      showWebMcpModalForAgent();
    }

    const input: DeclarativeNoteInput = {
      title: els.webmcpTitleInput.value,
      body: els.webmcpBodyInput.value,
      tag: els.webmcpTagInput.value,
    };

    const resultPromise = actions.createNoteFromTool(input).then((result) => {
      if (result.ok) {
        if (!isAgentSubmission) {
          els.webmcpNoteForm.reset();
          webMcpAutofillSignature = getWebMcpValueSignature(els);
        }
        if (wasWebMcpModalShownByAgent) {
          closeWebMcpModal();
          wasWebMcpModalShownByAgent = false;
        }
      }
      return result;
    });

    if (typeof submitEvent.respondWith === "function") {
      submitEvent.respondWith(resultPromise);
      return;
    }

    resultPromise.catch((error: unknown) => {
      actions.showToast(`WebMCP note creation failed: ${String(error)}`, { persist: true });
    });
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

  els.cogitoLiteBtn.addEventListener("click", () => {
    actions.selectCogitoModel("lite");
  });

  els.cogitoDeepBtn.addEventListener("click", () => {
    actions.selectCogitoModel("deep");
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

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && els.webmcpNoteModal.classList.contains("show")) {
      closeWebMcpModal();
    }
  });

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;

    if (isModifierPressed && event.altKey && event.key.toLowerCase() === "n") {
      event.preventDefault();
      toggleWebMcpModalForDebug();
    }
  });

  if (shouldOpenWebMcpModalForDebug()) {
    openWebMcpModal({ focusTitle: true });
  }

  startWebMcpAutofillWatcher();

  attachGlobalKeyboardShortcuts(actions);
}

function getWebMcpValueSignature(els: DomRefs): string {
  return [
    els.webmcpTitleInput.value,
    els.webmcpBodyInput.value,
    els.webmcpTagInput.value,
  ].join("\u241f");
}

function hasAnyWebMcpValue(els: DomRefs): boolean {
  return (
    els.webmcpTitleInput.value.trim() !== "" ||
    els.webmcpBodyInput.value.trim() !== "" ||
    els.webmcpTagInput.value.trim() !== ""
  );
}

function instrumentWebMcpValueSetter(
  element: WebMcpInputElement,
  onValueSet: () => void,
): void {
  const prototype = Object.getPrototypeOf(element) as HTMLInputElement | HTMLTextAreaElement;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (!descriptor?.get || !descriptor.set) {
    return;
  }

  Object.defineProperty(element, "value", {
    configurable: true,
    enumerable: descriptor.enumerable ?? true,
    get() {
      return descriptor.get!.call(this) as string;
    },
    set(nextValue: string) {
      descriptor.set!.call(this, nextValue);
      onValueSet();
    },
  });
}

function shouldOpenWebMcpModalForDebug(): boolean {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("debugWebMcpNote") === "1";
  } catch {
    return false;
  }
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
