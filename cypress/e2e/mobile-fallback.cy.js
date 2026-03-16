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

  it("shows temporary session when FS API is unavailable after clicking Open Workspace", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get("#workspaceName").should("contain", "Temporary Session");
    cy.get("#temporarySessionBadge").should("be.visible");
    cy.get("#temporarySessionBadge").should("contain", "Temporary Session");
    cy.get("#statusBadge").should("contain", "Temporary session");
    cy.get("#tree").should("contain", "Temporary session");
  });

  it("allows creating and editing notes in temporary session", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#currentFilename").should("contain", fileName);

    cy.get("#editor").clear().type(markdown);
    cy.get("#dirtyDot").should("be.visible");

    cy.get('[data-action="save"]').click({ force: true });
    cy.get("#dirtyDot").should("not.be.visible");
    cy.get("#statusBadge").should("contain", "Saved");

    cy.get("#tree").should("contain", fileName);
  });

  it("enables export functionality after creating notes", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });

    cy.get('[data-action="export-json"]').should("exist");
    cy.get('[data-action="export-markdown"]').should("exist");
  });

  it("exports current note as markdown", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type(markdown);
    cy.get('[data-action="save"]').click({ force: true });

    cy.get('[data-action="export-markdown"]').click({ force: true });

    cy.readFile("cypress/downloads/test-note.md", { timeout: 5000 }).then((content) => {
      expect(content).to.include("# Test Note");
      expect(content).to.include("This is test content.");
    });
  });

  it("exports all notes as JSON", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type("# First Note\n\nContent 1");
    cy.get('[data-action="save"]').click({ force: true });

    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type("# Second Note\n\nContent 2");
    cy.get('[data-action="save"]').click({ force: true });

    cy.get('[data-action="export-json"]').click({ force: true });
    cy.get("#statusBadge").should("contain", "Exported JSON");
  });

  it("opens existing note from tree in temporary session", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type("# Original Content");
    cy.get('[data-action="save"]').click({ force: true });

    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type("# Another Note");
    cy.get('[data-action="save"]').click({ force: true });

    cy.get(".node").first().click();

    cy.get("#currentFilename").should("contain", ".md");
  });

  it("shows unsaved changes indicator when editing", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#currentFilename").should("contain", ".md");
    
    cy.get("#editor").type(" - added content", { force: true });
    cy.get("#dirtyDot").should("be.visible");
  });

  it("renders markdown preview in temporary session", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });

    cy.get("#editor").clear().type("## Section\n\nSome **bold** text.");

    cy.get("#preview").find("h2").should("contain", "Section");
    cy.get("#preview").find("strong").should("contain", "bold");
  });

  it("displays tags after creating notes with hashtags", () => {
    cy.get('[data-action="open-workspace"]').click({ force: true });
    cy.get('[data-action="new-note"]').click({ force: true });
    cy.get("#editor").clear().type("# Note with work tag");
    cy.get('[data-action="save"]').click({ force: true });

    cy.get(".tagrow").should("exist");
  });
});
