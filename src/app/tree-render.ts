import { escapeHtml } from "./utils";
import { icon } from "./icons";
import type {
  AppState,
  DomRefs,
  FileHandleLike,
  InMemoryNoteRecord,
  TreeNode,
} from "./types";

export type TreeHandlers = {
  openNoteByRelPath: (relPath: string, handleHint: FileHandleLike | null) => Promise<void>;
  openInMemoryNote: (relPath: string) => Promise<void>;
};

type ToastFn = (message: string, options?: { persist?: boolean }) => void;

export function createTreeRenderer({
  state,
  els,
  handlers,
  showToast,
}: {
  state: AppState;
  els: DomRefs;
  handlers: TreeHandlers;
  showToast: ToastFn;
}) {
  function renderTags(): void {
    const tagCounts = new Map<string, number>();
    const notes = state.isTemporarySession ? state.inMemoryNotes : state.notes;

    for (const note of notes) {
      for (const tag of note.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const sorted = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 50);

    els.tagRow.innerHTML = "";
    if (sorted.length === 0) {
      return;
    }

    const allButton = document.createElement("button");
    allButton.className = `tag${state.tagFilter ? "" : " active"}`;
    allButton.textContent = "All";
    allButton.title = "Clear tag filter";
    allButton.addEventListener("click", () => {
      state.tagFilter = "";
      renderTags();
      if (state.isTemporarySession) {
        renderInMemoryTree();
      } else {
        renderTree().catch((error: unknown) => {
          showToast(`Tag render failed: ${String(error)}`, { persist: true });
        });
      }
    });
    els.tagRow.appendChild(allButton);

    for (const [tag, count] of sorted) {
      const button = document.createElement("button");
      button.className = `tag${state.tagFilter === tag ? " active" : ""}`;
      button.textContent = `#${tag}`;
      button.title = `${count} note${count === 1 ? "" : "s"} tagged #${tag}`;
      button.addEventListener("click", () => {
        state.tagFilter = state.tagFilter === tag ? "" : tag;
        renderTags();
        if (state.isTemporarySession) {
          renderInMemoryTree();
        } else {
          renderTree().catch((error: unknown) => {
            showToast(`Tag render failed: ${String(error)}`, { persist: true });
          });
        }
      });
      els.tagRow.appendChild(button);
    }
  }

  async function computeMatches(): Promise<Set<string>> {
    let notes = [...state.notes];

    if (state.tagFilter) {
      notes = notes.filter((note) => note.tags.has(state.tagFilter));
    }

    if (state.sortMode === "modified") {
      notes.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    } else {
      notes.sort((a, b) => a.relPath.localeCompare(b.relPath));
    }

    const query = state.searchQuery.trim().toLowerCase();
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

  async function renderTree(): Promise<void> {
    if (!state.fileTree) {
      els.tree.innerHTML = '<div class="small" style="padding: 8px;">Open a folder to begin.</div>';
      return;
    }

    const matches = await computeMatches();
    const prunedTree = pruneTree(state.fileTree, matches);

    els.tree.innerHTML = "";
    if (!prunedTree || prunedTree.type !== "dir" || prunedTree.children.length === 0) {
      els.tree.innerHTML = '<div class="small" style="padding: 8px;">No matching notes.</div>';
      return;
    }

    for (const child of prunedTree.children) {
      renderNode(child, 0);
    }
  }

  function pruneTree(node: TreeNode, matches: Set<string>): TreeNode | null {
    if (node.type === "file") {
      return matches.has(node.relPath) ? node : null;
    }

    const children: TreeNode[] = [];
    for (const child of node.children) {
      const kept = pruneTree(child, matches);
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

  function renderNode(node: TreeNode, depth: number): void {
    const row = document.createElement("div");
    row.className = "node";
    row.style.paddingLeft = `${8 + depth * 12}px`;

    if (node.type === "dir") {
      const isCollapsed = state.collapsedDirs.has(node.relPath);
      row.innerHTML = `
        <span class="icon">${isCollapsed ? "▶" : "▼"}</span>
        <span>${isCollapsed ? icon.folder() : icon.folderOpen()}</span>
        <span class="name">${escapeHtml(node.name)}</span>
      `;

      row.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        if (isCollapsed) {
          state.collapsedDirs.delete(node.relPath);
        } else {
          state.collapsedDirs.add(node.relPath);
        }

        renderTree().catch((error: unknown) => {
          showToast(`Tree render failed: ${String(error)}`, { persist: true });
        });
      });

      els.tree.appendChild(row);
      if (!isCollapsed) {
        for (const child of node.children) {
          renderNode(child, depth + 1);
        }
      }
      return;
    }

    const isActive = node.relPath === state.currentRelPath;
    if (isActive) {
      row.classList.add("active");
    }

    const meta =
      state.sortMode === "modified" && node.noteRef.lastModified
        ? new Date(node.noteRef.lastModified).toLocaleDateString()
        : "";

    row.innerHTML = `
      <span>${icon.fileText()}</span>
      <span class="name" title="${escapeHtml(node.noteRef.relPath)}">${escapeHtml(node.noteRef.name)}</span>
      <span class="meta">${escapeHtml(meta)}</span>
    `;

    row.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();
      handlers.openNoteByRelPath(node.relPath, node.handle).catch((error: unknown) => {
        showToast(`Open note failed: ${String(error)}`, { persist: true });
      });
    });

    els.tree.appendChild(row);
  }

  function renderInMemoryTree(): void {
    els.tree.innerHTML = "";

    if (state.inMemoryNotes.length === 0) {
      els.tree.innerHTML =
        '<div class="small" style="padding: 8px;">Temporary session. Create a note to begin.</div>';
      return;
    }

    const sortedNotes = [...state.inMemoryNotes].sort((a, b) => a.relPath.localeCompare(b.relPath));

    for (const note of sortedNotes) {
      renderInMemoryRow(note);
    }
  }

  function renderInMemoryRow(note: InMemoryNoteRecord): void {
    const row = document.createElement("div");
    row.className = "node";

    const isActive = note.relPath === state.currentRelPath;
    if (isActive) {
      row.classList.add("active");
    }

    const meta = state.sortMode === "modified" ? new Date(note.lastModified).toLocaleDateString() : "";

    row.innerHTML = `
      <span>${icon.fileText()}</span>
      <span class="name" title="${escapeHtml(note.relPath)}">${escapeHtml(note.name)}</span>
      <span class="meta">${escapeHtml(meta)}</span>
    `;

    row.addEventListener("click", () => {
      handlers.openInMemoryNote(note.relPath);
    });

    els.tree.appendChild(row);
  }

  function updateCountsPill(): void {
    const count = state.inMemoryNotes.length;
    els.countsPill.textContent = `${count} note${count === 1 ? "" : "s"}`;
  }

  return {
    computeMatches,
    renderTree,
    renderTags,
    renderInMemoryTree,
    updateCountsPill,
  };
}
