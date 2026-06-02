import QUnit from "qunit";
import { applyEditorViewMode, loadEditorViewMode, setEditorViewMode } from "../../dist/test/editor-preview.js";

function createClassList() {
  const classes = new Set();
  return {
    add(value) {
      classes.add(value);
    },
    remove(value) {
      classes.delete(value);
    },
    toggle(value, force) {
      if (force === undefined) {
        if (classes.has(value)) {
          classes.delete(value);
          return false;
        }
        classes.add(value);
        return true;
      }
      if (force) {
        classes.add(value);
        return true;
      }
      classes.delete(value);
      return false;
    },
    contains(value) {
      return classes.has(value);
    },
    toArray() {
      return [...classes];
    },
  };
}

function createButton() {
  return {
    classList: createClassList(),
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    },
  };
}

function createPane() {
  return {
    hidden: false,
    classList: createClassList(),
  };
}

function createDomRefs() {
  return {
    editorSplit: { classList: createClassList() },
    editorPane: createPane(),
    previewPane: createPane(),
    editorViewModeGroup: {},
    editorViewSourceBtn: createButton(),
    editorViewSplitBtn: createButton(),
    editorViewPreviewBtn: createButton(),
  };
}

QUnit.module("editor-preview", (hooks) => {
  hooks.beforeEach(function () {
    this.originalLocalStorage = global.localStorage;
    global.localStorage = {
      store: new Map(),
      getItem(key) {
        return this.store.get(key) ?? null;
      },
      setItem(key, value) {
        this.store.set(key, value);
      },
    };
  });

  hooks.afterEach(function () {
    global.localStorage = this.originalLocalStorage;
  });

  QUnit.test("loadEditorViewMode defaults to split", function (assert) {
    assert.strictEqual(loadEditorViewMode(), "split");
  });

  QUnit.test("setEditorViewMode updates state, storage, and buttons", function (assert) {
    const els = createDomRefs();
    const state = { editorViewMode: "split" };

    setEditorViewMode(els, state, "preview");

    assert.strictEqual(state.editorViewMode, "preview", "state should update");
    assert.strictEqual(global.localStorage.getItem("ink-editor-view-mode"), "preview", "mode should persist");
    assert.strictEqual(els.editorPane.hidden, true, "editor should hide in preview mode");
    assert.strictEqual(els.previewPane.hidden, false, "preview should remain visible");
    assert.strictEqual(els.editorViewPreviewBtn.getAttribute("aria-pressed"), "true", "active button should be pressed");
    assert.ok(els.editorSplit.classList.contains("view-preview"), "split container should reflect preview mode");
  });

  QUnit.test("applyEditorViewMode switches back to source view", function (assert) {
    const els = createDomRefs();

    applyEditorViewMode(els, "source");

    assert.strictEqual(els.editorPane.hidden, false, "editor should remain visible in source mode");
    assert.strictEqual(els.previewPane.hidden, true, "preview should hide in source mode");
    assert.strictEqual(els.editorViewSourceBtn.getAttribute("aria-pressed"), "true", "source button should be active");
    assert.ok(els.editorSplit.classList.contains("view-source"), "split container should reflect source mode");
  });
});
