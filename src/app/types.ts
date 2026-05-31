export interface PermissionCapableHandle {
  queryPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
  requestPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
}

export interface WritableLike {
  write: (content: string) => Promise<void>;
  close: () => Promise<void>;
}

export interface FileHandleLike extends PermissionCapableHandle {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<WritableLike>;
}

export interface DirectoryHandleLike extends PermissionCapableHandle {
  kind: "directory";
  name: string;
  entries: () => AsyncIterableIterator<[string, FileSystemHandleLike]>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<DirectoryHandleLike>;
}

export type FileSystemHandleLike = FileHandleLike | DirectoryHandleLike;

export interface NoteRecord {
  handle: FileHandleLike;
  name: string;
  relPath: string;
  lastModified: number;
  size: number;
  tags: Set<string>;
}

export interface InMemoryNoteRecord {
  name: string;
  relPath: string;
  content: string;
  lastModified: number;
  tags: Set<string>;
}

export interface DeclarativeNoteInput {
  title: string;
  body: string;
  tag: string;
}

export interface DeclarativeNoteResult {
  ok: boolean;
  message: string;
  notePath?: string;
  sessionType?: "workspace" | "temporary";
  keptCurrentNote?: boolean;
}

export interface FileNode {
  type: "file";
  name: string;
  relPath: string;
  handle: FileHandleLike;
  noteRef: NoteRecord;
}

export interface DirectoryNode {
  type: "dir";
  name: string;
  relPath: string;
  children: TreeNode[];
}

export type TreeNode = FileNode | DirectoryNode;

export interface AppState {
  workspaceHandle: DirectoryHandleLike | null;
  workspaceName: string;
  fileTree: DirectoryNode | null;
  notes: NoteRecord[];
  inMemoryNotes: InMemoryNoteRecord[];
  currentFileHandle: FileHandleLike | null;
  currentRelPath: string;
  currentContent: string;
  isDirty: boolean;
  searchQuery: string;
  tagFilter: string;
  sortMode: "name" | "modified";
  collapsedDirs: Set<string>;
  autoRefreshMs: number;
  autoRefreshTimer: ReturnType<typeof setInterval> | null;
  isSidebarCollapsed: boolean;
  isTemporarySession: boolean;
  isCogitoModeEnabled: boolean;
}

export interface DomRefs {
  app: HTMLElement;
  menuBar: HTMLElement;
  workspaceSidebar: HTMLElement;
  sidebarToggleBtn: HTMLButtonElement;
  refreshBtn: HTMLButtonElement;
  sortBtn: HTMLButtonElement;
  searchInput: HTMLInputElement;
  tree: HTMLElement;
  webmcpNoteModal: HTMLElement;
  webmcpNoteModalBackdrop: HTMLElement;
  webmcpNoteModalCloseBtn: HTMLButtonElement;
  webmcpNoteForm: HTMLFormElement;
  webmcpTitleInput: HTMLInputElement;
  webmcpBodyInput: HTMLTextAreaElement;
  webmcpTagInput: HTMLInputElement;
  tagRow: HTMLElement;
  workspaceName: HTMLElement;
  countsPill: HTMLElement;
  editor: HTMLTextAreaElement;
  preview: HTMLElement;
  currentFilename: HTMLElement;
  dirtyDot: HTMLElement;
  statusBadge: HTMLElement;
  toast: HTMLElement;
  toastMsg: HTMLElement;
  toastCloseBtn: HTMLButtonElement;
  temporarySessionBadge: HTMLElement;
  cogitoToggleBtn: HTMLButtonElement;
  cogitoPanel: HTMLElement;
  cogitoLiteBtn: HTMLButtonElement;
  cogitoDeepBtn: HTMLButtonElement;
  cogitoGenerateBtn: HTMLButtonElement;
  cogitoStatus: HTMLElement;
  cogitoQuestionList: HTMLElement;
  documentLinterToggleBtn: HTMLButtonElement;
  documentLinterPanel: HTMLElement;
  documentLinterAnalyzeBtn: HTMLButtonElement;
  documentLinterExportBtn: HTMLButtonElement;
  documentLinterStatus: HTMLElement;
  documentLinterResults: HTMLElement;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<DirectoryHandleLike>;
    FileSystemHandle?: unknown;
  }
}
