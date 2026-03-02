export interface KeyValueStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_PREFIX = "ink.workspace.";

function workspaceKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

function normalizeWorkspaceName(name: string): string {
  return name.trim();
}

function parseWorkspace(value: string | null): Record<string, string> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const files: Record<string, string> = {};
    for (const [key, content] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === "string" && typeof content === "string") {
        files[key] = content;
      }
    }

    return files;
  } catch {
    return {};
  }
}

function writeWorkspace(storage: KeyValueStorage, workspace: string, files: Record<string, string>): void {
  storage.setItem(workspaceKey(workspace), JSON.stringify(files));
}

export function listWorkspaces(storage: KeyValueStorage): string[] {
  const workspaces: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(STORAGE_PREFIX)) {
      continue;
    }

    workspaces.push(key.slice(STORAGE_PREFIX.length));
  }

  return workspaces.sort((a, b) => a.localeCompare(b));
}

export function ensureWorkspace(storage: KeyValueStorage, workspaceName: string): string {
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

export function listFiles(storage: KeyValueStorage, workspaceName: string): string[] {
  const files = parseWorkspace(storage.getItem(workspaceKey(workspaceName)));
  return Object.keys(files).sort((a, b) => a.localeCompare(b));
}

export function createFile(storage: KeyValueStorage, workspaceName: string, fileName: string): string {
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

export function readFile(storage: KeyValueStorage, workspaceName: string, fileName: string): string {
  const files = parseWorkspace(storage.getItem(workspaceKey(workspaceName)));
  return files[fileName] ?? "";
}

export function saveFile(
  storage: KeyValueStorage,
  workspaceName: string,
  fileName: string,
  content: string,
): void {
  const workspace = ensureWorkspace(storage, workspaceName);
  const files = parseWorkspace(storage.getItem(workspaceKey(workspace)));
  files[fileName] = content;
  writeWorkspace(storage, workspace, files);
}
