import QUnit from "qunit";
import {
  createFile,
  ensureWorkspace,
  listFiles,
  listWorkspaces,
  readFile,
  saveFile,
} from "../../dist/test/storage.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

QUnit.module("storage");

QUnit.test("ensureWorkspace trims name and rejects empty names", (assert) => {
  const storage = new MemoryStorage();

  assert.throws(
    () => ensureWorkspace(storage, "   "),
    /Workspace name cannot be empty\./,
  );

  const name = ensureWorkspace(storage, "  project-a  ");
  assert.strictEqual(name, "project-a");
  assert.deepEqual(listWorkspaces(storage), ["project-a"]);
});

QUnit.test("createFile rejects empty names and creates file once", (assert) => {
  const storage = new MemoryStorage();

  ensureWorkspace(storage, "notes");

  assert.throws(
    () => createFile(storage, "notes", "  \n  "),
    /File name cannot be empty\./,
  );

  createFile(storage, "notes", "daily.md");
  createFile(storage, "notes", "daily.md");

  assert.deepEqual(listFiles(storage, "notes"), ["daily.md"]);
  assert.strictEqual(readFile(storage, "notes", "daily.md"), "");
});

QUnit.test("listWorkspaces and listFiles are sorted", (assert) => {
  const storage = new MemoryStorage();

  ensureWorkspace(storage, "zeta");
  ensureWorkspace(storage, "alpha");
  ensureWorkspace(storage, "beta");

  createFile(storage, "alpha", "z.md");
  createFile(storage, "alpha", "a.md");
  createFile(storage, "alpha", "m.md");

  assert.deepEqual(listWorkspaces(storage), ["alpha", "beta", "zeta"]);
  assert.deepEqual(listFiles(storage, "alpha"), ["a.md", "m.md", "z.md"]);
});

QUnit.test("readFile returns empty string when file does not exist", (assert) => {
  const storage = new MemoryStorage();
  ensureWorkspace(storage, "empty");

  assert.strictEqual(readFile(storage, "empty", "missing.md"), "");
  assert.strictEqual(readFile(storage, "missing-workspace", "missing.md"), "");
});

QUnit.test("saveFile creates missing workspace and persists content", (assert) => {
  const storage = new MemoryStorage();

  saveFile(storage, "new-workspace", "created.md", "# Hello");

  assert.deepEqual(listWorkspaces(storage), ["new-workspace"]);
  assert.deepEqual(listFiles(storage, "new-workspace"), ["created.md"]);
  assert.strictEqual(readFile(storage, "new-workspace", "created.md"), "# Hello");
});

QUnit.test("integration flow: workspace -> create file -> save -> read", (assert) => {
  const storage = new MemoryStorage();

  ensureWorkspace(storage, "workspace-a");
  createFile(storage, "workspace-a", "notes.md");
  saveFile(storage, "workspace-a", "notes.md", "# Ink\n\nSaved content");

  assert.strictEqual(
    readFile(storage, "workspace-a", "notes.md"),
    "# Ink\n\nSaved content",
  );
});

QUnit.test("integration flow: data is isolated between workspaces", (assert) => {
  const storage = new MemoryStorage();

  createFile(storage, "workspace-a", "shared.md");
  createFile(storage, "workspace-b", "shared.md");

  saveFile(storage, "workspace-a", "shared.md", "A");
  saveFile(storage, "workspace-b", "shared.md", "B");

  assert.strictEqual(readFile(storage, "workspace-a", "shared.md"), "A");
  assert.strictEqual(readFile(storage, "workspace-b", "shared.md"), "B");
});
