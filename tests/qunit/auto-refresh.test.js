import QUnit from "qunit";
import { createAutoRefresh } from "../../dist/test/auto-refresh.js";

function createState(overrides = {}) {
  return {
    workspaceHandle: { name: "vault" },
    autoRefreshMs: 60000,
    autoRefreshTimer: null,
    isDirty: false,
    lastWorkspaceInteractionAt: Date.now() - 6000,
    ...overrides,
  };
}

function createHarness(stateOverrides = {}) {
  const calls = {
    ensurePermission: [],
    rescanWorkspace: [],
    statuses: [],
    toasts: [],
  };
  const state = createState(stateOverrides);
  const controller = createAutoRefresh({
    state,
    ensurePermission: async (handle, mode) => {
      calls.ensurePermission.push({ handle, mode });
      return true;
    },
    rescanWorkspace: async (options) => {
      calls.rescanWorkspace.push(options);
      return true;
    },
    showToast: (message, options) => {
      calls.toasts.push({ message, options });
    },
    setStatus: (message, kind) => {
      calls.statuses.push({ message, kind });
    },
  });

  return { calls, controller, state };
}

QUnit.module("auto-refresh");

QUnit.test("recent interaction prevents every background filesystem call", async (assert) => {
  const { calls, controller } = createHarness({
    lastWorkspaceInteractionAt: Date.now(),
  });

  await controller.runAutoRefresh();

  assert.strictEqual(calls.ensurePermission.length, 0, "permission should not be queried while the user is active");
  assert.strictEqual(calls.rescanWorkspace.length, 0, "workspace should not be rescanned while the user is active");
});

QUnit.test("dirty documents prevent every background filesystem call", async (assert) => {
  const { calls, controller } = createHarness({ isDirty: true });

  await controller.runAutoRefresh();

  assert.strictEqual(calls.ensurePermission.length, 0, "permission should not be queried while edits are unsaved");
  assert.strictEqual(calls.rescanWorkspace.length, 0, "workspace should not be rescanned while edits are unsaved");
});

QUnit.test("idle workspace performs one silent rescan after permission check", async (assert) => {
  const { calls, controller, state } = createHarness();

  await controller.runAutoRefresh();

  assert.deepEqual(
    calls.ensurePermission,
    [{ handle: state.workspaceHandle, mode: "read" }],
    "idle refresh should check read permission once",
  );
  assert.deepEqual(
    calls.rescanWorkspace,
    [{ silent: true }],
    "idle refresh should request exactly one silent rescan",
  );
});

QUnit.test("missing workspace does not touch the filesystem", async (assert) => {
  const { calls, controller } = createHarness({ workspaceHandle: null });

  await controller.runAutoRefresh();

  assert.strictEqual(calls.ensurePermission.length, 0);
  assert.strictEqual(calls.rescanWorkspace.length, 0);
});

QUnit.test("revoked permission stops refresh and reports the problem", async (assert) => {
  const calls = { rescans: 0, statuses: [], toasts: [] };
  const state = createState();
  const controller = createAutoRefresh({
    state,
    ensurePermission: async () => false,
    rescanWorkspace: async () => {
      calls.rescans += 1;
      return true;
    },
    showToast: (message, options) => {
      calls.toasts.push({ message, options });
    },
    setStatus: (message, kind) => {
      calls.statuses.push({ message, kind });
    },
  });

  await controller.runAutoRefresh();

  assert.strictEqual(calls.rescans, 0, "revoked permission must prevent scanning");
  assert.deepEqual(calls.statuses.at(-1), { message: "Permission revoked", kind: "err" });
  assert.ok(calls.toasts.at(-1).message.includes("permission revoked"));
});
