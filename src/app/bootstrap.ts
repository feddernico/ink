import { marked } from "marked";
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
  InMemoryNoteRecord,
  NoteRecord,
  TreeNode,
} from "./types";

function escapeHtml(value: string): string {
  return String(value)
    .replace("&", "&amp;")
    .replace("<", "&lt;")
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
      inMemoryNotes: [],
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
      isTemporarySession: false,
    };
  }

  initialize(): void {
    marked.use({ breaks: true });

    this.updateMenuShortcuts();
    this.attachEventListeners();
    this.loadTheme();
    this.applySidebarState();
    this.updateDirtyUi();
    this.renderTree().catch((error: unknown) => {
      this.showToast(`Failed to render tree: ${String(error)}`, { persist: true });
      this.setStatus("Render failed", "err");
    });
  }

  private updateMenuShortcuts(): void {
    const modifier = this.isMac() ? "Cmd" : "Ctrl";
    const shortcuts = this.els.menuBar.querySelectorAll(".menu-shortcut");
    shortcuts.forEach((el) => {
      const text = el.textContent;
      if (text && text.includes("Ctrl")) {
        el.textContent = text.replace("Ctrl", modifier);
      }
    });
  }

  private attachEventListeners(): void {
    this.attachMenuEventListeners();

    this.els.sidebarToggleBtn.addEventListener("click", () => {
      this.setSidebarCollapsed(!this.state.isSidebarCollapsed);
    });

    this.els.openFolderBtn.addEventListener("click", () => {
      this.openWorkspace().catch((error: unknown) => {
        this.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
      });
    });

    this.els.refreshBtn.addEventListener("click", () => {
      this.handleRefresh();
    });

    this.els.sortBtn.addEventListener("click", () => {
      this.toggleSort();
    });

    this.els.searchInput.addEventListener("input", () => {
      this.state.searchQuery = this.els.searchInput.value;
      this.renderTree().catch((error: unknown) => {
        this.showToast(`Search render failed: ${String(error)}`, { persist: true });
      });
    });

    this.els.editor.addEventListener("input", () => {
      if (!this.state.currentRelPath) {
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

    this.els.exportJsonBtn.addEventListener("click", () => {
      this.exportAsJson();
    });

    this.els.exportMdBtn.addEventListener("click", () => {
      this.exportAsMarkdown();
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

    this.attachGlobalKeyboardShortcuts();
  }

  private attachMenuEventListeners(): void {
    const menuItems = this.els.menuBar.querySelectorAll(".menu-item");
    
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

    document.addEventListener("click", () => {
      menuItems.forEach((mi) => mi.setAttribute("aria-expanded", "false"));
    });

    const dropdownItems = this.els.menuBar.querySelectorAll(".dropdown li[data-action]");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", () => {
        const action = item.getAttribute("data-action");
        if (action) {
          this.handleMenuAction(action);
        }
        menuItems.forEach((mi) => mi.setAttribute("aria-expanded", "false"));
      });
    });
  }

  private handleMenuAction(action: string): void {
    switch (action) {
      case "new-note":
        this.createNewNote().catch((error: unknown) => {
          this.showToast(`Create note failed: ${String(error)}`, { persist: true });
        });
        break;
      case "new-folder":
        this.createNewFolder().catch((error: unknown) => {
          this.showToast(`Create folder failed: ${String(error)}`, { persist: true });
        });
        break;
      case "open-workspace":
        this.openWorkspace().catch((error: unknown) => {
          this.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
        });
        break;
      case "close-workspace":
        this.closeWorkspace();
        break;
      case "exit":
        this.handleExit();
        break;
      case "save":
        this.saveCurrentNote().catch((error: unknown) => {
          this.showToast(`Save failed: ${String(error)}`, { persist: true });
        });
        break;
      case "save-as":
        this.saveAsNewNote().catch((error: unknown) => {
          this.showToast(`Save As failed: ${String(error)}`, { persist: true });
        });
        break;
      case "refresh":
        this.handleRefresh();
        break;
      case "sort":
        this.toggleSort();
        break;
      case "collapse-sidebar":
        this.setSidebarCollapsed(!this.state.isSidebarCollapsed);
        break;
      case "export-json":
        this.exportAsJson();
        break;
      case "export-markdown":
        this.exportAsMarkdown();
        break;
      case "theme-default":
      case "theme-classic":
      case "theme-cobalt":
      case "theme-monokai":
      case "theme-office":
      case "theme-twilight":
      case "theme-xcode": {
        const themeName = action.replace("theme-", "");
        this.applyTheme(themeName);
        break;
      }
    }
  }

  private readonly VALID_THEMES = ["default", "classic", "cobalt", "monokai", "office", "twilight", "xcode"];

  private applyTheme(theme: string): void {
    if (!this.VALID_THEMES.includes(theme)) {
      return;
    }

    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }

    try {
      localStorage.setItem("ink-theme", theme);
    } catch {
    }

    document.querySelectorAll(".menu-theme-check").forEach((el) => {
      el.classList.remove("active");
    });
    const checkEl = document.getElementById(`themeCheck-${theme}`);
    if (checkEl) {
      checkEl.classList.add("active");
    }
  }

  private loadTheme(): void {
    let savedTheme = "default";
    try {
      savedTheme = localStorage.getItem("ink-theme") ?? "default";
    } catch {
    }
    this.applyTheme(this.VALID_THEMES.includes(savedTheme) ? savedTheme : "default");
  }

  private toggleSort(): void {
    this.state.sortMode = this.state.sortMode === "name" ? "modified" : "name";
    this.els.sortBtn.textContent = `Sort: ${this.state.sortMode === "name" ? "Name" : "Last modified"}`;
    
    const sortMenuItem = document.querySelector('[data-action="sort"] .menu-label');
    if (sortMenuItem) {
      sortMenuItem.textContent = `Sort: ${this.state.sortMode === "name" ? "Name" : "Modified"}`;
    }
    
    this.renderTree().catch((error: unknown) => {
      this.showToast(`Sort render failed: ${String(error)}`, { persist: true });
    });
  }

  private handleRefresh(): void {
    if (this.state.isTemporarySession) {
      this.showToast("Refresh not available in temporary session. Your data is in memory.");
      return;
    }

    if (!this.state.workspaceHandle) {
      this.showToast("No workspace open.");
      return;
    }

    this.rescanWorkspace().catch((error: unknown) => {
      this.showToast(`Refresh failed: ${String(error)}`, { persist: true });
      this.setStatus("Refresh failed", "err");
    });
  }

  private closeWorkspace(): void {
    this.stopAutoRefresh();
    this.state.workspaceHandle = null;
    this.state.workspaceName = "";
    this.state.fileTree = null;
    this.state.notes = [];
    this.state.currentFileHandle = null;
    this.state.currentRelPath = "";
    this.state.currentContent = "";
    this.state.isDirty = false;
    this.state.searchQuery = "";
    this.state.tagFilter = "";
    this.state.collapsedDirs.clear();

    this.els.workspaceName.textContent = "No folder selected";
    this.els.workspaceName.title = "No folder selected";
    this.els.countsPill.textContent = "0 notes";
    this.els.tagRow.innerHTML = "";
    this.els.tree.innerHTML = '<div class="small" style="padding: 8px;">Open a folder to begin.</div>';
    this.els.editor.value = "";
    this.els.preview.innerHTML = "";
    this.els.currentFilename.textContent = "No note open";
    this.els.dirtyDot.classList.remove("show");
    this.els.saveBtn.disabled = true;
    this.els.exportJsonBtn.disabled = true;
    this.els.exportMdBtn.disabled = true;

    this.setStatus("Ready");
    this.showToast("Workspace closed.");
  }

  private handleExit(): void {
    if (this.state.isDirty) {
      const shouldExit = confirm("You have unsaved changes. Are you sure you want to exit?");
      if (!shouldExit) {
        return;
      }
    }
    window.close();
  }

  private attachGlobalKeyboardShortcuts(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;
      const isAltPressed = event.altKey;

      // Handle Ctrl/Cmd + L (Refresh)
      if (isModifierPressed && event.key.toLowerCase() === "l") {
        event.preventDefault();
        this.handleRefresh();
        return;
      }

      // Handle Ctrl/Cmd + S (Save)
      if (isModifierPressed && event.key.toLowerCase() === "s" && !event.shiftKey) {
        event.preventDefault();
        this.saveCurrentNote().catch((error: unknown) => {
          this.showToast(`Save failed: ${String(error)}`, { persist: true });
        });
        return;
      }

      // Handle Ctrl/Cmd + Shift + S (Export JSON)
      if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.exportAsJson();
        return;
      }

      // Handle Ctrl/Cmd + Shift + M (Export Markdown)
      if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        this.exportAsMarkdown();
        return;
      }

      // Handle Ctrl/Cmd + E (New Note)
      if (isModifierPressed && event.key.toLowerCase() === "e") {
        event.preventDefault();
        this.createNewNote().catch((error: unknown) => {
          this.showToast(`Create note failed: ${String(error)}`, { persist: true });
        });
        return;
      }

      // Handle Cmd/Ctrl + Shift + O (Open Workspace)
      if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        // console.log("Cmd/Ctrl+Shift+O detected, calling openWorkspace");
        this.openWorkspace().catch((error: unknown) => {
          this.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
        });
        return;
      }

      // Handle Alt + Shift + O (Open Workspace) as fallback
      if (isAltPressed && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        // console.log("Alt+Shift+O detected, calling openWorkspace");
        this.openWorkspace().catch((error: unknown) => {
          this.showToast(`Failed to open workspace: ${String(error)}`, { persist: true });
        });
        return;
      }
    });
  }

  private isMac(): boolean {
    return navigator.platform.toLowerCase().includes("mac");
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
    const hasNote = this.state.currentRelPath && (this.state.currentFileHandle || this.state.isTemporarySession);
    this.els.saveBtn.disabled = !hasNote || !this.state.isDirty;
    this.els.exportMdBtn.disabled = !this.state.currentRelPath;

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
      this.els.preview.innerHTML = marked.parse(text || "") as string;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.els.preview.innerHTML = `<pre>${escapeHtml(message)}</pre>`;
    }
  }

  private async openWorkspace(): Promise<void> {
    if (!isFileSystemApiAvailable()) {
      this.state.isTemporarySession = true;
      this.state.workspaceName = "Temporary Session";
      this.state.inMemoryNotes = [];
      this.state.isDirty = false;
      this.state.currentRelPath = "";
      this.state.currentContent = "";
      this.state.fileTree = null;

      this.els.workspaceName.textContent = this.state.workspaceName;
      this.els.workspaceName.title = "Temporary Session - Data not persisted";
      this.els.temporarySessionBadge.style.display = "inline";
      this.els.countsPill.textContent = "0 notes";
      this.els.tagRow.innerHTML = "";
      this.els.tree.innerHTML = '<div class="small" style="padding: 8px;">Temporary session. Create a note to begin.</div>';
      this.els.exportJsonBtn.disabled = true;
      this.els.exportMdBtn.disabled = true;

      this.showToast("Temporary in-memory workspace enabled. Use Export to save your notes.", {
        persist: true,
      });
      this.setStatus("Temporary session", "warn");
      return;
    }

    this.els.temporarySessionBadge.style.display = "none";
    this.els.exportJsonBtn.disabled = true;
    this.els.exportMdBtn.disabled = true;

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
    const notes = this.state.isTemporarySession ? this.state.inMemoryNotes : this.state.notes;

    for (const note of notes) {
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
      if (this.state.isTemporarySession) {
        this.renderInMemoryTree();
      } else {
        this.renderTree().catch((error: unknown) => {
          this.showToast(`Tag render failed: ${String(error)}`, { persist: true });
        });
      }
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
        if (this.state.isTemporarySession) {
          this.renderInMemoryTree();
        } else {
          this.renderTree().catch((error: unknown) => {
            this.showToast(`Tag render failed: ${String(error)}`, { persist: true });
          });
        }
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
    if (!prunedTree || prunedTree.type !== "dir" || prunedTree.children.length === 0) {
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
    if (this.state.isTemporarySession) {
      return this.saveInMemoryNote();
    }

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
    if (!this.state.workspaceHandle && !this.state.isTemporarySession) {
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

    if (this.state.isTemporarySession) {
      return this.createInMemoryNote(fileName, name);
    }

    try {
      if (!this.state.workspaceHandle) {
        throw new Error("Workspace handle is not available");
      }

      const workspaceHandle = this.state.workspaceHandle;
      for await (const [existingName] of workspaceHandle.entries()) {
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

  private async saveAsNewNote(): Promise<void> {
    if (!this.state.workspaceHandle && !this.state.isTemporarySession) {
      this.showToast("Open a workspace first.");
      return;
    }

    const currentContent = this.state.isTemporarySession
      ? this.els.editor.value
      : this.state.currentContent;

    if (!currentContent) {
      this.showToast("Nothing to save.");
      return;
    }

    const name = prompt("Save note as (filename without .md):");
    if (!name) {
      return;
    }

    const fileName = name.endsWith(".md") ? name : `${name}.md`;

    if (this.state.isTemporarySession) {
      return this.createInMemoryNote(fileName, name);
    }

    try {
      if (!this.state.workspaceHandle) {
        throw new Error("Workspace handle is not available");
      }

      for await (const [existingName] of this.state.workspaceHandle.entries()) {
        if (existingName === fileName) {
          this.showToast("A file with that name already exists.", { persist: true });
          return;
        }
      }

      const fileHandle = await this.state.workspaceHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(currentContent);
      await writable.close();

      await this.rescanWorkspace({ silent: true });
      await this.openNoteByRelPath(fileName, fileHandle);

      this.showToast(`Saved as ${fileName} ✓`);
      this.setStatus("Saved as", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showToast(`Failed to save: ${message}`, { persist: true });
      this.setStatus("Save failed", "err");
    }
  }

  private async createNewFolder(parentHandle: DirectoryHandleLike | null = this.state.workspaceHandle): Promise<void> {
    if (!parentHandle) {
      if (this.state.isTemporarySession) {
        this.showToast("Folders are not supported in temporary session.");
        return;
      }
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

  private async createInMemoryNote(fileName: string, name: string): Promise<void> {
    const existingNote = this.state.inMemoryNotes.find((n) => n.relPath === fileName);
    if (existingNote) {
      this.showToast("A note with that name already exists.", { persist: true });
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

    this.state.inMemoryNotes.push(note);
    this.state.currentRelPath = fileName;
    this.state.currentContent = initialContent;
    this.state.isDirty = false;

    this.els.editor.value = initialContent;
    this.renderPreview(initialContent);
    this.updateDirtyUi();
    this.renderInMemoryTree();
    this.updateCountsPill();
    this.enableExportButtons();

    this.showToast("New note created ✓");
    this.setStatus("New note", "ok");
  }

  private renderInMemoryTree(): void {
    this.els.tree.innerHTML = "";

    if (this.state.inMemoryNotes.length === 0) {
      this.els.tree.innerHTML = '<div class="small" style="padding: 8px;">Temporary session. Create a note to begin.</div>';
      return;
    }

    const sortedNotes = [...this.state.inMemoryNotes].sort((a, b) => a.relPath.localeCompare(b.relPath));

    for (const note of sortedNotes) {
      const row = document.createElement("div");
      row.className = "node";

      const isActive = note.relPath === this.state.currentRelPath;
      if (isActive) {
        row.classList.add("active");
      }

      const meta = this.state.sortMode === "modified" ? new Date(note.lastModified).toLocaleDateString() : "";

      row.innerHTML = `
        <span class="icon">📝</span>
        <span class="name" title="${escapeHtml(note.relPath)}">${escapeHtml(note.name)}</span>
        <span class="meta">${escapeHtml(meta)}</span>
      `;

      row.addEventListener("click", () => {
        this.openInMemoryNote(note.relPath);
      });

      this.els.tree.appendChild(row);
    }
  }

  private async openInMemoryNote(relPath: string): Promise<void> {
    if (this.state.isDirty && this.state.currentRelPath) {
      const shouldDiscard = confirm("You have unsaved changes. Discard them?");
      if (!shouldDiscard) {
        return;
      }
    }

    const note = this.state.inMemoryNotes.find((n) => n.relPath === relPath);
    if (!note) {
      this.showToast("Note not found", { persist: true });
      return;
    }

    this.state.currentRelPath = relPath;
    this.state.currentContent = note.content;
    this.state.isDirty = false;

    this.els.editor.value = note.content;
    this.renderPreview(note.content);
    this.updateDirtyUi();
    this.setStatus("Opened ✓", "ok");

    this.renderInMemoryTree();
  }

  private async saveInMemoryNote(): Promise<void> {
    if (!this.state.currentRelPath || !this.state.isTemporarySession) {
      return;
    }

    const note = this.state.inMemoryNotes.find((n) => n.relPath === this.state.currentRelPath);
    if (!note) {
      this.showToast("Note not found", { persist: true });
      return;
    }

    note.content = this.els.editor.value;
    note.lastModified = Date.now();
    note.tags = parseTags(note.content);

    this.state.currentContent = note.content;
    this.state.isDirty = false;
    this.updateDirtyUi();

    this.setStatus("Saved ✓", "ok");
    this.showToast("Saved ✓");

    this.renderInMemoryTree();
    this.renderTags();
  }

  private updateCountsPill(): void {
    const count = this.state.inMemoryNotes.length;
    this.els.countsPill.textContent = `${count} note${count === 1 ? "" : "s"}`;
  }

  private enableExportButtons(): void {
    this.els.exportJsonBtn.disabled = this.state.inMemoryNotes.length === 0;
    this.els.exportMdBtn.disabled = !this.state.currentRelPath;
  }

  private exportAsJson(): void {
    if (this.state.inMemoryNotes.length === 0) {
      this.showToast("No notes to export.");
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      notes: this.state.inMemoryNotes.map((note) => ({
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

    this.showToast(`Exported ${this.state.inMemoryNotes.length} note(s) as JSON.`);
    this.setStatus("Exported JSON", "ok");
  }

  private exportAsMarkdown(): void {
    if (!this.state.currentRelPath) {
      this.showToast("No note selected to export.");
      return;
    }

    const note = this.state.inMemoryNotes.find((n) => n.relPath === this.state.currentRelPath);
    if (!note) {
      this.showToast("Note not found.", { persist: true });
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

    this.showToast(`Exported ${note.name} as Markdown.`);
    this.setStatus("Exported MD", "ok");
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
