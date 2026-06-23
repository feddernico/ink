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
        win.__cogitoDeletedModels = [];
        win.__INK_TEST_WEBLLM__ = {
          prebuiltAppConfig: { model_list: [] },
          async deleteModelAllInfoInCache(modelId) {
            win.__cogitoDeletedModels.push(modelId);
          },
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

  it("assesses the document, uses findings for coaching, and inserts one question", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(markdown);

    cy.get("#cogitoToggleBtn")
      .should("have.attr", "aria-expanded", "false")
      .click()
      .should("have.attr", "aria-expanded", "true");
    cy.get("#cogitoPanel").should("be.visible");
    cy.get(".split").should("have.class", "with-cogito");
    cy.get("#documentLinterToggleBtn").should("not.exist");
    cy.get("#documentLinterPanel").should("not.exist");

    cy.get("#editorViewSourceBtn").click();
    cy.get("#editorSplit").should("have.class", "view-source").and("have.class", "with-cogito");
    cy.get("#cogitoPanel").should("be.visible");
    cy.get("#editorViewPreviewBtn").click();
    cy.get("#editorSplit").should("have.class", "view-preview").and("have.class", "with-cogito");
    cy.get("#cogitoPanel").should("be.visible");
    cy.get("#editorViewSplitBtn").click();

    cy.get("#documentLinterAnalyzeBtn").click();
    cy.get("#documentLinterStatus").should("contain", "Analysis complete");
    cy.get("#documentLinterResults").should("contain", "Overall");

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
      expect(win.__cogitoCompletions[0].messages[1].content).to.contain("Document strength:");
      expect(win.__cogitoCompletions[0].messages[1].content).to.contain("Highest-priority improvements:");
    });

    cy.contains("#cogitoQuestionList .cogitoInsertBtn", "Insert").first().click();
    cy.get("#statusBadge").should("contain", "Inserted AI question");
    cy.get("#editor").should("have.value", `${markdown}> ### AI\nWhat problem does local-first editing solve here?\n`);
  });

  it("marks existing questions stale when document analysis changes", () => {
    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(markdown);
    cy.get("#cogitoToggleBtn").click();
    cy.get("#documentLinterAnalyzeBtn").click();
    cy.get("#documentLinterStatus").should("contain", "Analysis complete");
    cy.get("#cogitoGenerateBtn").click();
    cy.get("#cogitoQuestionList .cogitoQuestionItem").should("have.length", 3);

    cy.get("#editor").type(" More evidence is needed.");
    cy.get("#documentLinterAnalyzeBtn").click();
    cy.get("#cogitoStatus").should("contain", "Regenerate");
    cy.get("#cogitoQuestionList .cogitoQuestionItem").should("have.length", 3);
  });

  it("repairs a failed cache and falls back from Deep to Lite", () => {
    cy.window().then((win) => {
      win.__INK_TEST_WEBLLM__.CreateMLCEngine = async (modelId, options = {}) => {
        win.__cogitoCreateEngineCalls.push(modelId);
        if (modelId === "Qwen3-8B-q4f16_1-MLC") {
          throw new Error("Failed to execute 'add' on 'Cache': Cache.add() encountered a network error");
        }
        options.initProgressCallback?.({ text: `Stub model ready: ${modelId}` });
        return {
          chat: {
            completions: {
              async create(payload) {
                win.__cogitoCompletions.push(payload);
                return {
                  choices: [{
                    message: {
                      content: JSON.stringify({
                        questions: ["Fallback one?", "Fallback two?", "Fallback three?"],
                      }),
                    },
                  }],
                };
              },
            },
          },
        };
      };
    });

    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(markdown);
    cy.get("#cogitoToggleBtn").click();
    cy.get("#cogitoDeepBtn").click();
    cy.get("#cogitoGenerateBtn").click();

    cy.get("#statusBadge", { timeout: 10000 }).should("contain", "Cogito questions ready");
    cy.get("#cogitoLiteBtn").should("have.class", "active");
    cy.get("#cogitoQuestionList .cogitoQuestionItem").should("have.length", 3);
    cy.window().then((win) => {
      expect(win.__cogitoDeletedModels).to.deep.equal(["Qwen3-8B-q4f16_1-MLC"]);
      expect(win.__cogitoCreateEngineCalls).to.deep.equal([
        "Qwen3-8B-q4f16_1-MLC",
        "Qwen3-8B-q4f16_1-MLC",
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      ]);
    });
  });

  it("repairs the Lite model cache and retries Lite successfully", () => {
    cy.window().then((win) => {
      let liteAttempts = 0;
      win.__INK_TEST_WEBLLM__.CreateMLCEngine = async (modelId, options = {}) => {
        win.__cogitoCreateEngineCalls.push(modelId);
        if (modelId === "Llama-3.2-1B-Instruct-q4f32_1-MLC") {
          liteAttempts += 1;
          if (liteAttempts === 1) {
            throw new Error("Failed to execute 'add' on 'Cache': Cache.add() encountered a network error");
          }
        }
        options.initProgressCallback?.({ text: `Stub model ready: ${modelId}` });
        return {
          chat: {
            completions: {
              async create(payload) {
                win.__cogitoCompletions.push(payload);
                return {
                  choices: [{
                    message: {
                      content: JSON.stringify({
                        questions: ["Lite retry one?", "Lite retry two?", "Lite retry three?"],
                      }),
                    },
                  }],
                };
              },
            },
          },
        };
      };
    });

    cy.get("[data-action=\"open-workspace\"]").click({ force: true });
    cy.get("[data-action=\"new-note\"]").click({ force: true });
    cy.get("#editor").clear().type(markdown);
    cy.get("#cogitoToggleBtn").click();
    cy.get("#cogitoLiteBtn").should("have.class", "active");
    cy.get("#cogitoGenerateBtn").click();

    cy.get("#statusBadge", { timeout: 10000 }).should("contain", "Cogito questions ready");
    cy.get("#cogitoLiteBtn").should("have.class", "active");
    cy.get("#cogitoQuestionList .cogitoQuestionItem").should("have.length", 3);
    cy.window().then((win) => {
      expect(win.__cogitoDeletedModels).to.deep.equal([
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      ]);
      expect(win.__cogitoCreateEngineCalls).to.deep.equal([
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      ]);
    });
  });
});
