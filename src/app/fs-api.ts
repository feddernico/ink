import type { PermissionCapableHandle } from "./types";

export function isFileSystemApiAvailable(): boolean {
  return Boolean(window.showDirectoryPicker && window.FileSystemHandle);
}

export async function ensurePermission(
  handle: PermissionCapableHandle | null,
  mode: "read" | "readwrite" = "read",
): Promise<boolean> {
  if (!handle) {
    return false;
  }

  if (!handle.queryPermission || !handle.requestPermission) {
    return true;
  }

  const descriptor = { mode };
  const current = await handle.queryPermission(descriptor);
  if (current === "granted") {
    return true;
  }

  const requested = await handle.requestPermission(descriptor);
  return requested === "granted";
}
