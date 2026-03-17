import QUnit from "qunit";
import {
  ensurePermission,
  isFileSystemApiAvailable,
  isInMemoryMode,
} from "../../dist/test/fs-api.js";

function setWindow(value) {
  globalThis.window = value;
}

QUnit.module("fs-api", (hooks) => {
  let originalWindow;

  hooks.beforeEach(() => {
    originalWindow = globalThis.window;
    setWindow({});
  });

  hooks.afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      setWindow(originalWindow);
    }
  });

  QUnit.test("isFileSystemApiAvailable returns false when API is missing", (assert) => {
    setWindow({});
    assert.strictEqual(isFileSystemApiAvailable(), false);
  });

  QUnit.test("isFileSystemApiAvailable returns true when API is present", (assert) => {
    setWindow({
      showDirectoryPicker: async () => ({}),
      FileSystemHandle: function FileSystemHandle() {},
    });
    assert.strictEqual(isFileSystemApiAvailable(), true);
  });

  QUnit.test("isInMemoryMode mirrors availability", (assert) => {
    setWindow({});
    assert.strictEqual(isInMemoryMode(), true);

    setWindow({
      showDirectoryPicker: async () => ({}),
      FileSystemHandle: function FileSystemHandle() {},
    });
    assert.strictEqual(isInMemoryMode(), false);
  });

  QUnit.test("ensurePermission returns false for null handle", async (assert) => {
    const result = await ensurePermission(null, "read");
    assert.strictEqual(result, false);
  });

  QUnit.test("ensurePermission returns true when permission APIs are missing", async (assert) => {
    const result = await ensurePermission({});
    assert.strictEqual(result, true);
  });

  QUnit.test("ensurePermission returns true when queryPermission is granted", async (assert) => {
    let requestCalled = false;
    const handle = {
      async queryPermission() {
        return "granted";
      },
      async requestPermission() {
        requestCalled = true;
        return "denied";
      },
    };

    const result = await ensurePermission(handle, "read");
    assert.strictEqual(result, true);
    assert.strictEqual(requestCalled, false);
  });

  QUnit.test("ensurePermission requests permission when not granted", async (assert) => {
    let requestedDescriptor = null;
    const handle = {
      async queryPermission() {
        return "prompt";
      },
      async requestPermission(descriptor) {
        requestedDescriptor = descriptor;
        return "granted";
      },
    };

    const result = await ensurePermission(handle, "readwrite");
    assert.strictEqual(result, true);
    assert.deepEqual(requestedDescriptor, { mode: "readwrite" });
  });

  QUnit.test("ensurePermission returns false when request is denied", async (assert) => {
    const handle = {
      async queryPermission() {
        return "prompt";
      },
      async requestPermission() {
        return "denied";
      },
    };

    const result = await ensurePermission(handle, "read");
    assert.strictEqual(result, false);
  });
});
