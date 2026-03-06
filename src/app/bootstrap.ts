import { parseTags } from "../tags";
import { getDomRefs } from "./dom";
import { ensurePermission, isFileSystemApiAvailable } from "./fs-api";
import type {
  AppState,
  DirectoryHandleLike,
  DirectoryNode,
  DomRefs,
  FileHandleLike,
  FileNode,
  NoteRecord,
  TreeNode,
} from "./types";

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class InkApp {
  private readonly els: DomRefs;

  private readonly state: AppState;

  private toastTimer: ReturnType<typeof setTimeout> | null;

  constructor(els: DomRefs) {
    this.els = els;
    this.toastTimer = null;
    this.state = {
      workspaceHandle: null,
      workspaceName: "",
      fileTree: null,
      notes: [],
      currentFileHandle: null,
      currentRelPath: "",
      currentContent: "",
      isDirty: false,
      searchQuery: "",
      tagFilter: "",
      sortMode: "name",
      collapsedDirs: new Set<string>(),
      autoRefreshMs: 10000,
      autoRefreshTimer: null,
      isSidebarCollapsed: false,
    };
  }

  initialize(): void {
    if (window.marked) {
      window.marked.setOptions({
        mangle: false,
        headerIds: true,
        breaks: true,
      });
    }

    this.attachEventListeners();
    this.applySidebarState();
    this.updateDirtyUi();
    this.renderTree().catch((error: unknown) => {
      this.showToast(`Failed to render tree: ${String(error)}`, { persist: true });
      this.setStatus("Render failed", "err");
    });
  }

  private attachEventListeners(): void {
    this.els.sidebarToggleBtn.addEventListener("click", () => {
      this.setSidebarCollapsed(!this.state.isSidebarCollapsed);
    });

    this.els.openFolderBtn.addEventListener("click", () => {
      this.openWorkspace().catch((error: unknown) => {
        this.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
      });
    });

    this.els.refreshBtn.addEventListener("click", () => {
      if (!this.state.workspaceHandle) {
        this.showToast("No workspace open.");
        return;
      }

      this.rescanWorkspace().catch((error: unknown) => {
        this.showToast(`Refresh failed: ${String(error)}`, { persist: true });
        this.setStatus("Refresh failed", "err");
      });
    });

    this.els.sortBtn.addEventListener("click", () => {
      this.state.sortMode = this.state.sortMode === "name" ? "modified" : "name";
      this.els.sortBtn.textContent = `Sort: ${this.state.sortMode === "name" ? "Name" : "Last modified"}`;
      this.renderTree().catch((error: unknown) => {
        this.showToast(`Sort render failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.searchInput.addEventListener("input", () => {
      this.state.searchQuery = this.els.searchInput.value;
      this.renderTree().catch((error: unknown) => {
        this.showToast(`Search render failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.editor.addEventListener("input", () => {
      if (!this.state.currentFileHandle) {
        return;
      }

      const text = this.els.editor.value;
      this.state.isDirty = text !== this.state.currentContent;
      this.updateDirtyUi();
      this.renderPreview(text);
    });

    this.els.editor.addEventListener("keydown", (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;

      if (isModifierPressed && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.saveCurrentNote().catch((error: unknown) => {
          this.showToast(`Save failed: ${String(error)}`, { persist: true });
        });
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const start = this.els.editor.selectionStart;
        this.els.editor.setRangeText("  ", start, start, "end");
      }
    });

    this.els.saveBtn.addEventListener("click", () => {
      this.saveCurrentNote().catch((error: unknown) => {
        this.showToast(`Save failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.newNoteBtn.addEventListener("click", () => {
      this.createNewNote().catch((error: unknown) => {
        this.showToast(`Create note failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.newFolderBtn.addEventListener("click", () => {
      this.createNewFolder().catch((error: unknown) => {
        this.showToast(`Create folder failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.toastCloseBtn.addEventListener("click", () => {
      this.els.toast.classList.remove("show");
    });

    window.addEventListener("beforeunload", (event: BeforeUnloadEvent) => {
      if (this.state.isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  private applySidebarState(): void {
    const isCollapsed = this.state.isSidebarCollapsed;
    this.els.app.classList.toggle("sidebar-collapsed", isCollapsed);
    this.els.workspaceSidebar.classList.toggle("collapsed", isCollapsed);
    this.els.sidebarToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    this.els.sidebarToggleBtn.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
    this.els.sidebarToggleBtn.title = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
    this.els.sidebarToggleBtn.textContent = isCollapsed ? "▼ Expand" : "▶ Collapse";
  }

  private setSidebarCollapsed(isCollapsed: boolean): void {
    this.state.isSidebarCollapsed = isCollapsed;
    this.applySidebarState();
  }

  private setStatus(message: string | null, kind: "neutral" | "ok" | "warn" | "err" = "neutral"): void {
    this.els.statusBadge.textContent = message;
    this.els.statusBadge.classList.remove("ok", "warn", "err");
    if (kind !== "neutral") {
      this.els.statusBadge.classList.add(kind);
    }
  }

  private showToast(message: string, options: { persist?: boolean } = {}): void {
    this.els.toastMsg.textContent = message;
    this.els.toast.classList.add("show");

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    if (!options.persist) {
      this.toastTimer = setTimeout(() => {
        this.els.toast.classList.remove("show");
      }, 3500);
    }
  }

  private updateDirtyUi(): void {
    this.els.dirtyDot.classList.toggle("show", this.state.isDirty);
    this.els.saveBtn.disabled = !this.state.currentFileHandle || !this.state.isDirty;

    const openFileName = this.state.currentRelPath
      ? this.state.currentRelPath.split("/").pop()
      : "No note open";
    this.els.currentFilename.textContent = `${openFileName}${this.state.isDirty ? "  • Unsaved" : ""}`;

    if (this.state.isDirty) {
      this.setStatus("Unsaved changes", "warn");
    }
  }

  private renderPreview(text: string): void {
    try {
      this.els.preview.innerHTML = window.marked ? window.marked.parse(text || "") : "";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.els.preview.innerHTML = `<pre>${escapeHtml(message)}</pre>`;
    }
  }

  private async openWorkspace(): Promise<void> {
    if (!isFileSystemApiAvailable()) {
      this.showToast("Your browser doesn't support the File System Access API. Use Chrome/Edge (Chromium).", {
        persist: true,
      });
      this.setStatus("Unsupported browser", "err");
      return;
    }

    try {
      if (!window.showDirectoryPicker) {
        throw new Error("File System Access API not available");
      }

      const directory = await window.showDirectoryPicker({ id: "local-md-workspace", mode: "readwrite" });
      const permissionGranted = await ensurePermission(directory, "readwrite");
      if (!permissionGranted) {
        this.showToast("Permission denied. Please allow access to the folder.", { persist: true });
        this.setStatus("Permission denied", "err");
        return;
      }

      this.state.workspaceHandle = directory;
      this.state.workspaceName = directory.name || "Selected folder";
      this.state.collapsedDirs.clear();
      this.state.tagFilter = "";

      this.els.workspaceName.textContent = this.state.workspaceName;
      this.els.workspaceName.title = this.state.workspaceName;
      this.els.tagRow.innerHTML = "";

      this.setStatus("Scanning folder...");
      await this.rescanWorkspace();
      this.startAutoRefresh();

      this.showToast("Workspace opened.");
      this.setStatus("Workspace ready", "ok");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        this.setStatus("Open folder cancelled");
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Failed to open folder: ${message}`, { persist: true });
      this.setStatus("Failed to open folder", "err");
    }
  }

  private async rescanWorkspace(options: { silent?: boolean } = {}): Promise<void> {
    if (!this.state.workspaceHandle) {
      return;
    }

    try {
      const permissionGranted = await ensurePermission(this.state.workspaceHandle, "read");
      if (!permissionGranted) {
        throw new Error("Folder permission not granted (read)");
      }

      const notes: NoteRecord[] = [];
      const rootNode: DirectoryNode = {
        type: "dir",
        name: this.state.workspaceName,
        relPath: "",
        children: [],
      };

      await this.walkDirectory(this.state.workspaceHandle, rootNode, "", notes);
      await this.enrichNotesWithTags(notes);

      this.state.notes = notes;
      this.state.fileTree = rootNode;

      this.els.countsPill.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;

      this.renderTags();
      await this.renderTree();

      if (!options.silent) {
        this.showToast("Workspace refreshed.");
        this.setStatus("Refreshed", "ok");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Refresh failed: ${message}`, { persist: true });
      this.setStatus("Refresh failed", "err");
    }
  }

  private async walkDirectory(
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
        await this.walkDirectory(handle, directoryNode, relPath, notes);
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
        this.showToast(`Skipped a file that couldn't be read: ${relPath}`);
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

  private async enrichNotesWithTags(notes: NoteRecord[]): Promise<void> {
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

  private renderTags(): void {
    const tagCounts = new Map<string, number>();
    for (const note of this.state.notes) {
      for (const tag of note.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const sorted = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 50);

    this.els.tagRow.innerHTML = "";
    if (sorted.length === 0) {
      return;
    }

    const allButton = document.createElement("button");
    allButton.className = `tag${this.state.tagFilter ? "" : " active"}`;
    allButton.textContent = "All";
    allButton.title = "Clear tag filter";
    allButton.addEventListener("click", () => {
      this.state.tagFilter = "";
      this.renderTags();
      this.renderTree().catch((error: unknown) => {
        this.showToast(`Tag render failed: ${String(error)}`, { persist: true });
      });
    });
    this.els.tagRow.appendChild(allButton);

    for (const [tag, count] of sorted) {
      const button = document.createElement("button");
      button.className = `tag${this.state.tagFilter === tag ? " active" : ""}`;
      button.textContent = `#${tag}`;
      button.title = `${count} note${count === 1 ? "" : "s"} tagged #${tag}`;
      button.addEventListener("click", () => {
        this.state.tagFilter = this.state.tagFilter === tag ? "" : tag;
        this.renderTags();
        this.renderTree().catch((error: unknown) => {
          this.showToast(`Tag render failed: ${String(error)}`, { persist: true });
        });
      });
      this.els.tagRow.appendChild(button);
    }
  }

  private async computeMatches(): Promise<Set<string>> {
    let notes = [...this.state.notes];

    if (this.state.tagFilter) {
      notes = notes.filter((note) => note.tags.has(this.state.tagFilter));
    }

    if (this.state.sortMode === "modified") {
      notes.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    } else {
      notes.sort((a, b) => a.relPath.localeCompare(b.relPath));
    }

    const query = this.state.searchQuery.trim().toLowerCase();
    if (!query) {
      return new Set(notes.map((note) => note.relPath));
    }

    const matches = new Set<string>();
    for (const note of notes) {
      if (note.relPath.toLowerCase().includes(query)) {
        matches.add(note.relPath);
        continue;
      }

      try {
        const file = await note.handle.getFile();
        const text = (await file.text()).toLowerCase();
        if (text.includes(query)) {
          matches.add(note.relPath);
        }
      } catch {
        // Ignore read errors while searching.
      }
    }

    return matches;
  }

  private async renderTree(): Promise<void> {
    if (!this.state.fileTree) {
      this.els.tree.innerHTML = '<div class="small" style="padding: 8px;">Open a folder to begin.</div>';
      return;
    }

    const matches = await this.computeMatches();
    const prunedTree = this.pruneTree(this.state.fileTree, matches);

    this.els.tree.innerHTML = "";
    if (!prunedTree || prunedTree.children.length === 0) {
      this.els.tree.innerHTML = '<div class="small" style="padding: 8px;">No matching notes.</div>';
      return;
    }

    for (const child of prunedTree.children) {
      this.renderNode(child, 0);
    }
  }

  private pruneTree(node: TreeNode, matches: Set<string>): TreeNode | null {
    if (node.type === "file") {
      return matches.has(node.relPath) ? node : null;
    }

    const children: TreeNode[] = [];
    for (const child of node.children) {
      const kept = this.pruneTree(child, matches);
      if (kept) {
        children.push(kept);
      }
    }

    if (node.relPath === "") {
      return {
        ...node,
        children,
      };
    }

    if (children.length === 0) {
      return null;
    }

    return {
      ...node,
      children,
    };
  }

  private renderNode(node: TreeNode, depth: number): void {
    const row = document.createElement("div");
    row.className = "node";
    row.style.paddingLeft = `${8 + depth * 12}px`;

    if (node.type === "dir") {
      const isCollapsed = this.state.collapsedDirs.has(node.relPath);
      row.innerHTML = `
        <span class="icon">${isCollapsed ? "▶" : "▼"}</span>
        <span class="icon">${isCollapsed ? "📁" : "📂"}</span>
        <span class="name">${escapeHtml(node.name)}</span>
      `;

      row.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        if (isCollapsed) {
          this.state.collapsedDirs.delete(node.relPath);
        } else {
          this.state.collapsedDirs.add(node.relPath);
        }

        this.renderTree().catch((error: unknown) => {
          this.showToast(`Tree render failed: ${String(error)}`, { persist: true });
        });
      });

      this.els.tree.appendChild(row);
      if (!isCollapsed) {
        for (const child of node.children) {
          this.renderNode(child, depth + 1);
        }
      }
      return;
    }

    const isActive = node.relPath === this.state.currentRelPath;
    if (isActive) {
      row.classList.add("active");
    }

    const meta =
      this.state.sortMode === "modified" && node.noteRef.lastModified
        ? new Date(node.noteRef.lastModified).toLocaleDateString()
        : "";

    row.innerHTML = `
      <span class="icon">📝</span>
      <span class="name" title="${escapeHtml(node.noteRef.relPath)}">${escapeHtml(node.noteRef.name)}</span>
      <span class="meta">${escapeHtml(meta)}</span>
    `;

    row.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();
      this.openNoteByRelPath(node.relPath, node.handle).catch((error: unknown) => {
        this.showToast(`Open note failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.tree.appendChild(row);
  }

  private async openNoteByRelPath(relPath: string, handleHint: FileHandleLike | null = null): Promise<void> {
    if (this.state.isDirty && this.state.currentFileHandle) {
      const shouldDiscard = confirm("You have unsaved changes. Discard them?");
      if (!shouldDiscard) {
        return;
      }
    }

    try {
      const handle = handleHint || this.state.notes.find((note) => note.relPath === relPath)?.handle;
      if (!handle) {
        throw new Error("File not found");
      }

      const file = await handle.getFile();
      const text = await file.text();

      this.state.currentFileHandle = handle;
      this.state.currentRelPath = relPath;
      this.state.currentContent = text;
      this.state.isDirty = false;

      this.els.editor.value = text;
      this.renderPreview(text);
      this.updateDirtyUi();
      this.setStatus("Opened ✓", "ok");

      await this.renderTree();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Failed to open note: ${message}`, { persist: true });
      this.setStatus("Open failed", "err");
    }
  }

  private async saveCurrentNote(): Promise<void> {
    if (!this.state.currentFileHandle) {
      return;
    }

    try {
      const writable = await this.state.currentFileHandle.createWritable();
      await writable.write(this.els.editor.value);
      await writable.close();

      this.state.currentContent = this.els.editor.value;
      this.state.isDirty = false;
      this.updateDirtyUi();

      this.setStatus("Saved ✓", "ok");
      this.showToast("Saved ✓");

      await this.rescanWorkspace({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Save failed: ${message}`, { persist: true });
      this.setStatus("Save failed", "err");
    }
  }

  private async createNewNote(): Promise<void> {
    if (!this.state.workspaceHandle) {
      this.showToast("Open a workspace first.");
      return;
    }

    if (this.state.isDirty) {
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

    try {
      for await (const [existingName] of this.state.workspaceHandle.entries()) {
        if (existingName === fileName) {
          this.showToast("A file with that name already exists.", { persist: true });
          return;
        }
      }

      const fileHandle = await this.state.workspaceHandle.getFileHandle(fileName, { create: true });
      const initialContent = `# ${name}\n\nCreated ${new Date().toLocaleString()}\n`;

      const writable = await fileHandle.createWritable();
      await writable.write(initialContent);
      await writable.close();

      await this.rescanWorkspace({ silent: true });
      await this.openNoteByRelPath(fileName, fileHandle);

      this.showToast("New note created ✓");
      this.setStatus("New note", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Failed to create note: ${message}`, { persist: true });
      this.setStatus("Create failed", "err");
    }
  }

  private async createNewFolder(parentHandle: DirectoryHandleLike | null = this.state.workspaceHandle): Promise<void> {
    if (!parentHandle) {
      this.showToast("Open a workspace first.");
      return;
    }

    const folderName = prompt("Folder name:");
    if (!folderName) {
      return;
    }

    try {
      await parentHandle.getDirectoryHandle(folderName, { create: true });
      await this.rescanWorkspace({ silent: true });
      this.showToast("Folder created ✓");
      this.setStatus("Folder created", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Failed to create folder: ${message}`, { persist: true });
      this.setStatus("Create folder failed", "err");
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.state.autoRefreshTimer = setInterval(() => {
      this.runAutoRefresh().catch((error: unknown) => {
        this.showToast(`Auto-refresh failed: ${String(error)}`, { persist: true });
        this.setStatus("Auto-refresh failed", "err");
      });
    }, this.state.autoRefreshMs);
  }

  private async runAutoRefresh(): Promise<void> {
    if (!this.state.workspaceHandle) {
      return;
    }

    try {
      const permissionGranted = await ensurePermission(this.state.workspaceHandle, "read");
      if (!permissionGranted) {
        throw new Error("Folder permission revoked.");
      }
    } catch {
      this.stopAutoRefresh();
      this.showToast("Auto-refresh stopped: folder permission revoked.", { persist: true });
      this.setStatus("Permission revoked", "err");
      return;
    }

    if (this.state.isDirty) {
      return;
    }

    await this.rescanWorkspace({ silent: true });
  }

  private stopAutoRefresh(): void {
    if (this.state.autoRefreshTimer) {
      clearInterval(this.state.autoRefreshTimer);
      this.state.autoRefreshTimer = null;
    }
  }
}

export function bootstrapInkApp(): void {
  const app = new InkApp(getDomRefs());
  app.initialize();
}
