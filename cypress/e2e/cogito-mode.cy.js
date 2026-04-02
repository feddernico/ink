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

describe("cogito mode", () => {
  const workspaceName = "workspace-cogito";
  const fileStem = "cogito-note";
  const markdown = "The project should prioritize local-first writing workflows.";

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
        win.__cogitoCreateEngineCalls = [];
        win.__cogitoCompletions = [];
        win.__INK_TEST_WEBLLM__ = {
          async CreateMLCEngine(modelId, options = {}) {
            win.__cogitoCreateEngineCalls.push(modelId);
            options.initProgressCallback?.({ text: `Stub model ready: ${modelId}` });

            return {
              chat: {
                completions: {
                  async create(payload) {
                    win.__cogitoCompletions.push(payload);
                    return {
                      choices: [
                        {
                          message: {
                            content: JSON.stringify({
                              questions: [
                                "What problem does local-first editing solve here?",
                                "Which user evidence supports this workflow choice?",
                                "How will you measure whether local-first is working?",
                              ],
                            }),
                          },
                        },
                      ],
                    };
                  },
                },
              },
            };
          },
        };
      },
    });
  });

  it("opens the panel, switches model, generates questions, and inserts one into the editor", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(markdown);

    cy.get("#cogitoToggleBtn")
      .should("have.attr", "aria-expanded", "false")
      .click()
      .should("have.attr", "aria-expanded", "true");
    cy.get("#cogitoPanel").should("be.visible");
    cy.get(".split").should("have.class", "with-cogito");

    cy.get("#cogitoDeepBtn").click().should("have.class", "active");
    cy.get("#cogitoLiteBtn").should("not.have.class", "active");

    cy.get("#cogitoGenerateBtn").click();

    cy.get("#statusBadge").should("contain", "Cogito questions ready");
    cy.get("#cogitoStatus").should("contain", "Questions ready");
    cy.get("#cogitoQuestionList .cogitoQuestionItem").should("have.length", 3);
    cy.get("#cogitoQuestionList .cogitoQuestionText")
      .eq(0)
      .should("contain", "What problem does local-first editing solve here?");

    cy.window().then((win) => {
      expect(win.__cogitoCreateEngineCalls).to.deep.equal(["Qwen3-8B-q4f16_1-MLC"]);
      expect(win.__cogitoCompletions).to.have.length(1);
      expect(win.__cogitoCompletions[0].messages[1].content).to.contain(markdown);
    });

    cy.contains("#cogitoQuestionList .cogitoInsertBtn", "Insert").first().click();
    cy.get("#statusBadge").should("contain", "Inserted AI question");
    cy.get("#editor").should("have.value", `${markdown}> ### AI\nWhat problem does local-first editing solve here?\n`);
  });
});
