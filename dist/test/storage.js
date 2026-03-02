// src/test-support/storage-fixture.ts
var STORAGE_PREFIX = "ink.workspace.";
function workspaceKey(name) {
  return `${STORAGE_PREFIX}${name}`;
}
function normalizeWorkspaceName(name) {
  return name.trim();
}
function parseWorkspace(value) {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const files = {};
    for (const [key, content] of Object.entries(parsed)) {
      if (typeof key === "string" && typeof content === "string") {
        files[key] = content;
      }
    }
    return files;
  } catch {
    return {};
  }
}
function writeWorkspace(storage, workspace, files) {
  storage.setItem(workspaceKey(workspace), JSON.stringify(files));
}
function listWorkspaces(storage) {
  const workspaces = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(STORAGE_PREFIX)) {
      continue;
    }
    workspaces.push(key.slice(STORAGE_PREFIX.length));
  }
  return workspaces.sort((a, b) => a.localeCompare(b));
}
function ensureWorkspace(storage, workspaceName) {
  const normalizedName = normalizeWorkspaceName(workspaceName);
  if (!normalizedName) {
    throw new Error("Workspace name cannot be empty.");
  }
  const key = workspaceKey(normalizedName);
  if (storage.getItem(key) === null) {
    writeWorkspace(storage, normalizedName, {});
  }
  return normalizedName;
}
function listFiles(storage, workspaceName) {
  const files = parseWorkspace(storage.getItem(workspaceKey(workspaceName)));
  return Object.keys(files).sort((a, b) => a.localeCompare(b));
}
function createFile(storage, workspaceName, fileName) {
  const normalizedFileName = fileName.trim();
  if (!normalizedFileName) {
    throw new Error("File name cannot be empty.");
  }
  const workspace = ensureWorkspace(storage, workspaceName);
  const files = parseWorkspace(storage.getItem(workspaceKey(workspace)));
  if (!(normalizedFileName in files)) {
    files[normalizedFileName] = "";
    writeWorkspace(storage, workspace, files);
  }
  return normalizedFileName;
}
function readFile(storage, workspaceName, fileName) {
  const files = parseWorkspace(storage.getItem(workspaceKey(workspaceName)));
  return files[fileName] ?? "";
}
function saveFile(storage, workspaceName, fileName, content) {
  const workspace = ensureWorkspace(storage, workspaceName);
  const files = parseWorkspace(storage.getItem(workspaceKey(workspace)));
  files[fileName] = content;
  writeWorkspace(storage, workspace, files);
}
export {
  createFile,
  ensureWorkspace,
  listFiles,
  listWorkspaces,
  readFile,
  saveFile
};
