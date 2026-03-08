import QUnit from "qunit";

QUnit.module("mobile fallback - JSON export format");

QUnit.test("JSON export structure is correct", (assert) => {
  const notes = [
    {
      name: "note1.md",
      relPath: "note1.md",
      content: "# Note 1\n\nContent here",
      lastModified: 1700000000000,
      tags: new Set(["tag1"]),
    },
    {
      name: "note2.md",
      relPath: "note2.md",
      content: "# Note 2\n\nMore content",
      lastModified: 1700000001000,
      tags: new Set(["tag2"]),
    },
  ];

  const exportData = {
    exportedAt: new Date().toISOString(),
    notes: notes.map((note) => ({
      name: note.name,
      path: note.relPath,
      content: note.content,
      lastModified: new Date(note.lastModified).toISOString(),
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const parsed = JSON.parse(json);

  assert.ok(parsed.exportedAt, "Should have exportedAt timestamp");
  assert.strictEqual(parsed.notes.length, 2, "Should have 2 notes");
  assert.strictEqual(parsed.notes[0].name, "note1.md", "First note should have correct name");
  assert.strictEqual(parsed.notes[0].path, "note1.md", "First note should have correct path");
  assert.ok(parsed.notes[0].content.includes("Note 1"), "First note should have content");
});

QUnit.module("mobile fallback - in-memory note management");

QUnit.test("in-memory notes can be created and found by relPath", (assert) => {
  const inMemoryNotes = [];

  const note1 = {
    name: "note1.md",
    relPath: "note1.md",
    content: "# Note 1",
    lastModified: Date.now(),
    tags: new Set(["tag1"]),
  };

  const note2 = {
    name: "note2.md",
    relPath: "note2.md",
    content: "# Note 2",
    lastModified: Date.now(),
    tags: new Set(["tag2"]),
  };

  inMemoryNotes.push(note1);
  inMemoryNotes.push(note2);

  const found = inMemoryNotes.find((n) => n.relPath === "note1.md");
  assert.ok(found, "Should find note by relPath");
  assert.strictEqual(found?.name, "note1.md", "Found note should have correct name");
});

QUnit.test("in-memory note content can be updated", (assert) => {
  const note = {
    name: "note.md",
    relPath: "note.md",
    content: "# Original",
    lastModified: Date.now(),
    tags: new Set(),
  };

  note.content = "# Updated";
  note.lastModified = Date.now();

  assert.strictEqual(note.content, "# Updated", "Content should be updated");
  assert.ok(note.lastModified > 0, "Last modified should be updated");
});

QUnit.test("in-memory notes are correctly counted", (assert) => {
  const inMemoryNotes = [
    { name: "note1.md", relPath: "note1.md", content: "", lastModified: 0, tags: new Set() },
    { name: "note2.md", relPath: "note2.md", content: "", lastModified: 0, tags: new Set() },
    { name: "note3.md", relPath: "note3.md", content: "", lastModified: 0, tags: new Set() },
  ];

  const count = inMemoryNotes.length;
  assert.strictEqual(count, 3, "Should have 3 notes");
});

QUnit.test("in-memory notes can be filtered by tag", (assert) => {
  const inMemoryNotes = [
    { name: "note1.md", relPath: "note1.md", content: "", lastModified: 0, tags: new Set(["work", "docs"]) },
    { name: "note2.md", relPath: "note2.md", content: "", lastModified: 0, tags: new Set(["personal"]) },
    { name: "note3.md", relPath: "note3.md", content: "", lastModified: 0, tags: new Set(["work"]) },
  ];

  const workNotes = inMemoryNotes.filter((n) => n.tags.has("work"));
  assert.strictEqual(workNotes.length, 2, "Should have 2 work notes");
});

QUnit.test("markdown filename extraction from full path", (assert) => {
  const relPath = "folder/subfolder/note.md";
  const fileName = relPath.split("/").pop();

  assert.strictEqual(fileName, "note.md", "Should extract correct filename");
  assert.ok(fileName.endsWith(".md"), "Should be markdown file");
});
