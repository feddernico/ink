import { icon } from "./icons";
import type {
  AppState,
  DirectoryHandleLike,
  DirectoryNode,
  DomRefs,
  FileHandleLike,
  FileNode,
  InMemoryNoteRecord,
  NoteRecord,
  TreeNode,
} from "./types";

type ToastFn = (message: string, options?: { persist?: boolean }) => void;
type StatusFn = (message: string | null, kind?: "neutral" | "ok" | "warn" | "err") => void;

type RenderPreviewFn = (els: DomRefs, text: string) => void;
type UpdateDirtyFn = (els: DomRefs, state: AppState, setStatus: StatusFn) => void;

type TreeRenderFns = {
  renderTree: () => Promise<void>;
  renderInMemoryTree: () => void;
  renderTags: () => void;
  updateCountsPill: () => void;
};

type FsApi = {
  ensurePermission: (handle: DirectoryHandleLike, mode: "read" | "readwrite") => Promise<boolean>;
  isFileSystemApiAvailable: () => boolean;
};

type AutoRefreshFns = {
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
};

type TagParser = (text: string) => Set<string>;

export function createWorkspaceActions({
  state,
  els,
  showToast,
  setStatus,
  renderPreview,
  updateDirtyUi,
  renderTree,
  renderInMemoryTree,
  renderTags,
  updateCountsPill,
  fsApi,
  parseTags,
  autoRefresh,
}: {
  state: AppState;
  els: DomRefs;
  showToast: ToastFn;
  setStatus: StatusFn;
  renderPreview: RenderPreviewFn;
  updateDirtyUi: UpdateDirtyFn;
  renderTree: TreeRenderFns["renderTree"];
  renderInMemoryTree: TreeRenderFns["renderInMemoryTree"];
  renderTags: TreeRenderFns["renderTags"];
  updateCountsPill: TreeRenderFns["updateCountsPill"];
  fsApi: FsApi;
  parseTags: TagParser;
  autoRefresh: AutoRefreshFns;
}) {
  async function openWorkspace(): Promise<void> {
    if (!fsApi.isFileSystemApiAvailable()) {
      state.isTemporarySession = true;
      state.workspaceName = "Temporary Session";
      state.inMemoryNotes = [];
      state.isDirty = false;
      state.currentRelPath = "";
      state.currentContent = "";
      state.fileTree = null;

      els.workspaceName.textContent = state.workspaceName;
      els.workspaceName.title = "Temporary Session - Data not persisted";
      els.temporarySessionBadge.style.display = "inline";
      els.countsPill.textContent = "0 notes";
      els.tagRow.innerHTML = "";
      els.tree.innerHTML =
        '<div class="small" style="padding: 8px;">Temporary session. Create a note to begin.</div>';

      showToast("Temporary in-memory workspace enabled. Use Export to save your notes.", {
        persist: true,
      });
      setStatus("Temporary session", "warn");
      return;
    }

    els.temporarySessionBadge.style.display = "none";

    try {
      if (!window.showDirectoryPicker) {
        throw new Error("File System Access API not available");
      }

      const directory = await window.showDirectoryPicker({ id: "local-md-workspace", mode: "readwrite" });
      const permissionGranted = await fsApi.ensurePermission(directory, "readwrite");
      if (!permissionGranted) {
        showToast("Permission denied. Please allow access to the folder.", { persist: true });
        setStatus("Permission denied", "err");
        return;
      }

      state.workspaceHandle = directory;
      state.workspaceName = directory.name || "Selected folder";
      state.collapsedDirs.clear();
      state.tagFilter = "";

      els.workspaceName.textContent = state.workspaceName;
      els.workspaceName.title = state.workspaceName;
      els.tagRow.innerHTML = "";

      setStatus("Scanning folder...");
      await rescanWorkspace();
      autoRefresh.startAutoRefresh();

      showToast("Workspace opened.");
      setStatus("Workspace ready", "ok");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus("Open folder cancelled");
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to open folder: ${message}`, { persist: true });
      setStatus("Failed to open folder", "err");
    }
  }

  async function rescanWorkspace(options: { silent?: boolean } = {}): Promise<void> {
    if (!state.workspaceHandle) {
      return;
    }

    try {
      const permissionGranted = await fsApi.ensurePermission(state.workspaceHandle, "read");
      if (!permissionGranted) {
        throw new Error("Folder permission not granted (read)");
      }

      const notes: NoteRecord[] = [];
      const rootNode: DirectoryNode = {
        type: "dir",
        name: state.workspaceName,
        relPath: "",
        children: [],
      };

      await walkDirectory(state.workspaceHandle, rootNode, "", notes);
      await enrichNotesWithTags(notes);

      state.notes = notes;
      state.fileTree = rootNode;

      els.countsPill.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;

      renderTags();
      await renderTree();

      if (!options.silent) {
        showToast("Workspace refreshed.");
        setStatus("Refreshed", "ok");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Refresh failed: ${message}`, { persist: true });
      setStatus("Refresh failed", "err");
    }
  }

  async function walkDirectory(
    dirHandle: DirectoryHandleLike,
    parentNode: DirectoryNode,
    relPathBase: string,
    notes: NoteRecord[],
  ): Promise<void> {
    for await (const [name, handle] of dirHandle.entries()) {
      if (name.startsWith(".")) {
        continue;
      }

      if (handle.kind === "directory") {
        const relPath = relPathBase ? `${relPathBase}/${name}` : name;
        const directoryNode: DirectoryNode = {
          type: "dir",
          name,
          relPath,
          children: [],
        };

        parentNode.children.push(directoryNode);
        await walkDirectory(handle, directoryNode, relPath, notes);
        continue;
      }

      if (!name.toLowerCase().endsWith(".md")) {
        continue;
      }

      const relPath = relPathBase ? `${relPathBase}/${name}` : name;
      let lastModified = 0;
      let size = 0;

      try {
        const file = await handle.getFile();
        lastModified = file.lastModified || 0;
        size = file.size || 0;
      } catch {
        showToast(`Skipped a file that couldn't be read: ${relPath}`);
        continue;
      }

      const note: NoteRecord = {
        handle,
        name,
        relPath,
        lastModified,
        size,
        tags: new Set<string>(),
      };

      notes.push(note);
      const fileNode: FileNode = {
        type: "file",
        name,
        relPath,
        handle,
        noteRef: note,
      };

      parentNode.children.push(fileNode);
    }

    parentNode.children.sort((a: TreeNode, b: TreeNode) => {
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async function enrichNotesWithTags(notes: NoteRecord[]): Promise<void> {
    const MAX_BYTES = 256 * 1024;

    for (const note of notes) {
      try {
        const file = await note.handle.getFile();
        const blob = file.size > MAX_BYTES ? file.slice(0, MAX_BYTES) : file;
        const text = await blob.text();
        note.tags = parseTags(text);
      } catch {
        note.tags = new Set<string>();
      }
    }
  }

  async function openNoteByRelPath(relPath: string, handleHint: FileHandleLike | null = null): Promise<void> {
    if (state.isDirty && state.currentFileHandle) {
      const shouldDiscard = confirm("You have unsaved changes. Discard them?");
      if (!shouldDiscard) {
        return;
      }
    }

    try {
      const handle = handleHint || state.notes.find((note) => note.relPath === relPath)?.handle;
      if (!handle) {
        throw new Error("File not found");
      }

      const file = await handle.getFile();
      const text = await file.text();

      state.currentFileHandle = handle;
      state.currentRelPath = relPath;
      state.currentContent = text;
      state.isDirty = false;

      els.editor.value = text;
      renderPreview(els, text);
      updateDirtyUi(els, state, setStatus);
      setStatus(`${icon.check()} Opened`, "ok");

      await renderTree();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to open note: ${message}`, { persist: true });
      setStatus("Open failed", "err");
    }
  }

  async function saveCurrentNote(): Promise<void> {
    if (state.isTemporarySession) {
      return saveInMemoryNote();
    }

    if (!state.currentFileHandle) {
      return;
    }

    try {
      const writable = await state.currentFileHandle.createWritable();
      await writable.write(els.editor.value);
      await writable.close();

      state.currentContent = els.editor.value;
      state.isDirty = false;
      updateDirtyUi(els, state, setStatus);

      setStatus(`${icon.check()} Saved`, "ok");
      showToast(`${icon.check()} Saved`);

      await rescanWorkspace({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Save failed: ${message}`, { persist: true });
      setStatus("Save failed", "err");
    }
  }

  async function createNewNote(): Promise<void> {
    if (!state.workspaceHandle && !state.isTemporarySession) {
      showToast("Open a workspace first.");
      return;
    }

    if (state.isDirty) {
      const shouldContinue = confirm("You have unsaved changes. Continue and discard them?");
      if (!shouldContinue) {
        return;
      }
    }

    const name = prompt("New note name (without .md)");
    if (!name) {
      return;
    }

    const fileName = name.endsWith(".md") ? name : `${name}.md`;

    if (state.isTemporarySession) {
      return createInMemoryNote(fileName, name);
    }

    try {
      if (!state.workspaceHandle) {
        throw new Error("Workspace handle is not available");
      }

      const workspaceHandle = state.workspaceHandle;
      for await (const [existingName] of workspaceHandle.entries()) {
        if (existingName === fileName) {
          showToast("A file with that name already exists.", { persist: true });
          return;
        }
      }

      const fileHandle = await state.workspaceHandle.getFileHandle(fileName, { create: true });
      const initialContent = `# ${name}\n\nCreated ${new Date().toLocaleString()}\n`;

      const writable = await fileHandle.createWritable();
      await writable.write(initialContent);
      await writable.close();

      await rescanWorkspace({ silent: true });
      await openNoteByRelPath(fileName, fileHandle);

      showToast(`${icon.check()} New note created`);
      setStatus("New note", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to create note: ${message}`, { persist: true });
      setStatus("Create failed", "err");
    }
  }

  async function saveAsNewNote(): Promise<void> {
    if (!state.workspaceHandle && !state.isTemporarySession) {
      showToast("Open a workspace first.");
      return;
    }

    const currentContent = state.isTemporarySession ? els.editor.value : state.currentContent;

    if (!currentContent) {
      showToast("Nothing to save.");
      return;
    }

    const name = prompt("Save note as (filename without .md):");
    if (!name) {
      return;
    }

    const fileName = name.endsWith(".md") ? name : `${name}.md`;

    if (state.isTemporarySession) {
      return createInMemoryNote(fileName, name);
    }

    try {
      if (!state.workspaceHandle) {
        throw new Error("Workspace handle is not available");
      }

      for await (const [existingName] of state.workspaceHandle.entries()) {
        if (existingName === fileName) {
          showToast("A file with that name already exists.", { persist: true });
          return;
        }
      }

      const fileHandle = await state.workspaceHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(currentContent);
      await writable.close();

      await rescanWorkspace({ silent: true });
      await openNoteByRelPath(fileName, fileHandle);

      showToast(`${icon.check()} Saved as ${fileName}`);
      setStatus("Saved as", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to save: ${message}`, { persist: true });
      setStatus("Save failed", "err");
    }
  }

  async function createNewFolder(parentHandle: DirectoryHandleLike | null = state.workspaceHandle): Promise<void> {
    if (!parentHandle) {
      if (state.isTemporarySession) {
        showToast("Folders are not supported in temporary session.");
        return;
      }
      showToast("Open a workspace first.");
      return;
    }

    const folderName = prompt("Folder name:");
    if (!folderName) {
      return;
    }

    try {
      await parentHandle.getDirectoryHandle(folderName, { create: true });
      await rescanWorkspace({ silent: true });
      showToast(`${icon.check()} Folder created`);
      setStatus("Folder created", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to create folder: ${message}`, { persist: true });
      setStatus("Create folder failed", "err");
    }
  }

  async function createInMemoryNote(fileName: string, name: string): Promise<void> {
    const existingNote = state.inMemoryNotes.find((n) => n.relPath === fileName);
    if (existingNote) {
      showToast("A note with that name already exists.", { persist: true });
      return;
    }

    const initialContent = `# ${name}\n\nCreated ${new Date().toLocaleString()}\n`;

    const note: InMemoryNoteRecord = {
      name: fileName,
      relPath: fileName,
      content: initialContent,
      lastModified: Date.now(),
      tags: parseTags(initialContent),
    };

    state.inMemoryNotes.push(note);
    state.currentRelPath = fileName;
    state.currentContent = initialContent;
    state.isDirty = false;

    els.editor.value = initialContent;
    renderPreview(els, initialContent);
    updateDirtyUi(els, state, setStatus);
    renderInMemoryTree();
    updateCountsPill();

    showToast("New note created ✓");
    setStatus("New note", "ok");
  }

  async function openInMemoryNote(relPath: string): Promise<void> {
    if (state.isDirty && state.currentRelPath) {
      const shouldDiscard = confirm("You have unsaved changes. Discard them?");
      if (!shouldDiscard) {
        return;
      }
    }

    const note = state.inMemoryNotes.find((n) => n.relPath === relPath);
    if (!note) {
      showToast("Note not found", { persist: true });
      return;
    }

    state.currentRelPath = relPath;
    state.currentContent = note.content;
    state.isDirty = false;

    els.editor.value = note.content;
    renderPreview(els, note.content);
    updateDirtyUi(els, state, setStatus);
    setStatus("Opened ✓", "ok");

    renderInMemoryTree();
  }

  async function saveInMemoryNote(): Promise<void> {
    if (!state.currentRelPath || !state.isTemporarySession) {
      return;
    }

    const note = state.inMemoryNotes.find((n) => n.relPath === state.currentRelPath);
    if (!note) {
      showToast("Note not found", { persist: true });
      return;
    }

    note.content = els.editor.value;
    note.lastModified = Date.now();
    note.tags = parseTags(note.content);

    state.currentContent = note.content;
    state.isDirty = false;
    updateDirtyUi(els, state, setStatus);

    setStatus("Saved ✓", "ok");
    showToast("Saved ✓");

    renderInMemoryTree();
    renderTags();
  }

  function exportAsJson(): void {
    if (state.inMemoryNotes.length === 0) {
      showToast("No notes to export.");
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      notes: state.inMemoryNotes.map((note) => ({
        name: note.name,
        path: note.relPath,
        content: note.content,
        lastModified: new Date(note.lastModified).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const fileName = `ink-export-${date}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${state.inMemoryNotes.length} note(s) as JSON.`);
    setStatus("Exported JSON", "ok");
  }

  function exportAsMarkdown(): void {
    if (!state.currentRelPath) {
      showToast("No note selected to export.");
      return;
    }

    const note = state.inMemoryNotes.find((n) => n.relPath === state.currentRelPath);
    if (!note) {
      showToast("Note not found.", { persist: true });
      return;
    }

    const blob = new Blob([note.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = note.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${note.name} as Markdown.`);
    setStatus("Exported MD", "ok");
  }

  function handleRefresh(): void {
    if (state.isTemporarySession) {
      showToast("Refresh not available in temporary session. Your data is in memory.");
      return;
    }

    if (!state.workspaceHandle) {
      showToast("No workspace open.");
      return;
    }

    rescanWorkspace().catch((error: unknown) => {
      showToast(`Refresh failed: ${String(error)}`, { persist: true });
      setStatus("Refresh failed", "err");
    });
  }

  function closeWorkspace(): void {
    autoRefresh.stopAutoRefresh();
    state.workspaceHandle = null;
    state.workspaceName = "";
    state.fileTree = null;
    state.notes = [];
    state.currentFileHandle = null;
    state.currentRelPath = "";
    state.currentContent = "";
    state.isDirty = false;
    state.searchQuery = "";
    state.tagFilter = "";
    state.collapsedDirs.clear();

    els.workspaceName.textContent = "No folder selected";
    els.workspaceName.title = "No folder selected";
    els.countsPill.textContent = "0 notes";
    els.tagRow.innerHTML = "";
    els.tree.innerHTML = '<div class="small" style="padding: 8px;">Open a folder to begin.</div>';
    els.editor.value = "";
    els.preview.innerHTML = "";
    els.currentFilename.textContent = "No note open";
    els.dirtyDot.classList.remove("show");

    setStatus("Ready");
    showToast("Workspace closed.");
  }

  return {
    openWorkspace,
    rescanWorkspace,
    openNoteByRelPath,
    saveCurrentNote,
    createNewNote,
    saveAsNewNote,
    createNewFolder,
    createInMemoryNote,
    openInMemoryNote,
    saveInMemoryNote,
    exportAsJson,
    exportAsMarkdown,
    handleRefresh,
    closeWorkspace,
  };
}
