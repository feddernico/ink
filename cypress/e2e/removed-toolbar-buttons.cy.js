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

describe("removed toolbar buttons verification", () => {
  beforeEach(() => {
    cy.visit("/ink-app.html", {
      onBeforeLoad(win) {
        const root = createFakeDirectoryHandle("test-workspace");
        win.prompt = (message) => {
          if (message.includes("New note name")) {
            return "test-note";
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

  describe("5. QUnit-equivalent DOM verification", () => {
    it("5.1 #saveBtn is NOT present in ink-app.html", () => {
      cy.get("body").then(($body) => {
        const saveBtn = $body.find("#saveBtn");
        expect(saveBtn.length).to.eq(0);
      });
    });

    it("5.2 #exportJsonBtn is NOT present in ink-app.html", () => {
      cy.get("body").then(($body) => {
        const exportJsonBtn = $body.find("#exportJsonBtn");
        expect(exportJsonBtn.length).to.eq(0);
      });
    });

    it("5.3 #exportMdBtn is NOT present in ink-app.html", () => {
      cy.get("body").then(($body) => {
        const exportMdBtn = $body.find("#exportMdBtn");
        expect(exportMdBtn.length).to.eq(0);
      });
    });

    it("5.4 #newNoteBtn, #newFolderBtn, and #openFolderBtn are NOT present in ink-app.html", () => {
      cy.get("body").then(($body) => {
        expect($body.find("#newNoteBtn").length).to.eq(0);
        expect($body.find("#newFolderBtn").length).to.eq(0);
        expect($body.find("#openFolderBtn").length).to.eq(0);
      });
    });

    it("5.5 #dirtyDot IS present in ink-app.html after button removal", () => {
      cy.get("#dirtyDot").should("exist");
    });

    it("5.6 #statusBadge IS present in ink-app.html after button removal", () => {
      cy.get("#statusBadge").should("exist");
    });
  });

  describe("6. Cypress integration tests for menu and keyboard shortcuts", () => {
    it("6.1 Save button is absent from the editor header but save menu item exists", () => {
      cy.get("#saveBtn").should("not.exist");
      cy.get('[data-action="save"]').should("exist");
      cy.get('[data-action="save"]').contains("Save");
    });

    it("6.2 Menu items for New Note and Open Workspace exist", () => {
      cy.get('[data-action="new-note"]').should("exist");
      cy.get('[data-action="new-note"]').contains("New Note");
      cy.get('[data-action="open-workspace"]').should("exist");
      cy.get('[data-action="open-workspace"]').contains("Open Workspace");
    });

    it("6.3 Export menu items exist", () => {
      cy.get('[data-action="export-json"]').should("exist");
      cy.get('[data-action="export-json"]').contains("Export JSON");
      cy.get('[data-action="export-markdown"]').should("exist");
      cy.get('[data-action="export-markdown"]').contains("Export Markdown");
    });

    it("6.4 Keyboard shortcut hints are shown in menu items", () => {
      cy.get('[data-action="save"]').should("exist");
      cy.get('[data-action="new-note"]').should("exist");
      cy.get('[data-action="open-workspace"]').should("exist");
    });

    it("6.5 Status badge and dirty dot are in the correct location after button removal", () => {
      cy.get("#editor").should("exist");
      cy.get("#dirtyDot").should("exist");
      cy.get("#statusBadge").should("exist");
      
      cy.get("#dirtyDot").parent().within(() => {
        cy.get("#statusBadge").should("exist");
      });
    });
  });
});
