// src/app/fs-api.ts
function isFileSystemApiAvailable() {
  return Boolean(window.showDirectoryPicker && window.FileSystemHandle);
}
function isInMemoryMode() {
  return !isFileSystemApiAvailable();
}
async function ensurePermission(handle, mode = "read") {
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
export {
  ensurePermission,
  isFileSystemApiAvailable,
  isInMemoryMode
};
