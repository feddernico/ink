import type { DomRefs } from "./types";

function requiredElement<T extends Element>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as T;
}

export function getDomRefs(): DomRefs {
  return {
    openFolderBtn: requiredElement<HTMLButtonElement>("openFolderBtn"),
    refreshBtn: requiredElement<HTMLButtonElement>("refreshBtn"),
    sortBtn: requiredElement<HTMLButtonElement>("sortBtn"),
    searchInput: requiredElement<HTMLInputElement>("searchInput"),
    tree: requiredElement<HTMLElement>("tree"),
    tagRow: requiredElement<HTMLElement>("tagRow"),
    workspaceName: requiredElement<HTMLElement>("workspaceName"),
    countsPill: requiredElement<HTMLElement>("countsPill"),
    editor: requiredElement<HTMLTextAreaElement>("editor"),
    preview: requiredElement<HTMLElement>("preview"),
    currentFilename: requiredElement<HTMLElement>("currentFilename"),
    dirtyDot: requiredElement<HTMLElement>("dirtyDot"),
    saveBtn: requiredElement<HTMLButtonElement>("saveBtn"),
    statusBadge: requiredElement<HTMLElement>("statusBadge"),
    toast: requiredElement<HTMLElement>("toast"),
    toastMsg: requiredElement<HTMLElement>("toastMsg"),
    toastCloseBtn: requiredElement<HTMLButtonElement>("toastCloseBtn"),
    newNoteBtn: requiredElement<HTMLButtonElement>("newNoteBtn"),
    newFolderBtn: requiredElement<HTMLButtonElement>("newFolderBtn"),
  };
}
