import type { DomRefs } from "./types";

function requiredElement<T extends Element>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as unknown as T;
}

export function getDomRefs(): DomRefs {
  return {
    app: requiredElement<HTMLElement>("app"),
    menuBar: requiredElement<HTMLElement>("menuBar"),
    workspaceSidebar: requiredElement<HTMLElement>("workspaceSidebar"),
    sidebarToggleBtn: requiredElement<HTMLButtonElement>("sidebarToggleBtn"),
    refreshBtn: requiredElement<HTMLButtonElement>("refreshBtn"),
    sortBtn: requiredElement<HTMLButtonElement>("sortBtn"),
    searchInput: requiredElement<HTMLInputElement>("searchInput"),
    webmcpNoteModal: requiredElement<HTMLElement>("webmcpNoteModal"),
    webmcpNoteModalBackdrop: requiredElement<HTMLElement>("webmcpNoteModalBackdrop"),
    webmcpNoteModalCloseBtn: requiredElement<HTMLButtonElement>("webmcpNoteModalCloseBtn"),
    webmcpNoteForm: requiredElement<HTMLFormElement>("webmcpNoteForm"),
    webmcpTitleInput: requiredElement<HTMLInputElement>("webmcpTitleInput"),
    webmcpBodyInput: requiredElement<HTMLTextAreaElement>("webmcpBodyInput"),
    webmcpTagInput: requiredElement<HTMLInputElement>("webmcpTagInput"),
    tree: requiredElement<HTMLElement>("tree"),
    tagRow: requiredElement<HTMLElement>("tagRow"),
    workspaceName: requiredElement<HTMLElement>("workspaceName"),
    countsPill: requiredElement<HTMLElement>("countsPill"),
    editor: requiredElement<HTMLTextAreaElement>("editor"),
    preview: requiredElement<HTMLElement>("preview"),
    currentFilename: requiredElement<HTMLElement>("currentFilename"),
    dirtyDot: requiredElement<HTMLElement>("dirtyDot"),
    statusBadge: requiredElement<HTMLElement>("statusBadge"),
    toast: requiredElement<HTMLElement>("toast"),
    toastMsg: requiredElement<HTMLElement>("toastMsg"),
    toastCloseBtn: requiredElement<HTMLButtonElement>("toastCloseBtn"),
    temporarySessionBadge: requiredElement<HTMLElement>("temporarySessionBadge"),
    cogitoToggleBtn: requiredElement<HTMLButtonElement>("cogitoToggleBtn"),
    cogitoPanel: requiredElement<HTMLElement>("cogitoPanel"),
    cogitoLiteBtn: requiredElement<HTMLButtonElement>("cogitoLiteBtn"),
    cogitoDeepBtn: requiredElement<HTMLButtonElement>("cogitoDeepBtn"),
    cogitoGenerateBtn: requiredElement<HTMLButtonElement>("cogitoGenerateBtn"),
    cogitoStatus: requiredElement<HTMLElement>("cogitoStatus"),
    cogitoQuestionList: requiredElement<HTMLElement>("cogitoQuestionList"),
  };
}
