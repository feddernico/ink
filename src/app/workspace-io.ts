import { icon } from "./icons";
import type {
  AppState,
  DeclarativeNoteInput,
  DeclarativeNoteResult,
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

type RescanOptions = {
  silent?: boolean;
  throwOnError?: boolean;
  showProgress?: boolean;
};

type DiscoveredNote = {
  handle: FileHandleLike;
  name: string;
  relPath: string;
  parentNode: DirectoryNode;
};

type TagParser = (text: string) => Set<string>;
type TagNormalizer = (value: string) => string;
const FILE_READ_CONCURRENCY = 4;

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
  normalizeTag,
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
  normalizeTag: TagNormalizer;
  autoRefresh: AutoRefreshFns;
}) {
  let isOpeningWorkspace = false;
  let activeRescan: Promise<boolean> | null = null;
  let activeRescanHandle: DirectoryHandleLike | null = null;
  let scanGeneration = 0;

  function recordWorkspaceInteraction(): void {
    state.lastWorkspaceInteractionAt = Date.now();
  }

  function cancelActiveScan(): void {
    scanGeneration += 1;
    activeRescan = null;
    activeRescanHandle = null;
  }

  function activateTemporarySession(): void {
    const wasTemporarySession = state.isTemporarySession;

    state.workspaceHandle = null;
    state.workspaceName = "Temporary Session";
    state.fileTree = null;
    state.notes = [];
    state.currentFileHandle = null;

    if (!wasTemporarySession) {
      state.inMemoryNotes = [];
      state.currentRelPath = "";
      state.currentContent = "";
      state.isDirty = false;
      els.editor.value = "";
      renderPreview(els, "");
      updateDirtyUi(els, state, setStatus);
    }

    state.isTemporarySession = true;

    els.workspaceName.textContent = state.workspaceName;
    els.workspaceName.title = "Temporary Session - Data not persisted";
    els.temporarySessionBadge.style.display = "inline";
    els.countsPill.textContent = `${state.inMemoryNotes.length} note${state.inMemoryNotes.length === 1 ? "" : "s"}`;
    els.tagRow.innerHTML = "";
    renderInMemoryTree();
    renderTags();
  }

  function buildNoteFileName(title: string): string {
    const sanitizedTitle = title
      .trim()
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const baseName = sanitizedTitle || "Untitled";
    return baseName.endsWith(".md") ? baseName : `${baseName}.md`;
  }

  function buildNoteContent({ title, body, tag }: DeclarativeNoteInput): string {
    const normalizedTitle = title.trim() || "Untitled";
    const normalizedBody = body.trim();
    const normalizedTag = normalizeTag(tag);
    const sections: string[] = [];

    if (normalizedTag) {
      sections.push("---", `tags: [${normalizedTag}]`, "---", "");
    }

    sections.push(`# ${normalizedTitle}`);

    if (normalizedBody) {
      sections.push("", normalizedBody);
    }

    return sections.join("\n");
  }

  async function openWorkspace(): Promise<void> {
    if (!fsApi.isFileSystemApiAvailable()) {
      activateTemporarySession();
      els.tree.innerHTML = '<div class="small" style="padding: 8px;">Temporary session. Create a note to begin.</div>';

      showToast("Temporary in-memory workspace enabled. Use Export to save your notes.", {
        persist: true,
      });
      setStatus("Temporary session", "warn");
      return;
    }

    if (isOpeningWorkspace) {
      setStatus("Folder picker already open", "warn");
      return;
    }

    isOpeningWorkspace = true;
    cancelActiveScan();
    recordWorkspaceInteraction();
    autoRefresh.stopAutoRefresh();
    setStatus("Choose a workspace folder...");

    try {
      if (!window.showDirectoryPicker) {
        throw new Error("File System Access API not available");
      }

      const directory = await window.showDirectoryPicker({ id: "local-md-workspace", mode: "readwrite" });
      setStatus("Checking folder access...");
      const permissionGranted = await fsApi.ensurePermission(directory, "readwrite");
      if (!permissionGranted) {
        showToast("Permission denied. Please allow access to the folder.", { persist: true });
        setStatus("Permission denied", "err");
        return;
      }

      state.workspaceHandle = directory;
      state.workspaceName = directory.name || "Selected folder";
      state.isTemporarySession = false;
      state.collapsedDirs.clear();
      state.tagFilter = "";

      els.temporarySessionBadge.style.display = "none";
      els.workspaceName.textContent = state.workspaceName;
      els.workspaceName.title = state.workspaceName;
      els.tagRow.innerHTML = "";

      setStatus("Scanning folder...");
      await rescanWorkspace({ silent: true, throwOnError: true, showProgress: true });
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
    } finally {
      isOpeningWorkspace = false;
    }
  }

  async function rescanWorkspace(options: RescanOptions = {}): Promise<boolean> {
    if (!state.workspaceHandle) {
      return false;
    }

    if (activeRescan && activeRescanHandle === state.workspaceHandle) {
      return activeRescan;
    }

    const workspaceHandle = state.workspaceHandle;
    const workspaceName = state.workspaceName;
    const currentScanGeneration = scanGeneration + 1;
    scanGeneration = currentScanGeneration;

    const scanPromise = (async () => {
      const permissionGranted = await fsApi.ensurePermission(workspaceHandle, "read");
      if (!permissionGranted) {
        throw new Error("Folder permission not granted (read)");
      }

      const notes: NoteRecord[] = [];
      const discoveredNotes: DiscoveredNote[] = [];
      const rootNode: DirectoryNode = {
        type: "dir",
        name: workspaceName,
        relPath: "",
        children: [],
      };

      await walkDirectory(workspaceHandle, rootNode, "", discoveredNotes);
      if (scanGeneration !== currentScanGeneration) {
        return false;
      }
      await hydrateDiscoveredNotes(
        discoveredNotes,
        notes,
        options.showProgress === true,
        currentScanGeneration,
      );
      sortDirectoryTree(rootNode);

      if (
        state.workspaceHandle !== workspaceHandle
        || scanGeneration !== currentScanGeneration
      ) {
        return false;
      }

      state.notes = notes;
      state.fileTree = rootNode;

      els.countsPill.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;

      renderTags();
      await renderTree();

      if (!options.silent) {
        showToast("Workspace refreshed.");
        setStatus("Refreshed", "ok");
      }
      return true;
    })().catch((error: unknown) => {
        if (options.throwOnError) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        showToast(`Refresh failed: ${message}`, { persist: true });
        setStatus("Refresh failed", "err");
        return false;
      });

    activeRescanHandle = workspaceHandle;
    const trackedScanPromise = scanPromise.finally(() => {
      if (activeRescan === trackedScanPromise) {
        activeRescan = null;
        activeRescanHandle = null;
      }
    });
    activeRescan = trackedScanPromise;

    return activeRescan;
  }

  async function walkDirectory(
    dirHandle: DirectoryHandleLike,
    parentNode: DirectoryNode,
    relPathBase: string,
    discoveredNotes: DiscoveredNote[],
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
        await walkDirectory(handle, directoryNode, relPath, discoveredNotes);
        continue;
      }

      if (!name.toLowerCase().endsWith(".md")) {
        continue;
      }

      const relPath = relPathBase ? `${relPathBase}/${name}` : name;
      discoveredNotes.push({
        handle: handle as FileHandleLike,
        name,
        relPath,
        parentNode,
      });
    }
  }

  async function hydrateDiscoveredNotes(
    discoveredNotes: DiscoveredNote[],
    notes: NoteRecord[],
    showProgress: boolean,
    currentScanGeneration: number,
  ): Promise<void> {
    const MAX_BYTES = 256 * 1024;
    let nextIndex = 0;
    let completedCount = 0;

    async function hydrateNext(): Promise<void> {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= discoveredNotes.length) {
        return;
      }
      if (scanGeneration !== currentScanGeneration) {
        return;
      }

      const discovered = discoveredNotes[index];
      try {
        const file = await discovered.handle.getFile();
        const blob = file.size > MAX_BYTES ? file.slice(0, MAX_BYTES) : file;
        const text = await blob.text();
        const note: NoteRecord = {
          handle: discovered.handle,
          name: discovered.name,
          relPath: discovered.relPath,
          lastModified: file.lastModified || 0,
          size: file.size || 0,
          tags: parseTags(text),
        };
        notes.push(note);
        const fileNode: FileNode = {
          type: "file",
          name: discovered.name,
          relPath: discovered.relPath,
          handle: discovered.handle,
          noteRef: note,
        };
        discovered.parentNode.children.push(fileNode);
      } catch {
        showToast(`Skipped a file that couldn't be read: ${discovered.relPath}`);
      } finally {
        completedCount += 1;
        if (
          showProgress
          && (completedCount === discoveredNotes.length || completedCount % 25 === 0)
        ) {
          setStatus(`Loading notes ${completedCount}/${discoveredNotes.length}...`);
        }
      }

      if (scanGeneration === currentScanGeneration) {
        await hydrateNext();
      }
    }

    const workerCount = Math.min(FILE_READ_CONCURRENCY, discoveredNotes.length);
    await Promise.all(Array.from({ length: workerCount }, () => hydrateNext()));
  }

  function sortDirectoryTree(directory: DirectoryNode): void {
    for (const child of directory.children) {
      if (child.type === "dir") {
        sortDirectoryTree(child);
      }
    }

    directory.children.sort((a: TreeNode, b: TreeNode) => {
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async function openNoteByRelPath(relPath: string, handleHint: FileHandleLike | null = null): Promise<void> {
    if (state.isDirty && state.currentFileHandle) {
      const shouldDiscard = confirm("You have unsaved changes. Discard them?");
      if (!shouldDiscard) {
        return;
      }
    }

    cancelActiveScan();
    recordWorkspaceInteraction();

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
      setStatus("Opened ✓", "ok");

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

    cancelActiveScan();
    recordWorkspaceInteraction();

    try {
      const writable = await state.currentFileHandle.createWritable();
      await writable.write(els.editor.value);
      await writable.close();

      state.currentContent = els.editor.value;
      state.isDirty = false;
      updateDirtyUi(els, state, setStatus);

      setStatus("Saved ✓", "ok");
      showToast("Saved ✓");

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

      showToast("New note created ✓");
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

      showToast(`Saved as ${fileName} ✓`);
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
      showToast("Folder created ✓");
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

  async function createNoteFromTool(input: DeclarativeNoteInput): Promise<DeclarativeNoteResult> {
    const title = input.title.trim();
    const body = input.body.trim();
    const tag = input.tag.trim();

    if (!title || !body) {
      const message = "Title and body are required.";
      showToast(message, { persist: true });
      setStatus("Create failed", "err");
      return { ok: false, message };
    }

    if (!state.workspaceHandle && !state.isTemporarySession) {
      activateTemporarySession();
      showToast("Temporary in-memory workspace enabled for note creation.", {
        persist: true,
      });
      setStatus("Temporary session", "warn");
    }

    const fileName = buildNoteFileName(title);
    const content = buildNoteContent({ title, body, tag });
    const keptCurrentNote = state.isDirty;
    const successMessage = keptCurrentNote
      ? `Created ${fileName}. Current unsaved note was left open.`
      : `Created ${fileName} ✓`;

    if (state.isTemporarySession) {
      const existingNote = state.inMemoryNotes.find((note) => note.relPath === fileName);
      if (existingNote) {
        const message = "A note with that name already exists.";
        showToast(message, { persist: true });
        setStatus("Create failed", "err");
        return { ok: false, message };
      }

      const note: InMemoryNoteRecord = {
        name: fileName,
        relPath: fileName,
        content,
        lastModified: Date.now(),
        tags: parseTags(content),
      };

      state.inMemoryNotes.push(note);

      if (!keptCurrentNote) {
        state.currentRelPath = fileName;
        state.currentContent = content;
        state.isDirty = false;
        els.editor.value = content;
        renderPreview(els, content);
        updateDirtyUi(els, state, setStatus);
      }

      renderInMemoryTree();
      renderTags();
      updateCountsPill();
      showToast(successMessage);
      setStatus("New note", "ok");

      return {
        ok: true,
        message: successMessage,
        notePath: fileName,
        sessionType: "temporary",
        keptCurrentNote,
      };
    }

    try {
      if (!state.workspaceHandle) {
        throw new Error("Workspace handle is not available");
      }

      for await (const [existingName] of state.workspaceHandle.entries()) {
        if (existingName === fileName) {
          const message = "A file with that name already exists.";
          showToast(message, { persist: true });
          setStatus("Create failed", "err");
          return { ok: false, message };
        }
      }

      const fileHandle = await state.workspaceHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      await rescanWorkspace({ silent: true });

      if (!keptCurrentNote) {
        await openNoteByRelPath(fileName, fileHandle);
      } else {
        setStatus("New note", "ok");
      }

      showToast(successMessage);
      return {
        ok: true,
        message: successMessage,
        notePath: fileName,
        sessionType: "workspace",
        keptCurrentNote,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to create note: ${message}`, { persist: true });
      setStatus("Create failed", "err");
      return { ok: false, message };
    }
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

    cancelActiveScan();
    recordWorkspaceInteraction();
    rescanWorkspace().catch((error: unknown) => {
      showToast(`Refresh failed: ${String(error)}`, { persist: true });
      setStatus("Refresh failed", "err");
    });
  }

  function closeWorkspace(): void {
    autoRefresh.stopAutoRefresh();
    cancelActiveScan();
    recordWorkspaceInteraction();
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
    createNoteFromTool,
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
