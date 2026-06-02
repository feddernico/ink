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
  };
}

describe("document linter export", () => {
  const workspaceName = "linter-workspace";
  const noteName = "linter-note";
  const noteContent = "# Linter export test\n\nThis sentence is intentionally very long so the readability rule has something to report.";

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
        win.__fakeWorkspace = root;
        win.__linterExportBlobs = [];
        win.URL.createObjectURL = (blob) => {
          win.__linterExportBlobs.push(blob);
          return "blob:linter-report";
        };
        win.URL.revokeObjectURL = () => {};
      },
    });
  });

  it("exports the current linter report as markdown", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(noteContent);

    cy.get("#documentLinterToggleBtn").click();
    cy.get("#documentLinterAnalyzeBtn").click();
    cy.get("#statusBadge").should("contain", "Analysis complete");

    cy.get("#documentLinterExportBtn").click();
    cy.get("#statusBadge").should("contain", "Exported report");

    cy.window().then(async (win) => {
      expect(win.__linterExportBlobs).to.have.length(1);
      const report = await win.__linterExportBlobs[0].text();
      expect(report).to.contain("# Document Linter Review");
      expect(report).to.contain("## Overall");
      expect(report).to.contain("Overall score:");
      expect(report).to.contain("Readability");
      expect(report).to.contain("Opening is informative, not directive");
    });
  });
});
