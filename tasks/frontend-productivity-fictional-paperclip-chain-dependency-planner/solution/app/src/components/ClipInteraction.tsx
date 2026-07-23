interface ClipInteractionProps {
  active: boolean;
  activeJaw: string | null;
  previewTargetId: string | null;
}

export default function ClipInteraction({ active, activeJaw, previewTargetId }: ClipInteractionProps) {
  if (!active) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 shadow-lg border border-slate-200 rounded-full text-sm font-medium animate-in slide-in-from-bottom-4 pointer-events-none z-50 flex gap-4 items-center">
      <span>{activeJaw === 'source' ? 'Drag jaw to output port...' : 'Drag other jaw to input port...'}</span>

      {previewTargetId && (
        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Snap to {previewTargetId}
        </span>
      )}
    </div>
  );
}
