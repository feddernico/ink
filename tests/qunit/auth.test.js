import QUnit from "qunit";
import {
  createAuthManager,
  generateCodeVerifier,
  generateCodeChallenge,
  calculateBackoff,
  AuthError,
  AuthErrorType,
} from "../../dist/test/github.js";

/**
 * Mock localStorage for testing
 */
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.get(key) ?? null;
  }

  setItem(key, value) {
    this.store.set(key, value);
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

/**
 * Mock sessionStorage for testing
 */
class MockSessionStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.get(key) ?? null;
  }

  setItem(key, value) {
    this.store.set(key, value);
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

/**
 * Mock fetch for testing
 */
class MockFetch {
  constructor() {
    this.responses = new Map();
    this.callHistory = [];
  }

  mock(url, response) {
    this.responses.set(url, response);
  }

  getCalls() {
    return [...this.callHistory];
  }

  clear() {
    this.responses.clear();
    this.callHistory = [];
  }

  async fetch(url, options = {}) {
    this.callHistory.push({ url, options });
    const response = this.responses.get(url);
    if (!response) {
      return {
        ok: false,
        status: 404,
        async json() {
          return {};
        },
      };
    }
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      async json() {
        return response.body;
      },
    };
  }
}

QUnit.module("auth/github", () => {
  QUnit.module("PKCE functions", () => {
    QUnit.test("generateCodeVerifier creates valid length string", function (assert) {
      const verifier = generateCodeVerifier();
      assert.ok(verifier.length >= 43 && verifier.length <= 128,
        "Code verifier should be 43-128 characters");
    });

    QUnit.test("generateCodeVerifier creates URL-safe characters", function (assert) {
      const verifier = generateCodeVerifier();
      // Base64url characters: A-Z, a-z, 0-9, -, ., _, ~
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      assert.ok(validChars.test(verifier),
        "Code verifier should only contain URL-safe characters");
    });

    QUnit.test("generateCodeVerifier creates unique strings", function (assert) {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      assert.notStrictEqual(verifier1, verifier2,
        "Each call should generate a unique verifier");
    });

    QUnit.test("generateCodeChallenge produces correct format", async function (assert) {
      const verifier = "test_verifier_string_with_exact_length_43chars";
      const challenge = await generateCodeChallenge(verifier);

      // Base64url format (no + or /, no padding)
      const base64urlPattern = /^[A-Za-z0-9\-_]+$/;
      assert.ok(base64urlPattern.test(challenge),
        "Code challenge should be base64url encoded");
      assert.ok(challenge.length > 0, "Code challenge should not be empty");
    });

    QUnit.test("S256 produces deterministic result", async function (assert) {
      const verifier = "test_verifier_for_determinism_check_12345";
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);

      assert.strictEqual(challenge1, challenge2,
        "Same verifier should produce same challenge");
    });
  });

  QUnit.module("calculateBackoff", () => {
    QUnit.test("returns base delay for first attempt", function (assert) {
      const delay = calculateBackoff(0, 5000);
      // Base delay + jitter (0-1000)
      assert.ok(delay >= 5000 && delay < 6000, "Delay should be around 5000-6000ms");
    });

    QUnit.test("returns exponential delay for subsequent attempts", function (assert) {
      const delay2 = calculateBackoff(2, 5000);
      const delay3 = calculateBackoff(3, 5000);

      // 5000 * 2^2 = 20000 + jitter
      assert.ok(delay2 >= 20000 && delay2 < 21000, "Delay should be around 20000-21000ms for attempt 2");

      // 5000 * 2^3 = 40000 + jitter
      assert.ok(delay3 >= 40000 && delay3 < 41000, "Delay should be around 40000-41000ms for attempt 3");
    });

    QUnit.test("caps delay at maximum interval", function (assert) {
      const delay = calculateBackoff(100, 5000);
      assert.ok(delay <= 61000, "Delay should be capped at max interval (60000 + 1000 jitter)");
    });
  });

  QUnit.module("AuthError", () => {
    QUnit.test("creates error with correct properties", function (assert) {
      const error = new AuthError(AuthErrorType.NetworkError, "Test message");
      assert.strictEqual(error.type, AuthErrorType.NetworkError);
      assert.strictEqual(error.message, "Test message");
      assert.strictEqual(error.name, "AuthError");
    });

    QUnit.test("includes retryAfterMs when provided", function (assert) {
      const error = new AuthError(AuthErrorType.ServerError, "Server error", 5000);
      assert.strictEqual(error.retryAfterMs, 5000);
    });
  });

  QUnit.module("createAuthManager", (hooks) => {
    let mockStorage;
    let mockSessionStorage;
    let mockFetch;
    let originalFetch;
    let originalLocalStorage;
    let originalSessionStorage;
    let mockWindowLocation;

    hooks.beforeEach(function () {
      mockStorage = new MockLocalStorage();
      mockSessionStorage = new MockSessionStorage();
      mockFetch = new MockFetch();

      // Setup mock window.location
      mockWindowLocation = {
        href: "http://localhost:8000/",
        pathname: "/",
        hash: "",
      };

      originalFetch = globalThis.fetch;
      originalLocalStorage = global.localStorage;
      originalSessionStorage = global.sessionStorage;

      globalThis.fetch = function(url, options) { return mockFetch.fetch(url, options); };
      global.localStorage = mockStorage;
      global.sessionStorage = mockSessionStorage;
    });

    hooks.afterEach(function () {
      globalThis.fetch = originalFetch;
      global.localStorage = originalLocalStorage;
      global.sessionStorage = originalSessionStorage;
      mockFetch.clear();
      mockSessionStorage.clear();
    });

    QUnit.test("starts with unauthenticated state", function (assert) {
      const authManager = createAuthManager();
      const state = authManager.getState();

      assert.strictEqual(state.isAuthenticated, false);
      assert.strictEqual(state.isLoading, false);
      assert.strictEqual(state.error, null);
    });

    QUnit.test("restoreSession returns false when no token stored", function (assert) {
      const authManager = createAuthManager();
      const restored = authManager.restoreSession();

      assert.strictEqual(restored, false);
      assert.strictEqual(authManager.isAuthenticated(), false);
    });

    QUnit.test("restoreSession returns true and authenticates when token exists", function (assert) {
      const authManager = createAuthManager();
      mockStorage.setItem("ink_github_token", "test_token_123");

      const restored = authManager.restoreSession();

      assert.strictEqual(restored, true);
      assert.strictEqual(authManager.isAuthenticated(), true);
      assert.strictEqual(authManager.getToken(), "test_token_123");
    });

    QUnit.test("logout clears token and resets state", function (assert) {
      const authManager = createAuthManager();
      mockStorage.setItem("ink_github_token", "test_token_123");
      authManager.restoreSession();

      authManager.logout();

      assert.strictEqual(authManager.isAuthenticated(), false);
      assert.strictEqual(authManager.getToken(), null);
      assert.strictEqual(mockStorage.getItem("ink_github_token"), null);
    });

    QUnit.test("subscribe receives state change notifications", function (assert) {
      const authManager = createAuthManager();
      let stateChanges = 0;
      let lastState = null;

      const unsubscribe = authManager.subscribe({
        onStateChange: function(state) {
          stateChanges++;
          lastState = state;
        },
      });

      mockStorage.setItem("ink_github_token", "test_token");
      authManager.restoreSession();

      assert.strictEqual(stateChanges, 1);
      assert.strictEqual(lastState.isAuthenticated, true);

      authManager.logout();

      assert.strictEqual(stateChanges, 2);
      assert.strictEqual(lastState.isAuthenticated, false);

      unsubscribe();

      authManager.restoreSession();
      assert.strictEqual(stateChanges, 2, "Should not receive events after unsubscribe");
    });

    // Note: Tests involving window.location redirect and crypto mocking are skipped
    // in this Node.js test environment. These would be tested in browser E2E tests.
  });

  QUnit.module("token storage", (hooks) => {
    let mockStorage;
    let mockSessionStorage;
    let originalLocalStorage;
    let originalSessionStorage;
    let mockWindowLocation;

    hooks.beforeEach(function () {
      mockStorage = new MockLocalStorage();
      mockSessionStorage = new MockSessionStorage();
      originalLocalStorage = global.localStorage;
      originalSessionStorage = global.sessionStorage;
      global.localStorage = mockStorage;
      global.sessionStorage = mockSessionStorage;

      mockWindowLocation = {
        href: "http://localhost:8000/",
        pathname: "/",
        hash: "",
      };
    });

    hooks.afterEach(function () {
      global.localStorage = originalLocalStorage;
      global.sessionStorage = originalSessionStorage;
    });

    QUnit.test("logout removes token from storage", function (assert) {
      const authManager = createAuthManager();
      mockStorage.setItem("ink_github_token", "test_token");

      authManager.logout();

      assert.strictEqual(mockStorage.getItem("ink_github_token"), null);
    });

    QUnit.test("logout clears code_verifier from sessionStorage", function (assert) {
      const authManager = createAuthManager();
      mockSessionStorage.setItem("ink_github_code_verifier", "test_verifier");

      authManager.logout();

      assert.strictEqual(mockSessionStorage.getItem("ink_github_code_verifier"), null);
    });
  });
});
