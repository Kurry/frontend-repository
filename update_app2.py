import re

with open("tasks/frontend-workflow-podcast-episode-assembly-board/solution/app/src/App.tsx", "r") as f:
    content = f.read()

keyboard_logic = """
  // Innovation: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedInstance) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        store.deleteInstance(selectedInstance);
      } else if (e.key === 'ArrowRight') {
        store.updateInstance(selectedInstance, { start: store.instances.find(i => i.id === selectedInstance)!.start + 1000, end: store.instances.find(i => i.id === selectedInstance)!.end + 1000 });
      } else if (e.key === 'ArrowLeft') {
        store.updateInstance(selectedInstance, { start: Math.max(0, store.instances.find(i => i.id === selectedInstance)!.start - 1000), end: Math.max(1000, store.instances.find(i => i.id === selectedInstance)!.end - 1000) });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInstance, store]);

  // Trim functionality
  const handleTrimStart = (id: string, delta: number) => {
    const inst = store.instances.find(i => i.id === id);
    if (inst) store.updateInstance(id, { start: Math.max(0, inst.start + delta), sourceStart: Math.max(0, inst.sourceStart + delta) });
  };
  const handleTrimEnd = (id: string, delta: number) => {
    const inst = store.instances.find(i => i.id === id);
    if (inst) store.updateInstance(id, { end: Math.max(inst.start + 1000, inst.end + delta), sourceEnd: Math.max(inst.sourceStart + 1000, inst.sourceEnd + delta) });
  };
"""

content = content.replace("useEffect(() => {\n    // Basic startup checks\n  }, []);", keyboard_logic)

trim_ui = """
            {/* Trim handles */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const onMove = (moveEvent: PointerEvent) => {
                  const delta = (moveEvent.clientX - startX) * 100; // approximate ms mapping
                  store.updateInstance(inst.id, { start: Math.max(0, inst.start + delta) });
                };
                const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              }}
            ></div>
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const onMove = (moveEvent: PointerEvent) => {
                  const delta = (moveEvent.clientX - startX) * 100; // approximate ms mapping
                  store.updateInstance(inst.id, { end: Math.max(inst.start + 100, inst.end + delta) });
                };
                const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              }}
            ></div>
"""

content = re.sub(
    r"\{\/\* Trim handles \*\/\}.*? hover:bg-black/40\"></div>",
    trim_ui.strip(),
    content,
    flags=re.DOTALL
)

with open("tasks/frontend-workflow-podcast-episode-assembly-board/solution/app/src/App.tsx", "w") as f:
    f.write(content)
