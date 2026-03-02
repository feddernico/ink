import { parseTags } from "./tags";

declare global {
  interface Window {
    marked?: {
      setOptions: (options: { mangle: boolean; headerIds: boolean; breaks: boolean }) => void;
      parse: (markdown: string) => string;
    };
    showDirectoryPicker?: (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<any>;
    FileSystemHandle?: unknown;
  }
}

    /*******************************************************************************
     * Local Markdown Workspace (single-file app)
     * 
     * Major decisions (documented, per prompt):
     * - Search: filename + content search is implemented by scanning file
     *   contents (debounced) across all .md files. To keep things responsive,
     *   content scanning is capped (by bytes) per file and debounced when typing.
     * - Auto-refresh: periodic rescan every 10 seconds. The current open file
     *   is NOT auto-reloded to avoid overwriting in-editor changes; instead,
     *   the tree updates and the user can manually refresh/open the file again.
     * - Folder tree: shown as a collapsible tree of directories, with markdown
     *   files as leaves. Collapse state is preserved in-memory.
     * - Tags v1: aggregated tag list derived from (a) YAML frontmatter "tags"
     *   field or (b) inline #tags. Tags are used as a filter in the sidebar.
     * - Failure handling: all errors show user-facing toasts and status badges.
     *******************************************************************************/

    // -------- External libs config --------
    // Prevent marked from using raw HTML by default (safer).
    // Note: This is a lightweight hardening; still treat local files as untrusted.
    if (window.marked) {
      window.marked.setOptions({
        mangle: false,
        headerIds: true,
        breaks: true,
      });
    }

    // -------- App state --------
    const state: {
      workspaceHandle: any;
      workspaceName: string;
      fileTree: any;
      notes: { handle: any; name: any; relPath: any; lastModified: number; size: number; tags: Set<unknown> }[];
      currentFileHandle: any;
      currentRelPath: string;
      currentContent: string;
      isDirty: boolean;
      searchQuery: string;
      tagFilter: string;
      sortMode: string;
      collapsedDirs: Set<string>;
      autoRefreshMs: number;
      autoRefreshTimer: any;
      searchScanDebounceTimer: any;
      lastContentSearchToken: number;
    } = {
      workspaceHandle: null,
      workspaceName: "",
      // fileTree is a hieararchical structure for rendering.
      fileTree: null,
      // flat list of notes for search/sort/filter
      notes: [], // { handle, name, relPath, lastModified, size, tags:Set<string> }
      currentFileHandle: null,
      currentRelPath: "",
      currentContent: "",
      isDirty: false,
      searchQuery: "",
      tagFilter: "", // single tag (v1)
      sortMode: "name", // 'name' | 'modified'
      // tree UI state
      collapsedDirs: new Set(), // relPath dir key
      // auto-refresh
      autoRefreshMs: 10000,
      autoRefreshTimer: null,
      // search content scan control
      searchScanDebounceTimer: null,
      lastContentSearchToken: 0,
    };

    // -------- DOM refs --------
    const els = {
      openFolderBtn: document.getElementById("openFolderBtn"),
      refreshBtn: document.getElementById("refreshBtn"),
      sortBtn: document.getElementById("sortBtn"),
      searchInput: document.getElementById("searchInput") as HTMLInputElement,
      tree: document.getElementById("tree"),
      tagRow: document.getElementById("tagRow"),
      workspaceName: document.getElementById("workspaceName"),
      countsPill: document.getElementById("countsPill"),
      editor: document.getElementById("editor") as HTMLTextAreaElement,
      preview: document.getElementById("preview"),
      currentFilename: document.getElementById("currentFilename"),
      dirtyDot: document.getElementById("dirtyDot"),
      saveBtn: document.getElementById("saveBtn") as HTMLButtonElement,
      statusBadge: document.getElementById("statusBadge"),
      toast: document.getElementById("toast"),
      toastMsg: document.getElementById("toastMsg"),
      toastCloseBtn: document.getElementById("toastCloseBtn"),
      newNoteBtn: document.getElementById("newNoteBtn") as HTMLButtonElement,
      newFolderBtn: document.getElementById("newFolderBtn") as HTMLButtonElement,
    };

    // -------- Utilities --------
    const sleep = (ms: number | undefined) => new Promise((r) => setTimeout(r, ms));

    function setStatus(message: string | null, kind = "neutral") {
      // kind: neutral | ok | warn | err
      if (!els.statusBadge) return;
      els.statusBadge.textContent = message;
      els.statusBadge.classList.remove("ok", "warn", "err");
      if (kind === "ok") els.statusBadge.classList.add("ok");
      if (kind === "warn") els.statusBadge.classList.add("warn");
      if (kind === "err") els.statusBadge.classList.add("err");
    }

    let toastTimer: string | number | NodeJS.Timeout | null | undefined = null;
    function showToast(message: string | null, { persist = false } = {}) {
      if (!els.toastMsg || !els.toast) return;
      els.toastMsg.textContent = message;
      els.toast.classList.add("show");
      if (toastTimer) clearTimeout(toastTimer);
      if (!persist) {
        toastTimer = setTimeout(() => {
          if (els.toast) els.toast.classList.remove("show");
        }, 3500);
      }
    }

    function humanDate(ms: string | number | Date) {
      try {
        const d = new Date(ms);
        return d.toLocaleString();
      } catch {
        return "";
      }
    }

    function escapeHTML(str: string) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function debounce(fn: (...args: any[]) => void, ms: number | undefined) {
      let t: string | number | NodeJS.Timeout | null | undefined = null;
      return (...args: any[]) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
      };
    }

    function updateDirtyUI() {
      if (els.dirtyDot) els.dirtyDot.classList.toggle("show", state.isDirty);
      if (els.saveBtn) els.saveBtn.disabled = !state.currentFileHandle || !state.isDirty;
      if (els.currentFilename) {
        const name = state.currentRelPath ? state.currentRelPath.split("/").pop() : "No note open";
        els.currentFilename.textContent = name + (state.isDirty ? "  • Unsaved" : "");
      }
      if (state.isDirty) {
        setStatus("Unsaved changes", "warn");
      }
    }

    function isFsApiAvailable() {
      return !!(window.showDirectoryPicker && window.FileSystemHandle);
    }

    // -------- Permission handlins --------
    async function ensurePermission(handle: any, mode = "read") {
      // mode: 'read' | 'readwrite'
      if (!handle) return false;

      const opts = mode === "readwrite" ? { mode: "readwrite" } : { mode: "read" };

      // If already granted:
      if (handle.queryPermission) {
        const q = await handle.queryPermission(opts);
        if (q === "granted") return true;
        const r = await handle.requestPermission(opts);
        return r === "granted";
      }

      // Older implementations may not support queryPermission/requestPermission on all handles.
      return true;
    }

    // -------- File system: scanning workspace --------
    async function openWorkspace() {
      if (!isFsApiAvailable()) {
        showToast("Your browser doesn't support the File System Access API. Use Chrome/Edge (Chromium).", { persist: true });
        setStatus("Unsupported browser", "err");
        return;
      }

      try {
        if (!window.showDirectoryPicker) {
          throw new Error("File System Access API not available");
        }
        const dir = await window.showDirectoryPicker({ id: "local-md-workspace", mode: "readwrite" });
        const ok = await ensurePermission(dir, "readwrite");
        if (!ok) {
          showToast("Permission denied. Please allow access to the folder.", { persist: true });
          setStatus("Permission denied", "err");
          return;
        }

        state.workspaceHandle = dir;
        state.workspaceName = dir.name || "Selected folder";
        if (els.workspaceName) {
          els.workspaceName.textContent = state.workspaceName;
          els.workspaceName.title = state.workspaceName;
        }

        state.collapsedDirs = new Set(); // reset collapses on new workspace
        state.tagFilter = "";
        if (els.tagRow) els.tagRow.innerHTML = "";

        setStatus("Scanning folder...");
        await rescanWorkspace();
        startAutoRefresh();

        showToast("Workspace opened.");
        setStatus("Workspace ready", "ok");
      } catch (err) {
        if (err && (err as Error).name === "AbortError") {
          setStatus("Open folder cancelled");
          return;
        }
        showToast("Failed to open folder: " + ((err as Error)?.message || String(err)), { persist: true });
        setStatus("Failed to open folder", "err");
      }
    }

    async function rescanWorkspace({ silent = false } = {}) {
      if (!state.workspaceHandle) return;

      try {
        const ok = await ensurePermission(state.workspaceHandle, "read");
        if (!ok) throw new Error("Folder permission not granted (read)");

        const notes: { handle: any; name: any; relPath: any; lastModified: number; size: number; tags: Set<unknown>; }[] = [];
        const rootNode = { type: "dir", name: state.workspaceName, relPath: "", children: [] };

        //Recursively walk directory
        async function walkDir(dirHandle: any[], parentNode: { type?: string; name?: any; relPath?: any; children: any; }, relPathBase: string) {
          // Iterate directory entries
          for await (const [name, handle] of dirHandle.entries()) {
            // Skip hidden/system-ish files (reasonable default; documented decision)
            const nameStr = String(name);
            if (nameStr.startsWith(".")) continue;

            if (handle.kind === "directory") {
              const rel = relPathBase ? (relPathBase + "/" + nameStr) : nameStr;
              const node = { type: "dir", name, relPath: rel, children: [] };
              parentNode.children.push(node);
              await walkDir(handle, node, rel);
            } else if (handle.kind === "file") {
              if (!nameStr.toLowerCase().endsWith(".md")) continue;
              const rel = relPathBase ? (relPathBase + "/" + nameStr) : nameStr;

              let lastModified = 0;
              let size = 0;
              try {
                const file = await handle.getFile();
                lastModified = file.lastModified || 0;
                size = file.size || 0;
              } catch (e) {
                // If file disappears mid-scan, skip and warn.
                showToast(`Skipped a file that couldn't be read: ${rel}`);
                continue;
              }

              const note = {
                handle,
                name,
                relPath: rel,
                lastModified,
                size,
                tags: new Set(),
              };
              notes.push(note);

              parentNode.children.push({ type: "file", name, relPath: rel, handle, noteRef: note });
            }
          }

          // Keep tree stable: sort children (dirs first, then files)
          parentNode.children.sort((a: { type: string; name: string; },b: { type: any; name: any; }) => {
            if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        }

        await walkDir(state.workspaceHandle, rootNode, "");

        // Extract tags (lightweight) for all notes. We do a fast partial read.
        // Decision: Read up to 256KB per file to keep scanning snappy.
        await enrichNotesWithTags(notes);

        state.notes = notes;
        state.fileTree = rootNode;

        // Update counts
        if (els.countsPill) {
          els.countsPill.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;
        }

        // Update tags UI
        renderTags();

        // Render tree (with current search/tag/sort filters applied)
        await renderTree();

        if (!silent) showToast("Workspace refreshed.");
        if (!silent) setStatus("Refreshed", "ok");
      } catch (err) {
        showToast("Refresh failed: " + ((err as Error)?.message || String(err)), { persist: true });
        setStatus("Refresh failed", "err");
      }
    }

    // -------- Create new note --------
    async function createNewNote() {
      if (!state.workspaceHandle) {
        showToast("Open a workspace first.");
        return;
      }

      if (state.isDirty) {
        const ok = confirm("You have unsaved changes. Continue and discard them?");
        if (!ok) return;
      }

      const name = prompt("New note name (without .md)");
      if (!name) return;

      const fileName = name.endsWith(".md") ? name : `${name}.md`;

      try {
        // Check if the fie already exists
        for await (const [existing] of state.workspaceHandle.entries()) {
          if (existing === fileName) { 
            showToast("A file with that name already exists.", { persist: true });
            return;
          }
        }

        // Create file
        const fileHandle = await state.workspaceHandle.getFileHandle(fileName, {
          create: true
        });

        // Initial content (safe default)
        const initialContent = 
    `# ${name}

    Created ${new Date().toLocaleString()}
    `;

        const writable = await fileHandle.createWritable();
        await writable.write(initialContent);
        await writable.close();

        // Refresh workspace + open file
        await rescanWorkspace({ silent: true });
        await openNoteByRelPath(fileName, fileHandle);

        showToast("New note created ✓");
        setStatus("New note", "ok");

      } catch (err) {
        showToast("Failed to create note: " + ((err as Error)?.message || String(err)), { persist: true });
        setStatus("Create failed", "err");
      }
    }

    // -------- Create folder --------
    async function createNewFolder(parentHandle = state.workspaceHandle) {
      if (!parentHandle) {
        showToast("Open a workspace first.");
        return;
      }

      const name = prompt("Folder name:");
      if (!name) return;

      try {
        await parentHandle.getDirectoryHandle(name, { create: true });
        await rescanWorkspace({ silent: true });

        showToast("Folder created ✓");
        setStatus("Folder created", "ok");
      } catch (err) {
        showToast("Failed to create folder: " + ((err as Error)?.message || String(err)), { persist: true });
        setStatus("Create folder failed", "err");
      }
    }

    async function enrichNotesWithTags(notes: { handle: any; name: any; relPath: any; lastModified: number; size: number; tags: Set<unknown>; }[]) {
      // Read a small chunk from each file and parse tags.
      const MAX_BYTES = 256 * 1024; // 256KB

      for (const n of notes) {
        try {
          const file = await n.handle.getFile();
          const blob = file.size > MAX_BYTES ? file.slice(0, MAX_BYTES) : file;
          const text = await blob.text();
          const tags = parseTags(text);
          n.tags = tags;
        } catch {
          // Ignore tag parse if file can't be read.
          n.tags = new Set();
        }
      }
    }

    // -------- Tree + filters (search/sort/tag) --------
    function renderTags() {
      const all = new Map(); // tag -> count
      for (const n of state.notes) {
        for (const t of n.tags) {
          all.set(t, (all.get(t) || 0) + 1);
        }
      }

      const sorted = [...all.entries()]
        .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 50); // decision: cap visible tags

      if (!els.tagRow) return;
      els.tagRow!.innerHTML = "";
      if (sorted.length === 0) return;

      // "All" pill to clear
      const allBtn = document.createElement("button");
      allBtn.className = "tag" + (state.tagFilter ? "" : " active");
      allBtn.textContent = "All";
      allBtn.title = "Clear tag filter";
      allBtn.addEventListener("click", async () => {
        state.tagFilter = "";
        renderTags();
        await renderTree();
      });
      els.tagRow.appendChild(allBtn);

      for (const [tag, count] of sorted) {
        const btn = document.createElement("button");
        btn.className = "tag" + (state.tagFilter === tag ? " active" : "");
        btn.textContent = `#${tag}`;
        btn.title = `${count} note${count === 1 ? "" : "s"} tagged #${tag}`;
        btn.addEventListener("click", async () => {
          state.tagFilter = (state.tagFilter === tag) ? "" : tag;
          renderTags();
          await renderTree();
        });
        els.tagRow.appendChild(btn);
      }
    }

    async function renderTree() {
      if (!state.fileTree) {
        if (els.tree) els.tree.innerHTML = `<div class="small" style="padding: 8px;">Open a folder to begin.</div>`;
        return;
      }

      // Determine which notes match search + tag + sort
      const matches = await computeMatches();

      // Prune tree to only matching nodes
      function prune(node: { type: string; relPath: string; children: any; }): any {
        if (node.type === "file") {
          return matches.has(node.relPath) ? node : null;
        }
        const children = [];
        for (const ch of node.children) {
          const kept = prune(ch);
          if (kept) children.push(kept);
        }
        if (node.relPath === "") return { ...node, children };
        return children.length ? { ...node, children } : null;
      }

      const pruned = prune(state.fileTree);

      if (els.tree) els.tree.innerHTML = "";
      if (!pruned || !pruned.children.length) {
        if (els.tree) els.tree.innerHTML = `<div class="small" style="padding: 8px;">No matching notes.</div>`;
        return;
      }

      function renderNode(node: { type: string; relPath: string; name: string; children: any; noteRef: any; }, depth = 0) {
        const row = document.createElement("div");
        row.className = "node";
        row.style.paddingLeft = (8 + depth * 12) + "px";

        if (node.type === "dir") {
          const collapsed = state.collapsedDirs.has(node.relPath);
          row.innerHTML = `
            <span class="icon">${collapsed ? "▶" : "▼"}</span>
            <span class="icon">${collapsed ? "📁" : "📂"}</span>
            <span class="name">${escapeHTML(node.name)}</span>
          `;
          row.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (collapsed) state.collapsedDirs.delete(node.relPath);
            else state.collapsedDirs.add(node.relPath);
            await renderTree();
          });
          if (els.tree) {
            els.tree.appendChild(row);
          }
          if (!collapsed) {
            for (const ch of node.children) renderNode(ch, depth + 1);
          }
          return;
        }

        // file node
        const active = node.relPath === state.currentRelPath;
        if (active) row.classList.add("active");

        const note = node.noteRef;
        const meta = 
          state.sortMode === "modified" && note?.lastModified
          ? new Date(note.lastModified).toLocaleDateString()
          : "";

        row.innerHTML = `
          <span class="icon">📝</span>
          <span class="name" title="${escapeHTML(note.relPath)}">${escapeHTML(note.name)}</span>
          <span class="meta">${escapeHTML(meta)}</span>
        `;

        row.addEventListener("click", async (e) => {
          e.stopPropagation();
          await openNoteByRelPath(node.relPath, note.handle);
        });

        if (els.tree) {
          els.tree.appendChild(row);
        }
      }

      for (const ch of pruned.children) renderNode(ch, 0);
    }

    async function computeMatches() {
      let notes = [...state.notes];

      if (state.tagFilter) {
        notes = notes.filter(n => n.tags.has(state.tagFilter));
      }

      if (state.sortMode === "modified") {
        notes.sort((a,b) => (b.lastModified || 0) - (a.lastModified || 0));
      } else {
        notes.sort((a,b) => a.relPath.localeCompare(b.relPath));
      }

      const q = state.searchQuery.trim().toLowerCase();
      if (!q) return new Set(notes.map(n => n.relPath));

      const matches = new Set();

      for (const n of notes) {
        if (n.relPath.toLowerCase().includes(q)) {
          matches.add(n.relPath);
          continue;
        }
        try {
          const file = await n.handle.getFile();
          const text = (await file.text()).toLowerCase();
          if (text.includes(q)) matches.add(n.relPath);
        } catch {
          /* ignore read errors */
        }
      }

      return matches;
    }

    // -------- Workspace Loading --------
    if (els.openFolderBtn) els.openFolderBtn.addEventListener("click", openWorkspace);

    if (els.refreshBtn) els.refreshBtn.addEventListener("click", () => {
      if (!state.workspaceHandle) {
        showToast("No workspace open.");
        return;
      }
      rescanWorkspace();
    });

    if (els.sortBtn) {
      els.sortBtn.addEventListener("click", async() => {
        state.sortMode = state.sortMode === "name" ? "modified" : "name";
        els.sortBtn!.textContent = "Sort: " + (state.sortMode === "name" ? "Name" : "Last modified");
        await renderTree();
      });
    }

    els.searchInput.addEventListener("input", () => {
      state.searchQuery = els.searchInput.value;
      renderTree();
    });


    // -------- Note open / save --------
    async function openNoteByRelPath(relPath: string, handleHint: any) {
      if (state.isDirty && state.currentFileHandle) {
        if (!confirm("You have unsaved changes. Discard them?")) return;
      }

      try {
        const handle = handleHint || state.notes.find(n => n.relPath === relPath)?.handle;
        if (!handle) throw new Error("File not found");

        const file = await handle.getFile();
        const text = await file.text();

        state.currentFileHandle = handle;
        state.currentRelPath = relPath;
        state.currentContent = text;
        state.isDirty = false;

        els.editor.value = text;
        renderPreview(text);
        updateDirtyUI();
        setStatus("Opened ✓", "ok");

        await renderTree();
      } catch (err) {
        showToast("Failed to open note: " + ((err instanceof Error) ? err.message : String(err)), { persist: true });
        setStatus("Open failed", "err");
      }
    }

    async function saveCurrentNote() {
      if (!state.currentFileHandle) return;

      try {
        const writable = await state.currentFileHandle.createWritable();
        await writable.write(els.editor.value);
        await writable.close();

        state.currentContent = els.editor.value;
        state.isDirty = false;
        updateDirtyUI();

        setStatus("Saved ✓", "ok");
        showToast("Saved ✓");

        await rescanWorkspace({ silent: true });
      } catch (err) {
        showToast("Save failed: " + (err instanceof Error ? err.message : String(err)), { persist: true });
        setStatus("Save failed", "err");
      }
    }

    // -------- Editor + preview --------
    function renderPreview(text: string) { 
      try {
        if (els.preview) {
          els.preview.innerHTML = window.marked ? window.marked.parse(text || "") : "";
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (els.preview) {
          els.preview.innerHTML = `<pre>${escapeHTML(message)}</pre>`;
        }
      }
    }

    els.editor.addEventListener("input", () => {
      if (!state.currentFileHandle) return;
      const text = els.editor.value;
      state.isDirty = text !== state.currentContent;
      updateDirtyUI();
      renderPreview(text);
    });

    els.editor.addEventListener("keydown", (e) => {
      const mod = navigator.platform.toLowerCase().includes("mac") ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentNote();
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const start = els.editor.selectionStart;
        els.editor.setRangeText("  ", start, start, "end");
      }
    });

    els.saveBtn.addEventListener("click", saveCurrentNote);

    els.newNoteBtn = document.getElementById("newNoteBtn") as HTMLButtonElement;
    els.newNoteBtn.addEventListener("click", createNewNote);
    els.newFolderBtn = document.getElementById("newFolderBtn") as HTMLButtonElement;
    els.newFolderBtn.addEventListener("click", () => createNewFolder());

    // -------- Auto refresh --------
    function startAutoRefresh() {
      stopAutoRefresh();
      state.autoRefreshTimer = setInterval(async () => {
        // If no workspace, do nothing.
        if (!state.workspaceHandle) return;

        // If permission revoked, stop and notify.
        try {
          const ok = await ensurePermission(state.workspaceHandle, "read");
          if (!ok) throw new Error("Folder permission revoked.");
        } catch (e) {
          stopAutoRefresh();
          showToast("Auto-refresh stopped: folder permission revoked.", { persist: true });
          setStatus("Permission revoked", "err");
          return;
        }

        // Refresh silently; don't interrupt editing.
        await rescanWorkspace({ silent: true });
      }, state.autoRefreshMs);
    }

    function stopAutoRefresh() {
      if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = null;
    }

    setInterval(() => {
      if (state.workspaceHandle && !state.isDirty) {
        rescanWorkspace({ silent: true });
      }
    }, 10000);


    // -------- Unload protection --------
    window.addEventListener("beforeunload", (e) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
