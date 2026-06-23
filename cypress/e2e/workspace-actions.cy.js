function createFakeFileHandle(name, initialContent = "") {
  let content = initialContent;
  let lastModified = Date.now();

  return {
    kind: "file",
    name,
    async queryPermission() {
      return "granted";
    },
    async requestPermission() {
      return "granted";
    },
    async getFile() {
      return new File([content], name, { type: "text/markdown", lastModified });
    },
    async createWritable() {
      return {
        async write(nextContent) {
          content = String(nextContent);
          lastModified = Date.now();
        },
        async close() {},
      };
    },
    __read() {
      return content;
    },
  };
}

function createFakeDirectoryHandle(name) {
  const entries = new Map();

  return {
    kind: "directory",
    name,
    async queryPermission() {
      return "granted";
    },
    async requestPermission() {
      return "granted";
    },
    async *entries() {
      for (const entry of entries.entries()) {
        yield entry;
      }
    },
    async getFileHandle(fileName, options = {}) {
      const existing = entries.get(fileName);
      if (existing) {
        return existing;
      }
      if (!options.create) {
        throw new Error(`File not found: ${fileName}`);
      }
      const handle = createFakeFileHandle(fileName);
      entries.set(fileName, handle);
      return handle;
    },
    async getDirectoryHandle(dirName, options = {}) {
      const existing = entries.get(dirName);
      if (existing) {
        return existing;
      }
      if (!options.create) {
        throw new Error(`Directory not found: ${dirName}`);
      }
      const handle = createFakeDirectoryHandle(dirName);
      entries.set(dirName, handle);
      return handle;
    },
    __entries: entries,
  };
}

function dispatchShortcut(win, { key, ctrlKey = false, shiftKey = false, altKey = false }) {
  const event = new win.KeyboardEvent("keydown", {
    key,
    ctrlKey,
    shiftKey,
    altKey,
    bubbles: true,
  });
  win.dispatchEvent(event);
}

describe("workspace actions regression", () => {
  const workspaceName = "workspace-actions";
  const noteName = "note-a";
  const saveAsName = "note-b";
  const markdown = "# Ink regression\n\nSaved content.";

  beforeEach(() => {
    cy.visit("/ink-app.html", {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, "userAgent", {
          value: "Windows NT 10.0",
          configurable: true,
        });

        const root = createFakeDirectoryHandle(workspaceName);

        win.prompt = (message) => {
          if (message.includes("New note name")) {
            return noteName;
          }
          if (message.includes("Save note as")) {
            return saveAsName;
          }
          if (message.includes("Folder name")) {
            return "folder-a";
          }
          return null;
        };

        win.confirm = () => true;
        win.FileSystemHandle = function FileSystemHandle() {};
        win.showDirectoryPicker = async () => root;
        win.__fakeWorkspace = root;
      },
    });
  });

  it("save as creates a new file with the saved content", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("#workspaceName").should("contain", workspaceName);

    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(markdown);
    cy.get("[data-action=\"save\"]").click({ force: true });
    cy.get("#statusBadge").should("contain", "Saved");

    cy.get("[data-action=\"save-as\"]").click({ force: true });
    cy.get("#statusBadge").should("contain", "Saved as");
    cy.get("#currentFilename").should("contain", `${saveAsName}.md`);

    cy.window().then(async (win) => {
      const handle = await win.__fakeWorkspace.getFileHandle(`${saveAsName}.md`);
      expect(handle.__read()).to.eq(markdown);
    });
  });

  it("refresh button rescans workspace and updates status", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("#workspaceName").should("contain", workspaceName);

    cy.get("body").click("topLeft");
    cy.get("body").click("bottomRight");
    cy.get("#refreshBtn").click({ force: true });
    cy.get("#statusBadge").should("contain", "Refreshed");
  });

  it("opens the folder picker immediately and ignores overlapping open requests", () => {
    cy.window().then((win) => {
      win.__pickerCalls = 0;
      win.showDirectoryPicker = () => {
        win.__pickerCalls += 1;
        return new Promise((resolve) => {
          win.__resolveWorkspacePicker = () => resolve(win.__fakeWorkspace);
        });
      };
    });

    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("#statusBadge").should("contain", "Choose a workspace folder");
    cy.window().its("__pickerCalls").should("eq", 1);

    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.window().its("__pickerCalls").should("eq", 1);
    cy.get("#statusBadge").should("contain", "Folder picker already open");

    cy.window().then((win) => {
      win.__resolveWorkspacePicker();
    });
    cy.get("#statusBadge").should("contain", "Workspace ready");
  });

  it("loads workspace files concurrently and reads each file once", () => {
    cy.window().then((win) => {
      const tracker = { active: 0, maximum: 0, calls: 0 };
      win.__workspaceReadTracker = tracker;

      for (let index = 0; index < 32; index += 1) {
        const name = `note-${index}.md`;
        win.__fakeWorkspace.__entries.set(name, {
          kind: "file",
          name,
          async getFile() {
            tracker.calls += 1;
            tracker.active += 1;
            tracker.maximum = Math.max(tracker.maximum, tracker.active);
            await new Promise((resolve) => win.setTimeout(resolve, 20));
            tracker.active -= 1;
            return new File([`---\ntags: [batch]\n---\n# Note ${index}`], name, {
              type: "text/markdown",
              lastModified: index,
            });
          },
        });
      }
    });

    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("#statusBadge").should("contain", "Workspace ready");
    cy.get("#countsPill").should("contain", "32 notes");
    cy.window().then((win) => {
      expect(win.__workspaceReadTracker.calls).to.eq(32);
      expect(win.__workspaceReadTracker.maximum).to.be.greaterThan(1);
      expect(win.__workspaceReadTracker.maximum).to.be.at.most(4);
    });
  });

  it("prioritizes opening a note over an in-progress background scan", () => {
    cy.window().then((win) => {
      win.__fakeWorkspace.__entries.set(
        "priority.md",
        createFakeFileHandle("priority.md", "# Priority\n\nOpen me immediately."),
      );
    });

    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("#workspaceName").should("contain", workspaceName);
    cy.get("#tree .node").contains("priority.md").should("be.visible");

    cy.window().then((win) => {
      const tracker = { calls: 0 };
      win.__slowRefreshTracker = tracker;
      for (let index = 0; index < 40; index += 1) {
        const name = `slow-${index}.md`;
        win.__fakeWorkspace.__entries.set(name, {
          kind: "file",
          name,
          async getFile() {
            tracker.calls += 1;
            await new Promise((resolve) => win.setTimeout(resolve, 250));
            return new File([`# Slow ${index}`], name, { type: "text/markdown" });
          },
        });
      }
    });

    cy.get("#refreshBtn").click({ force: true });
    cy.get("#tree .node").contains("priority.md").click();
    cy.get("#currentFilename").should("contain", "priority.md");
    cy.get("#editor").should("contain.value", "Open me immediately");

    cy.wait(350);
    cy.window().then((win) => {
      expect(win.__slowRefreshTracker.calls).to.be.at.most(4);
    });
  });

  it("close workspace resets UI state", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });

    cy.get("[data-action=\"close-workspace\"]").click({ force: true });
    cy.get("#workspaceName").should("contain", "No folder selected");
    cy.get("#tree").should("contain", "Open a folder to begin.");
    cy.get("#currentFilename").should("contain", "No note open");
    cy.get("#statusBadge").should("contain", "Ready");
  });

  it("sort toggle updates labels", () => {
    cy.get("#sortBtn").should("contain", "Sort: Name");
    cy.get("[data-action=\"sort\"] .menu-label").should("contain", "Sort: Name");

    cy.get("#sortBtn").click();
    cy.get("#sortBtn").should("contain", "Sort: Last modified");
    cy.get("[data-action=\"sort\"] .menu-label").should("contain", "Sort: Modified");
  });

  it("keyboard shortcuts trigger key workspace actions", () => {
    cy.window().then((win) => {
      dispatchShortcut(win, { key: "o", ctrlKey: true, shiftKey: true });
    });
    cy.get("#workspaceName").should("contain", workspaceName);

    cy.window().then((win) => {
      dispatchShortcut(win, { key: "e", ctrlKey: true });
    });
    cy.get("#currentFilename").should("contain", `${noteName}.md`);

    cy.get("#editor").clear().type(markdown);
    cy.window().then((win) => {
      dispatchShortcut(win, { key: "s", ctrlKey: true });
    });
    cy.get("#statusBadge").should("contain", "Saved");

    cy.window().then((win) => {
      dispatchShortcut(win, { key: "l", ctrlKey: true });
    });
    cy.get("#statusBadge").should("contain", "Refreshed");
  });
});
