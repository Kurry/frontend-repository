import { COMPONENT_FIXTURES } from '../fixtures';

export function resolveComponentState(componentId, viewportWidth, storeState) {
  const { desktopLayout, tabletOverrides, mobileOverrides } = storeState;

  const base = desktopLayout.find(c => c.id === componentId);
  const tablet = tabletOverrides[componentId] || {};
  const mobile = mobileOverrides[componentId] || {};

  // Resolve properties based on viewport
  let resolved = { ...base };

  if (viewportWidth < 1024) {
    resolved = { ...resolved, ...tablet };
  }

  if (viewportWidth < 600) {
    resolved = { ...resolved, ...mobile };
  }

  // Enforce intrinsic bounds
  const fixture = COMPONENT_FIXTURES.find(f => f.id === componentId);

  if (!fixture.allowedCollapse) {
    if (resolved.colSpan < fixture.minWidth) {
      resolved.colSpan = fixture.minWidth;
    }
    if (resolved.rowSpan < fixture.minHeight) {
      resolved.rowSpan = fixture.minHeight;
    }
  }

  return resolved;
}
