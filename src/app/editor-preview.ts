import { marked } from "marked";
import { escapeHtml } from "./utils";
import type { AppState, DomRefs } from "./types";
import type { StatusKind } from "./toast-status";

export type EditorViewMode = "split" | "source" | "preview";

export const EDITOR_VIEW_MODE_STORAGE_KEY = "ink-editor-view-mode";
export const VALID_EDITOR_VIEW_MODES: EditorViewMode[] = ["split", "source", "preview"];

function normalizeEditorViewMode(value: string | null): EditorViewMode {
  if (value === "source" || value === "preview") {
    return value;
  }
  return "split";
}

export function loadEditorViewMode(): EditorViewMode {
  try {
    return normalizeEditorViewMode(localStorage.getItem(EDITOR_VIEW_MODE_STORAGE_KEY));
  } catch {
    return "split";
  }
}

export function applyEditorViewMode(els: DomRefs, mode: EditorViewMode): void {
  els.editorSplit.classList.toggle("view-split", mode === "split");
  els.editorSplit.classList.toggle("view-source", mode === "source");
  els.editorSplit.classList.toggle("view-preview", mode === "preview");

  els.editorPane.hidden = mode === "preview";
  els.previewPane.hidden = mode === "source";

  const buttons: Array<[HTMLButtonElement, EditorViewMode]> = [
    [els.editorViewSourceBtn, "source"],
    [els.editorViewSplitBtn, "split"],
    [els.editorViewPreviewBtn, "preview"],
  ];

  buttons.forEach(([button, buttonMode]) => {
    const isActive = buttonMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

export function setEditorViewMode(els: DomRefs, state: AppState, mode: EditorViewMode): void {
  if (!VALID_EDITOR_VIEW_MODES.includes(mode)) {
    return;
  }

  state.editorViewMode = mode;
  applyEditorViewMode(els, mode);

  try {
    localStorage.setItem(EDITOR_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore localStorage errors
  }
}

export function renderPreview(els: DomRefs, text: string): void {
  try {
    els.preview.innerHTML = marked.parse(text || "") as string;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    els.preview.innerHTML = `<pre>${escapeHtml(message)}</pre>`;
  }
}

export function updateDirtyUi(
  els: DomRefs,
  state: AppState,
  setStatus: (message: string | null, kind?: StatusKind) => void,
): void {
  els.dirtyDot.classList.toggle("show", state.isDirty);

  const openFileName = state.currentRelPath
    ? state.currentRelPath.split("/").pop()
    : "No note open";
  els.currentFilename.textContent = `${openFileName}${state.isDirty ? "  • Unsaved" : ""}`;

  if (state.isDirty) {
    setStatus("Unsaved changes", "warn");
  }
}
