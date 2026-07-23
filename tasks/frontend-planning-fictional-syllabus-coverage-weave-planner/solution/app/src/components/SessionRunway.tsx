import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store';
import Knots from './Knots';

const SessionSlot = ({ session }: { session: any }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: session.id,
  });

  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-48 border-r border-slate-200 p-4 ${isOver ? 'bg-blue-50' : 'bg-white'}`}>
      <div className="font-semibold text-sm mb-1">{session.id}</div>
      <div className="text-xs text-slate-500 mb-4">{new Date(session.startIso).toLocaleDateString()}</div>
      <div className="text-xs font-mono text-slate-400 mb-2">Capacity: {session.durationMinutes}m</div>

      <div className="relative min-h-[200px] border border-dashed border-slate-200 rounded p-2">
        <Knots sessionId={session.id} />
      </div>
    </div>
  );
};

const SessionRunway = () => {
  const { sessions } = useStore();

  return (
    <div className="flex-1 flex overflow-x-auto bg-slate-100">
      {sessions.map(session => (
        <SessionSlot key={session.id} session={session} />
      ))}
    </div>
  );
};

export default SessionRunway;
