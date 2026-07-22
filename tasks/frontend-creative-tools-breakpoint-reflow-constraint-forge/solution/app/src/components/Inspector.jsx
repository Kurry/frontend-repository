import React from 'react';
import { useStore } from '../store';
import { COMPONENT_FIXTURES } from '../fixtures';

export default function Inspector() {
  const {
    selectedComponentId,
    desktopLayout,
    tabletOverrides,
    mobileOverrides,
    updateDesktopLayout,
    updateOverride,
    activeMode,
    viewportWidth
  } = useStore();

  if (!selectedComponentId) {
    return (
      <div className="w-80 bg-[#252526] border-l border-[#333333] p-4 text-gray-500 text-sm flex items-center justify-center">
        Select a component to inspect constraints.
      </div>
    );
  }

  const fixture = COMPONENT_FIXTURES.find(f => f.id === selectedComponentId);
  const base = desktopLayout.find(c => c.id === selectedComponentId);
  const tablet = tabletOverrides[selectedComponentId] || {};
  const mobile = mobileOverrides[selectedComponentId] || {};

  const handleUpdate = (prop, value, mode = null) => {
    const targetMode = mode || activeMode;
    if (targetMode === 'desktop') {
      updateDesktopLayout(selectedComponentId, { [prop]: value });
    } else {
      updateOverride(targetMode, selectedComponentId, prop, value);
    }
  };

  const currentActiveBreakpoint = viewportWidth >= 1024 ? 'desktop' : viewportWidth >= 600 ? 'tablet' : 'mobile';

  return (
    <div className="w-80 bg-[#252526] border-l border-[#333333] flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[#333] bg-[#1e1e1e]">
        <h2 className="text-white font-bold mb-1">{fixture.name}</h2>
        <div className="text-xs text-gray-400">ID: {fixture.id}</div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Intrinsic Fixture</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 bg-[#1e1e1e] p-2 border border-[#333] rounded">
            <div>Min W: {fixture.minWidth}</div>
            <div>Min H: {fixture.minHeight}</div>
            <div>Collapse: {fixture.allowedCollapse ? 'Yes' : 'No'}</div>
            <div>Overlay: {fixture.overlay ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Constraints Rail</h3>
            <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-white capitalize">{currentActiveBreakpoint} Active</span>
          </div>

          <div className="space-y-4">
            <ConstraintRow
              label="Col Span"
              prop="colSpan"
              base={base.colSpan}
              tablet={tablet.colSpan}
              mobile={mobile.colSpan}
              onUpdate={handleUpdate}
              type="number"
            />
            <ConstraintRow
              label="Row Span"
              prop="rowSpan"
              base={base.rowSpan}
              tablet={tablet.rowSpan}
              mobile={mobile.rowSpan}
              onUpdate={handleUpdate}
              type="number"
            />
            <ConstraintRow
              label="Visibility"
              prop="visibility"
              base={base.visibility}
              tablet={tablet.visibility}
              mobile={mobile.visibility}
              onUpdate={handleUpdate}
              type="select"
              options={['visible', 'hidden']}
            />
            <ConstraintRow
              label="Width Rule"
              prop="widthBehavior"
              base={base.widthBehavior}
              tablet={tablet.widthBehavior}
              mobile={mobile.widthBehavior}
              onUpdate={handleUpdate}
              type="select"
              options={['min-content', 'fixed', 'fraction']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConstraintRow({ label, prop, base, tablet, mobile, onUpdate, type, options }) {
  const { activeMode } = useStore();

  const renderInput = (mode, val, isOverride) => {
    const isEditingMode = activeMode === mode;
    const valueToUse = val !== undefined ? val : (mode === 'desktop' ? base : '');

    const handleChange = (e) => {
      let newVal = e.target.value;
      if (type === 'number') newVal = parseInt(newVal) || null;
      if (newVal === '' || isNaN(newVal)) newVal = null;
      onUpdate(prop, newVal, mode);
    };

    if (type === 'select') {
      return (
        <select
          value={valueToUse}
          onChange={handleChange}
          disabled={!isEditingMode && mode !== 'desktop'}
          className={`w-full bg-[#1e1e1e] border ${isEditingMode ? 'border-[#007acc]' : 'border-[#333]'} text-xs p-1 rounded ${isOverride ? 'text-[#007acc]' : 'text-gray-300'}`}
        >
          {mode !== 'desktop' && <option value="">Inherit</option>}
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    return (
      <input
        type={type}
        value={valueToUse}
        onChange={handleChange}
        placeholder={mode !== 'desktop' ? 'Inherit' : ''}
        disabled={!isEditingMode && mode !== 'desktop'}
        className={`w-full bg-[#1e1e1e] border ${isEditingMode ? 'border-[#007acc]' : 'border-[#333]'} text-xs p-1 rounded text-center ${isOverride ? 'text-[#007acc]' : 'text-gray-300'}`}
      />
    );
  };

  return (
    <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2 items-center">
      <div className="text-xs text-gray-400">{label}</div>
      <div>
        <div className="text-[10px] text-gray-500 mb-1 text-center">D</div>
        {renderInput('desktop', base, false)}
      </div>
      <div>
        <div className="text-[10px] text-gray-500 mb-1 text-center">T</div>
        {renderInput('tablet', tablet, tablet !== undefined)}
      </div>
      <div>
        <div className="text-[10px] text-gray-500 mb-1 text-center">M</div>
        {renderInput('mobile', mobile, mobile !== undefined)}
      </div>
    </div>
  );
}
