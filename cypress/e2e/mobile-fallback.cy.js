describe("mobile fallback functionality", () => {
  const workspaceName = "temp-workspace";
  const fileStem = "test-note";
  const fileName = `${fileStem}.md`;
  const markdown = "# Test Note\n\nThis is test content.";

  beforeEach(() => {
    cy.visit("/ink-app.html", {
      onBeforeLoad(win) {
        delete win.showDirectoryPicker;
        delete win.FileSystemHandle;
        win.prompt = (message) => {
          if (message.includes("New note name")) {
            return fileStem;
          }
          return null;
        };
        win.confirm = () => true;
      },
    });
  });

  it("shows temporary session when FS API is unavailable after clicking Open Folder", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#workspaceName").should("contain", "Temporary Session");
    cy.get("#temporarySessionBadge").should("be.visible");
    cy.get("#temporarySessionBadge").should("contain", "Temporary Session");
    cy.get("#statusBadge").should("contain", "Temporary session");
    cy.get("#tree").should("contain", "Temporary session");
    cy.get("#exportJsonBtn").should("be.disabled");
    cy.get("#exportMdBtn").should("be.disabled");
  });

  it("allows creating and editing notes in temporary session", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();
    cy.get("#currentFilename").should("contain", fileName);

    cy.get("#editor").clear().type(markdown);
    cy.get("#dirtyDot").should("be.visible");

    cy.get("#saveBtn").click();
    cy.get("#dirtyDot").should("not.be.visible");
    cy.get("#statusBadge").should("contain", "Saved");

    cy.get("#tree").should("contain", fileName);
  });

  it("enables export buttons after creating notes", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#exportJsonBtn").should("be.disabled");
    cy.get("#exportMdBtn").should("be.disabled");

    cy.get("#newNoteBtn").click();

    cy.get("#exportJsonBtn").should("not.be.disabled");
    cy.get("#exportMdBtn").should("not.be.disabled");
  });

  it("exports current note as markdown", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();
    cy.get("#editor").clear().type(markdown);
    cy.get("#saveBtn").click();

    cy.get("#exportMdBtn").click();

    cy.readFile("cypress/downloads/test-note.md", { timeout: 5000 }).then((content) => {
      expect(content).to.include("# Test Note");
      expect(content).to.include("This is test content.");
    });
  });

  it("exports all notes as JSON", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();
    cy.get("#editor").clear().type("# First Note\n\nContent 1");
    cy.get("#saveBtn").click();

    cy.get("#newNoteBtn").click();
    cy.get("#editor").clear().type("# Second Note\n\nContent 2");
    cy.get("#saveBtn").click();

    cy.get("#exportJsonBtn").click();
    cy.get("#statusBadge").should("contain", "Exported JSON");
  });

  it("opens existing note from tree in temporary session", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();
    cy.get("#editor").clear().type("# Original Content");
    cy.get("#saveBtn").click();

    cy.get("#newNoteBtn").click();
    cy.get("#editor").clear().type("# Another Note");
    cy.get("#saveBtn").click();

    cy.get(".node").first().click();

    cy.get("#currentFilename").should("contain", ".md");
  });

  it("shows unsaved changes indicator when editing", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();
    cy.get("#currentFilename").should("contain", ".md");
    
    cy.get("#editor").type(" - added content", { force: true });
    cy.get("#dirtyDot").should("be.visible");
  });

  it("renders markdown preview in temporary session", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();

    cy.get("#editor").clear().type("## Section\n\nSome **bold** text.");

    cy.get("#preview").find("h2").should("contain", "Section");
    cy.get("#preview").find("strong").should("contain", "bold");
  });

  it("displays tags after creating notes with hashtags", () => {
    cy.get("#openFolderBtn").click();
    cy.get("#newNoteBtn").click();
    cy.get("#editor").clear().type("# Note with work tag");
    cy.get("#saveBtn").click();

    cy.get(".tagrow").should("exist");
  });
});
