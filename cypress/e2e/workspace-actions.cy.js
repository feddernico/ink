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
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get("#workspaceName").should("contain", workspaceName);

    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type(markdown);
    cy.get('[data-action="save"]').click({ force: true });
    cy.get("#statusBadge").should("contain", "Saved");

    cy.get('[data-action="save-as"]').click({ force: true });
    cy.get("#statusBadge").should("contain", "Saved as");
    cy.get("#currentFilename").should("contain", `${saveAsName}.md`);

    cy.window().then(async (win) => {
      const handle = await win.__fakeWorkspace.getFileHandle(`${saveAsName}.md`);
      expect(handle.__read()).to.eq(markdown);
    });
  });

  it("refresh button rescans workspace and updates status", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get("#workspaceName").should("contain", workspaceName);

    cy.get("body").click("topLeft");
    cy.get("#refreshBtn").click();
    cy.get("#statusBadge").should("contain", "Refreshed");
  });

  it("close workspace resets UI state", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });

    cy.get('[data-action="close-workspace"]').click({ force: true });
    cy.get("#workspaceName").should("contain", "No folder selected");
    cy.get("#tree").should("contain", "Open a folder to begin.");
    cy.get("#currentFilename").should("contain", "No note open");
    cy.get("#statusBadge").should("contain", "Ready");
  });

  it("sort toggle updates labels", () => {
    cy.get("#sortBtn").should("contain", "Sort: Name");
    cy.get('[data-action="sort"] .menu-label').should("contain", "Sort: Name");

    cy.get("#sortBtn").click();
    cy.get("#sortBtn").should("contain", "Sort: Last modified");
    cy.get('[data-action="sort"] .menu-label').should("contain", "Sort: Modified");
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
