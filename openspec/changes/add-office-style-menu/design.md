# Design: Office-Style Menu Bar Implementation

## Context

The ink markdown note-taking application needs a proper office-style menu bar to improve user experience and provide familiar desktop application patterns. The application currently has a functional but button-heavy interface. The menu bar should integrate seamlessly with existing functionality while adding discoverability and keyboard shortcuts.

## Goals / Non-Goals

### Goals
- Provide familiar File, Edit, and Import/Export menu structure
- Add keyboard shortcuts for common operations
- Maintain full backward compatibility with existing buttons
- Ensure accessibility with proper ARIA attributes
- Keep implementation simple and maintainable
- Follow existing code patterns and architecture

### Non-Goals
- Replace existing button interface (menus complement, don't replace)
- Add complex menu features like toolbars or ribbons
- Implement undo/redo functionality (not currently in scope)
- Add theming or customization options
- Support for nested submenus beyond basic dropdowns

## Decisions

### Menu Structure Decision
**Decision**: Use a horizontal menu bar with dropdown menus for File, Edit, and Import/Export sections.

**Rationale**: This follows standard desktop application patterns and provides clear organization of functionality. The horizontal layout works well with the existing sidebar layout.

**Alternatives considered**:
- Contextual menus only: Rejected because it reduces discoverability
- Vertical sidebar menu: Rejected because it conflicts with existing workspace sidebar
- Hybrid approach: Rejected for complexity

### Keyboard Shortcuts Decision
**Decision**: Implement standard desktop application shortcuts:
- Ctrl/Cmd+N: New Note
- Ctrl/Cmd+O: Open Workspace  
- Ctrl/Cmd+S: Save
- F5: Refresh
- Ctrl/Cmd+Shift+S: Export JSON
- Ctrl/Cmd+Shift+M: Export Markdown

**Rationale**: These follow established conventions from applications like VS Code, Notepad++, and other desktop editors.

**Alternatives considered**:
- Custom shortcuts: Rejected for discoverability
- No shortcuts: Rejected because power users expect them

### Integration Approach Decision
**Decision**: Extend existing InkApp class methods rather than creating new menu-specific functions.

**Rationale**: This maintains code reuse and ensures consistent behavior between button clicks and menu selections. The existing methods already handle edge cases and error conditions properly.

**Alternatives considered**:
- Separate menu handlers: Rejected because it would duplicate logic
- Event delegation: Rejected because direct method calls are simpler

### Accessibility Decision
**Decision**: Implement full ARIA support with proper roles, labels, and keyboard navigation.

**Rationale**: Essential for screen reader users and keyboard-only navigation. Follows WCAG guidelines for menu widgets.

**Alternatives considered**:
- Basic accessibility: Rejected because it doesn't meet modern standards
- No accessibility: Rejected as unacceptable

## Risks / Trade-offs

### Risk: Layout Complexity
**Risk**: Adding menu bar could complicate the existing layout and cause responsive design issues.

**Mitigation**: 
- Use CSS Grid/Flexbox for flexible layout
- Test thoroughly on different screen sizes
- Maintain existing responsive behavior

### Risk: Keyboard Shortcut Conflicts
**Risk**: New shortcuts might conflict with browser or OS shortcuts.

**Mitigation**:
- Use standard shortcuts that don't conflict
- Add proper event.preventDefault() handling
- Test on different platforms

### Risk: Performance Impact
**Risk**: Additional DOM elements and event listeners could impact performance.

**Mitigation**:
- Use event delegation where possible
- Minimize DOM manipulation
- Follow existing performance patterns

## Migration Plan

### Phase 1: Core Menu Structure
1. Add HTML structure and basic CSS
2. Implement menu toggle functionality
3. Add basic keyboard navigation

### Phase 2: Menu Item Implementation
1. Implement File menu items
2. Implement Edit menu items  
3. Implement Import/Export menu items

### Phase 3: Polish and Testing
1. Add comprehensive tests
2. Implement accessibility features
3. Add keyboard shortcuts
4. Performance optimization

### Rollback Plan
If issues arise, the menu bar can be easily disabled by:
1. Removing menu HTML structure
2. Removing menu-specific CSS
3. Removing menu event handlers
4. All existing functionality remains intact

## Open Questions

1. **Should we add a Help menu?** - Currently not planned, but could be added later
2. **Should menu items be disabled when not applicable?** - Yes, following existing button patterns
3. **Should we support right-click context menus?** - Not in initial implementation, could be added later
4. **Should we add menu animations?** - No, keeping it simple and fast