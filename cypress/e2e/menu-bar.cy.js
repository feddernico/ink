describe("menu bar functionality", () => {
  const workspaceName = "test-workspace";

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

  beforeEach(() => {
    cy.visit("/ink-app.html", {
      onBeforeLoad(win) {
        const root = createFakeDirectoryHandle(workspaceName);

        win.prompt = (message) => {
          if (message.includes("New note name")) {
            return "test-note";
          }
          if (message.includes("Folder name")) {
            return "test-folder";
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

  describe("menu bar structure", () => {
    it("contains File, Edit, and View menus", () => {
      cy.get("#menuBar").should("exist");
      cy.get(".menu-text").should("contain", "File");
      cy.get(".menu-text").should("contain", "Edit");
      cy.get(".menu-text").should("contain", "View");
    });

    it("does not contain Import/Export menu", () => {
      cy.get("#menuBar").should("not.contain", "Import/Export");
    });

    it("contains Export submenu under File menu", () => {
      cy.get(".menu-text").contains("File").click();
      cy.get(".submenu-parent").should("contain", "Export");
      cy.get(".submenu-parent .dropdown.submenu").should("contain", "Export JSON");
      cy.get(".submenu-parent .dropdown.submenu").should("contain", "Export Markdown");
    });
  });

  describe("File menu regression tests", () => {
    beforeEach(() => {
      cy.get(".menu-text").contains("File").click();
    });

    it("New Note menu item exists and triggers createNewNote", () => {
      cy.get('[data-action="new-note"]').should("exist");
      cy.get('[data-action="open-workspace"]').click({ force: true });
      cy.get('[data-action="new-note"]').click({ force: true });
      cy.get("#currentFilename").should("contain", ".md");
    });

    it("New Folder menu item exists", () => {
      cy.get('[data-action="new-folder"]').should("exist");
    });

    it("Open Workspace menu item exists", () => {
      cy.get('[data-action="open-workspace"]').should("exist");
    });

    it("Close Workspace menu item exists", () => {
      cy.get('[data-action="close-workspace"]').should("exist");
    });

    it("Exit menu item exists", () => {
      cy.get('[data-action="exit"]').should("exist");
    });
  });

  describe("Edit menu regression tests", () => {
    beforeEach(() => {
      cy.get(".menu-text").contains("Edit").click();
    });

    it("Save menu item exists", () => {
      cy.get('[data-action="save"]').should("exist");
    });

    it("Save As menu item exists", () => {
      cy.get('[data-action="save-as"]').should("exist");
    });

    it("Refresh menu item exists", () => {
      cy.get('[data-action="refresh"]').should("exist");
    });

    it("Sort menu item exists", () => {
      cy.get('[data-action="sort"]').should("exist");
    });
  });

  describe("View menu regression tests", () => {
    beforeEach(() => {
      cy.get(".menu-text").contains("View").click();
    });

    it("theme menu items exist", () => {
      cy.get('[data-action="theme-default"]').should("exist");
      cy.get('[data-action="theme-classic"]').should("exist");
      cy.get('[data-action="theme-cobalt"]').should("exist");
      cy.get('[data-action="theme-monokai"]').should("exist");
      cy.get('[data-action="theme-office"]').should("exist");
      cy.get('[data-action="theme-twilight"]').should("exist");
      cy.get('[data-action="theme-xcode"]').should("exist");
    });
  });

  describe("Export submenu functionality", () => {
    beforeEach(() => {
      cy.get(".menu-text").contains("File").click();
      cy.get(".submenu-parent").contains("Export").click();
    });

    it("Export JSON menu item exists in submenu", () => {
      cy.get('[data-action="export-json"]').should("exist");
    });

    it("Export Markdown menu item exists in submenu", () => {
      cy.get('[data-action="export-markdown"]').should("exist");
    });
  });

  describe("platform-aware shortcut detection", () => {
    it("displays Cmd on Mac platform", () => {
      cy.visit("/ink-app.html", {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, "platform", {
            value: "MacIntel",
            writable: true,
          });
          const root = createFakeDirectoryHandle(workspaceName);
          win.prompt = () => null;
          win.confirm = () => true;
          win.FileSystemHandle = function FileSystemHandle() {};
          win.showDirectoryPicker = async () => root;
        },
      });
      cy.get(".menu-text").contains("File").click();
      cy.get('[data-action="new-note"]').within(() => {
        cy.get(".menu-shortcut").should("contain", "Cmd");
      });
    });

    it("displays Ctrl on Windows platform", () => {
      cy.visit("/ink-app.html", {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, "platform", {
            value: "Win32",
            writable: true,
          });
          const root = createFakeDirectoryHandle(workspaceName);
          win.prompt = () => null;
          win.confirm = () => true;
          win.FileSystemHandle = function FileSystemHandle() {};
          win.showDirectoryPicker = async () => root;
        },
      });
      cy.get(".menu-text").contains("File").click();
      cy.get('[data-action="new-note"]').within(() => {
        cy.get(".menu-shortcut").should("contain", "Ctrl");
      });
    });

    it("displays Ctrl on Linux platform", () => {
      cy.visit("/ink-app.html", {
        onBeforeLoad(win) {
          Object.defineProperty(win.navigator, "platform", {
            value: "Linux x86_64",
            writable: true,
          });
          const root = createFakeDirectoryHandle(workspaceName);
          win.prompt = () => null;
          win.confirm = () => true;
          win.FileSystemHandle = function FileSystemHandle() {};
          win.showDirectoryPicker = async () => root;
        },
      });
      cy.get(".menu-text").contains("File").click();
      cy.get('[data-action="new-note"]').within(() => {
        cy.get(".menu-shortcut").should("contain", "Ctrl");
      });
    });
  });
});
