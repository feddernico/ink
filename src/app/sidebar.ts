import type { AppState, DomRefs } from "./types";

export function applySidebarState(els: DomRefs, state: AppState): void {
  const isCollapsed = state.isSidebarCollapsed;
  els.app.classList.toggle("sidebar-collapsed", isCollapsed);
  els.workspaceSidebar.classList.toggle("collapsed", isCollapsed);
  els.sidebarToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
  els.sidebarToggleBtn.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
  els.sidebarToggleBtn.title = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
  els.sidebarToggleBtn.textContent = isCollapsed ? "▼ Expand" : "▶ Collapse";
}

export function setSidebarCollapsed(els: DomRefs, state: AppState, isCollapsed: boolean): void {
  state.isSidebarCollapsed = isCollapsed;
  applySidebarState(els, state);
}
