import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { scenesStore, viewModeStore, activeSlideStore, reorderScenes, filterStatusStore, searchQueryStore } from '../store';
import { SceneCard } from './SceneCard';
import { SceneForm } from './SceneForm';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { CanvasBoard } from './CanvasBoard';

export function Board() {
  const allScenes = useStore(scenesStore);
  const viewMode = useStore(viewModeStore);
  const activeSlide = useStore(activeSlideStore);
  const filterStatus = useStore(filterStatusStore);
  const searchQuery = useStore(searchQueryStore);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [versionHistoryId, setVersionHistoryId] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const scenes = useMemo(() => {
    return allScenes.filter(scene => {
      if (filterStatus !== 'all' && scene.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return scene.title.toLowerCase().includes(query) || scene.body.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allScenes, filterStatus, searchQuery]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // DND currently only supported reliably without active filters in this simplified version
    if (filterStatus === 'all' && !searchQuery) {
      reorderScenes(result.source.index, result.destination.index);
    }
  };

  if (!isMounted) return null;

  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200 mt-8 mx-6">
        <h2 className="text-xl font-bold mb-2">
          {allScenes.length === 0 ? 'No scenes found' : 'No scenes match filters'}
        </h2>
        <p className="text-gray-500 mb-6">
          {allScenes.length === 0
            ? 'Your storyboard is empty. Create a scene to get started.'
            : 'Try changing your search or status filter.'}
        </p>
        <div className="flex gap-4">
          <button
            className="btn btn-primary"
            onClick={() => setEditingId('new')}
          >
            Add Scene
          </button>
          {allScenes.length > 0 && (
            <button
              className="btn btn-outline"
              onClick={() => { filterStatusStore.set('all'); searchQueryStore.set(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6" role="region" aria-label="Scene Collection">
      {viewMode === 'tile' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" isDropDisabled={filterStatus !== 'all' || !!searchQuery}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 scenes-grid is-tile"
              >
                {scenes.map((scene, index) => (
                  <Draggable key={scene.id} draggableId={scene.id} index={index} isDragDisabled={filterStatus !== 'all' || !!searchQuery}>
                    {(provided, snapshot) => (
                      <div className="scene-column h-full">
                        <SceneCard
                          scene={scene}
                          viewMode="tile"
                          onEdit={setEditingId}
                          onVersionHistory={setVersionHistoryId}
                          innerRef={provided.innerRef}
                          draggableProps={provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {viewMode === 'list' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="vertical" isDropDisabled={filterStatus !== 'all' || !!searchQuery}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col gap-4 max-w-4xl mx-auto scenes-grid is-list"
              >
                {scenes.map((scene, index) => (
                  <Draggable key={scene.id} draggableId={scene.id} index={index} isDragDisabled={filterStatus !== 'all' || !!searchQuery}>
                    {(provided, snapshot) => (
                      <div className="scene-column">
                        <SceneCard
                          scene={scene}
                          viewMode="list"
                          onEdit={setEditingId}
                          onVersionHistory={setVersionHistoryId}
                          innerRef={provided.innerRef}
                          draggableProps={provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {viewMode === 'slide' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-5xl mx-auto scenes-grid is-slide relative">
          <div className="w-full flex justify-between items-center px-12 absolute top-1/2 -translate-y-1/2 z-10">
            <button
              className="btn btn-circle bg-white shadow-md border-gray-200 -ml-16"
              onClick={() => activeSlideStore.set(Math.max(0, activeSlide - 1))}
              disabled={activeSlide === 0}
              aria-label="Previous slide"
            >
              ❮
            </button>
            <button
              className="btn btn-circle bg-white shadow-md border-gray-200 -mr-16"
              onClick={() => activeSlideStore.set(Math.min(scenes.length - 1, activeSlide + 1))}
              disabled={activeSlide === scenes.length - 1}
              aria-label="Next slide"
            >
              ❯
            </button>
          </div>

          <div className="w-full max-w-4xl mx-auto scene-column is-slide-active z-0">
            {scenes[activeSlide] ? (
              <SceneCard
                scene={scenes[activeSlide]}
                viewMode="slide"
                onEdit={setEditingId}
                onVersionHistory={setVersionHistoryId}
              />
            ) : (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
                Slide out of bounds
              </div>
            )}
          </div>

          <div className="mt-8 text-gray-500 font-medium">
            Slide {Math.min(activeSlide + 1, scenes.length)} of {scenes.length}
          </div>
        </div>
      )}

      {viewMode === 'canvas' && (
        <CanvasBoard onEdit={setEditingId} onVersionHistory={setVersionHistoryId} scenes={scenes} />
      )}

      {editingId && (
        <SceneForm
          sceneId={editingId === 'new' ? undefined : editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      {versionHistoryId && (
        <VersionHistoryPanel
          sceneId={versionHistoryId}
          onClose={() => setVersionHistoryId(null)}
        />
      )}
    </div>
  );
}
