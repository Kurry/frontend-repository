import { useDroppable } from '@dnd-kit/core';

interface DroppableLaneProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function DroppableLane({ id, title, children }: DroppableLaneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const style = {
    backgroundColor: isOver ? '#e2e8f0' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col bg-gray-50 rounded-lg p-4 min-h-[500px] transition-colors">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">{title}</h2>
      <div className="flex-1 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
