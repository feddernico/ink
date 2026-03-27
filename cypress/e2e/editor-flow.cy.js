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

describe("ink authoring flow", () => {
  const workspaceName = "workspace-a";
  const fileStem = "notes";
  const fileName = `${fileStem}.md`;
  const markdown = "# Ink flow\n\nThis is markdown content.";

  beforeEach(() => {
    cy.visit("/ink-app.html", {
      onBeforeLoad(win) {
        const root = createFakeDirectoryHandle(workspaceName);

        win.prompt = (message) => {
          if (message.includes("New note name")) {
            return fileStem;
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

  it("selects workspace, creates a new file, edits markdown, and saves", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("#workspaceName").should("contain", workspaceName);

    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#currentFilename").should("contain", fileName);

    cy.get("#editor").clear().type(markdown);
    cy.get("[data-action=\"save\"]").click({ force: true });
    cy.get("#statusBadge").should("contain", "Saved");

    cy.window().then(async (win) => {
      const handle = await win.__fakeWorkspace.getFileHandle(fileName);
      expect(handle.__read()).to.eq(markdown);
    });
  });

  it("renders markdown preview when editing a note", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });

    cy.get("#editor").clear().type("# Hello World\n\nThis is a paragraph.");

    cy.get("#preview").find("h1").should("contain", "Hello World");
    cy.get("#preview").find("p").should("contain", "This is a paragraph.");
  });

  it("collapses and expands the left menu, updating accessibility state and editor space", () => {
    let expandedEditorWidth = 0;
    let collapsedEditorWidth = 0;

    cy.get("#sidebarToggleBtn")
      .should("have.attr", "aria-expanded", "true")
      .and("contain", "▶ Collapse")
      .and("be.visible");
    cy.get(".app").should("not.have.class", "sidebar-collapsed");

    cy.get("#editor").then(($editor) => {
      expandedEditorWidth = $editor[0].getBoundingClientRect().width;
    });

    cy.get("#sidebarToggleBtn").click();
    cy.get(".app").should("have.class", "sidebar-collapsed");
    cy.get("#sidebarToggleBtn")
      .should("have.attr", "aria-expanded", "false")
      .and("contain", "▼ Expand");

    cy.get("#editor").then(($editor) => {
      collapsedEditorWidth = $editor[0].getBoundingClientRect().width;
      expect(collapsedEditorWidth).to.be.greaterThan(expandedEditorWidth);
    });

    cy.get("#sidebarToggleBtn").focus().type("{enter}");
    cy.get(".app").should("not.have.class", "sidebar-collapsed");
    cy.get("#sidebarToggleBtn")
      .should("have.attr", "aria-expanded", "true")
      .and("contain", "Collapse");

    cy.get("#editor").then(($editor) => {
      const finalEditorWidth = $editor[0].getBoundingClientRect().width;
      expect(finalEditorWidth).to.be.lessThan(collapsedEditorWidth);
    });
  });
});
