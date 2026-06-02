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
  };
}

describe("editor view mode toggle", () => {
  const workspaceName = "view-mode-workspace";
  const noteName = "view-mode-note";

  beforeEach(() => {
    cy.visit("/ink-app.html", {
      onBeforeLoad(win) {
        const root = createFakeDirectoryHandle(workspaceName);

        win.prompt = (message) => {
          if (message.includes("New note name")) {
            return noteName;
          }
          return null;
        };

        win.confirm = () => true;
        win.FileSystemHandle = function FileSystemHandle() {};
        win.showDirectoryPicker = async () => root;
      },
    });
  });

  it("switches between split, source, and preview layouts", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });

    cy.get("#editorSplit").should("have.class", "view-split");
    cy.get("#editorViewSplitBtn").should("have.class", "active");

    cy.get("#editorViewSourceBtn").click();
    cy.get("#editorSplit").should("have.class", "view-source");
    cy.get("#editorPane").should("be.visible");
    cy.get("#previewPane").should("not.be.visible");
    cy.get("#editorViewSourceBtn").should("have.class", "active");

    cy.get("#editorViewPreviewBtn").click();
    cy.get("#editorSplit").should("have.class", "view-preview");
    cy.get("#editorPane").should("not.be.visible");
    cy.get("#previewPane").should("be.visible");
    cy.get("#editorViewPreviewBtn").should("have.class", "active");

    cy.get("#editorViewSplitBtn").click();
    cy.get("#editorSplit").should("have.class", "view-split");
    cy.get("#editorPane").should("be.visible");
    cy.get("#previewPane").should("be.visible");
    cy.get("#editorViewSplitBtn").should("have.class", "active");
  });
});
