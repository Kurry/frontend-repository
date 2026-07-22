export const COMPONENT_FIXTURES = [
  { id: 'hero', name: 'Hero', minWidth: 4, minHeight: 4, allowedCollapse: false, overlay: false },
  { id: 'nav', name: 'Navigation', minWidth: 12, minHeight: 1, allowedCollapse: false, overlay: false },
  { id: 'sidebar', name: 'Sidebar', minWidth: 3, minHeight: 6, allowedCollapse: true, overlay: false },
  { id: 'content-main', name: 'Main Content', minWidth: 6, minHeight: 8, allowedCollapse: false, overlay: false },
  { id: 'widget-1', name: 'Widget 1', minWidth: 2, minHeight: 2, allowedCollapse: true, overlay: false },
  { id: 'widget-2', name: 'Widget 2', minWidth: 2, minHeight: 2, allowedCollapse: true, overlay: false },
  { id: 'footer', name: 'Footer', minWidth: 12, minHeight: 2, allowedCollapse: false, overlay: false },
  { id: 'modal-ad', name: 'Promo Modal', minWidth: 4, minHeight: 4, allowedCollapse: true, overlay: true }
];

export const INITIAL_COMPONENT_STATE = COMPONENT_FIXTURES.map(f => ({
  id: f.id,
  colStart: null,
  rowStart: null,
  colSpan: f.minWidth,
  rowSpan: f.minHeight,
  widthBehavior: 'fraction', // 'min-content' | 'fixed' | 'fraction'
  rowBehavior: 'auto', // 'auto' | 'fixed' | 'minmax'
  visibility: 'visible' // 'visible' | 'hidden'
}));
