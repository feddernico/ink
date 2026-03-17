import { marked } from "marked";
import { escapeHtml } from "./utils";
import type { AppState, DomRefs } from "./types";
import type { StatusKind } from "./toast-status";

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
