// src/auth/github.ts
var GITHUB_CLIENT_ID = "Ov23liedFdRiJdiifvVX";
var GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
var GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
var STORAGE_KEY = "ink_github_token";
var CODE_VERIFIER_KEY = "ink_github_code_verifier";
var DEFAULT_POLL_INTERVAL_MS = 5e3;
var MAX_POLL_INTERVAL_MS = 6e4;
var BACKOFF_MULTIPLIER = 2;
var AuthErrorType = /* @__PURE__ */ ((AuthErrorType2) => {
  AuthErrorType2["NetworkError"] = "network_error";
  AuthErrorType2["AccessDenied"] = "access_denied";
  AuthErrorType2["InvalidRequest"] = "invalid_request";
  AuthErrorType2["ServerError"] = "server_error";
  AuthErrorType2["InvalidState"] = "invalid_state";
  AuthErrorType2["Timeout"] = "timeout";
  AuthErrorType2["Unknown"] = "unknown";
  return AuthErrorType2;
})(AuthErrorType || {});
var AuthError = class extends Error {
  constructor(type, message, retryAfterMs) {
    super(message);
    this.type = type;
    this.retryAfterMs = retryAfterMs;
    this.name = "AuthError";
  }
};
function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "").slice(0, 128);
}
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function calculateBackoff(attempt, baseIntervalMs = DEFAULT_POLL_INTERVAL_MS) {
  const exponentialDelay = baseIntervalMs * Math.pow(BACKOFF_MULTIPLIER, attempt);
  const jitter = Math.random() * 1e3;
  return Math.min(exponentialDelay + jitter, MAX_POLL_INTERVAL_MS);
}
async function parseJsonResponse(response) {
  const json = await response.json();
  return json;
}
function createAuthManager() {
  const listeners = {
    onStateChange: null,
    onError: null,
    onAuthStep: null
  };
  let state = {
    isAuthenticated: false,
    isLoading: false,
    error: null,
    authStep: null
  };
  let currentToken = null;
  function emitStateChange() {
    if (listeners.onStateChange) {
      listeners.onStateChange({ ...state });
    }
  }
  function emitError(error) {
    if (listeners.onError) {
      listeners.onError(error);
    }
  }
  function emitAuthStep(message) {
    state.authStep = message;
    if (listeners.onAuthStep) {
      listeners.onAuthStep(message);
    }
    emitStateChange();
  }
  function setState(updates) {
    state = { ...state, ...updates };
    emitStateChange();
  }
  function getStoredToken() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
  function storeToken(token) {
    try {
      localStorage.setItem(STORAGE_KEY, token);
      currentToken = token;
    } catch {
      throw new AuthError(
        "unknown" /* Unknown */,
        "Failed to store token securely."
      );
    }
  }
  function clearStoredToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      currentToken = null;
    } catch {
    }
  }
  function storeCodeVerifier(verifier) {
    try {
      sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
    } catch {
      throw new AuthError(
        "unknown" /* Unknown */,
        "Failed to store verification code."
      );
    }
  }
  function getAndClearCodeVerifier() {
    try {
      const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
      sessionStorage.removeItem(CODE_VERIFIER_KEY);
      return verifier;
    } catch {
      return null;
    }
  }
  async function buildAuthorizationUrl(codeChallenge) {
    const redirectUri = getRedirectUri();
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "read:user",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: generateState()
    });
    return new URL(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
  }
  function getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }
  function generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function startAuthFlow() {
    setState({ isLoading: true, error: null });
    emitAuthStep("Preparing authentication...");
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      storeCodeVerifier(codeVerifier);
      const authUrl = await buildAuthorizationUrl(codeChallenge);
      emitAuthStep("Redirecting to GitHub...");
      window.location.href = authUrl.toString();
    } catch (e) {
      setState({ isLoading: false });
      if (e instanceof AuthError) {
        emitError(e);
        throw e;
      }
      const error = new AuthError(
        "network_error" /* NetworkError */,
        `Failed to start authentication: ${String(e)}`
      );
      emitError(error);
      throw error;
    }
  }
  async function handleCallback() {
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    if (error) {
      if (error === "access_denied") {
        const authError2 = new AuthError(
          "access_denied" /* AccessDenied */,
          "Authorization denied. Please try again."
        );
        setState({ isLoading: false, error: authError2.message });
        emitError(authError2);
        clearUrlParams();
        return false;
      }
      const authError = new AuthError(
        "invalid_request" /* InvalidRequest */,
        errorDescription || `Authentication error: ${error}`
      );
      setState({ isLoading: false, error: authError.message });
      emitError(authError);
      clearUrlParams();
      return false;
    }
    const code = url.searchParams.get("code");
    if (!code) {
      const authError = new AuthError(
        "invalid_state" /* InvalidState */,
        "Missing authorization code in callback."
      );
      setState({ isLoading: false, error: authError.message });
      emitError(authError);
      clearUrlParams();
      return false;
    }
    const codeVerifier = getAndClearCodeVerifier();
    if (!codeVerifier) {
      const authError = new AuthError(
        "invalid_state" /* InvalidState */,
        "Verification code expired. Please try again."
      );
      setState({ isLoading: false, error: authError.message });
      emitError(authError);
      clearUrlParams();
      return false;
    }
    setState({ isLoading: true });
    emitAuthStep("Exchanging code for token...");
    try {
      const token = await exchangeCodeForToken(code, codeVerifier);
      storeToken(token);
      setState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authStep: null
      });
      clearUrlParams();
      return true;
    } catch (e) {
      if (e instanceof AuthError) {
        setState({ isLoading: false, error: e.message });
        emitError(e);
        clearUrlParams();
        return false;
      }
      const authError = new AuthError(
        "network_error" /* NetworkError */,
        `Token exchange failed: ${String(e)}`
      );
      setState({ isLoading: false, error: authError.message });
      emitError(authError);
      clearUrlParams();
      return false;
    }
  }
  function clearUrlParams() {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }
  async function exchangeCodeForToken(code, codeVerifier) {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        code,
        code_verifier: codeVerifier,
        grant_type: "authorization_code"
      })
    });
    if (!response.ok) {
      const authError = new AuthError(
        "server_error" /* ServerError */,
        `Token request failed: ${response.status}`
      );
      throw authError;
    }
    const data = await parseJsonResponse(response);
    if (data.error) {
      if (data.error === "access_denied") {
        throw new AuthError(
          "access_denied" /* AccessDenied */,
          "Authorization denied. Please try again."
        );
      }
      if (data.error === "expired_token") {
        throw new AuthError(
          "timeout" /* Timeout */,
          "Authorization expired. Please try again."
        );
      }
      throw new AuthError(
        "invalid_request" /* InvalidRequest */,
        data.error_description || `Authentication error: ${data.error}`
      );
    }
    if (!data.access_token) {
      throw new AuthError(
        "server_error" /* ServerError */,
        "No access token in response."
      );
    }
    return data.access_token;
  }
  function restoreSession() {
    const token = getStoredToken();
    if (token) {
      currentToken = token;
      setState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authStep: null
      });
      return true;
    }
    return false;
  }
  function logout() {
    clearStoredToken();
    try {
      sessionStorage.removeItem(CODE_VERIFIER_KEY);
    } catch {
    }
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      authStep: null
    });
  }
  function getToken() {
    return currentToken;
  }
  function isAuthenticated() {
    return state.isAuthenticated;
  }
  function getState() {
    return { ...state };
  }
  function subscribe(listenersMap) {
    if (listenersMap.onStateChange) {
      listeners.onStateChange = listenersMap.onStateChange;
    }
    if (listenersMap.onError) {
      listeners.onError = listenersMap.onError;
    }
    if (listenersMap.onAuthStep) {
      listeners.onAuthStep = listenersMap.onAuthStep;
    }
    return () => {
      if (listenersMap.onStateChange) listeners.onStateChange = null;
      if (listenersMap.onError) listeners.onError = null;
      if (listenersMap.onAuthStep) listeners.onAuthStep = null;
    };
  }
  return {
    startAuthFlow,
    handleCallback,
    restoreSession,
    logout,
    getToken,
    isAuthenticated,
    getState,
    subscribe
  };
}
export {
  AuthError,
  AuthErrorType,
  calculateBackoff,
  createAuthManager,
  generateCodeChallenge,
  generateCodeVerifier
};
