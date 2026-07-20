import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { Scene } from '../store';
import { MarkdownRenderer, getChecklistStats } from './MarkdownRenderer';
import { deleteScene } from '../store';

interface Props {
  scene: Scene;
  viewMode: 'tile' | 'list' | 'slide' | 'canvas';
  onEdit: (sceneId: string) => void;
  onVersionHistory: (sceneId: string) => void;
  innerRef?: React.Ref<HTMLDivElement>;
  draggableProps?: any;
  dragHandleProps?: any;
  isDragging?: boolean;
}

export function SceneCard({ scene, viewMode, onEdit, onVersionHistory, innerRef, draggableProps, dragHandleProps, isDragging }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const stats = getChecklistStats(scene.body);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isList = viewMode === 'list';
  const isSlide = viewMode === 'slide';

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={`scene-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible transition-shadow ${isDragging ? 'dragging shadow-lg z-50' : 'hover:shadow-md'} ${isList ? 'flex flex-row' : 'flex flex-col'}`}
      style={draggableProps?.style}
    >
      {/* Header section / Image */}
      <div className={`relative ${isList ? 'w-48 flex-shrink-0' : 'w-full'} group`} {...dragHandleProps}>
        <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
          {scene.order}
        </div>

        {stats && (
          <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
            {stats.completed}/{stats.total}
          </div>
        )}

        <div className={`bg-gray-200 ${isList ? 'h-full min-h-[120px]' : 'aspect-video'}`}>
          {scene.image ? (
            <img src={scene.image} alt={scene.title} className="w-full h-full object-cover rounded-t-lg" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="flex-1 p-4 relative flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-semibold text-lg line-clamp-1 flex-1">{scene.title}</h3>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(scene.status)}`}>
              {scene.status}
            </span>

            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle" aria-label="Scene options">
                <MoreVertical className="w-4 h-4" />
              </button>
              <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-40">
                <li><button onClick={() => onEdit(scene.id)}>Edit</button></li>
                <li><button onClick={() => onVersionHistory(scene.id)}>Version History</button></li>
                <li><button className="text-red-600 hover:text-red-700" onClick={() => {
                  if (window.confirm("Are you sure you want to delete this scene?")) {
                    deleteScene(scene.id);
                  }
                }}>Delete</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className={`scene-description thin-scrollbar flex-1 overflow-y-auto ${isEditing ? 'is-editing p-2 rounded' : ''}`}
          tabIndex={0}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onClick={(e) => {
            // Only trigger edit mode if they didn't click a checkbox
            const target = e.target as HTMLElement;
            if (target.tagName.toLowerCase() !== 'input') {
              setIsEditing(true);
            }
          }}
        >
          <MarkdownRenderer content={scene.body} sceneId={scene.id} />
        </div>

        {scene.cameraNote && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 italic">
            🎥 {scene.cameraNote}
          </div>
        )}
      </div>
    </div>
  );
}
