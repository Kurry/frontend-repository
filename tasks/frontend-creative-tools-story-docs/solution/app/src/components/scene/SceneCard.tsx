import React, { useRef, useEffect, useState } from 'react';
import { type Scene, deleteScene } from '@/store';
import { SceneDescription } from './SceneDescription';
import { VersionHistoryPanel } from '../features/VersionHistoryPanel';
import gsap from 'gsap';
import { clsx } from 'clsx';
import { showToast } from '@/store/ui';

interface SceneCardProps {
  scene: Scene;
  index: number;
  layout: 'tile' | 'list' | 'slide' | 'canvas';
  isActiveSlide?: boolean;
}

export function SceneCard({ scene, index, layout, isActiveSlide }: SceneCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isEntering = useRef(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isEntering.current && cardRef.current) {
        if (!prefersReducedMotion) {
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: index * 0.05 }
            );
        }
        isEntering.current = false;
    }
  }, [index]);

  const handleDelete = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (cardRef.current && !prefersReducedMotion) {
        gsap.to(cardRef.current, {
            opacity: 0,
            scale: 0.9,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => deleteScene(scene.id)
        });
    } else {
        deleteScene(scene.id);
    }
  };

  const getChecklistProgress = () => {
    const checkboxes = scene.body.match(/- \[[ xX]\]/g);
    if (!checkboxes) return null;
    const checked = scene.body.match(/- \[[xX]\]/g)?.length || 0;
    return `${checked}/${checkboxes.length}`;
  };

  const progress = getChecklistProgress();

  return (
    <>
    <div
        ref={cardRef}
        className={clsx(
            "scene-item scene-column group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
            layout === 'list' && "flex flex-row items-stretch",
            layout === 'slide' && (!isActiveSlide ? "hidden" : "w-full max-w-4xl mx-auto is-slide-active"),
            layout === 'canvas' && "absolute w-72 shadow-md cursor-grab active:cursor-grabbing"
        )}
        style={layout === 'canvas' ? { left: scene.canvasX || (index % 4) * 300, top: scene.canvasY || Math.floor(index / 4) * 350 } : undefined}
        data-uuid={scene.id}
        role="group"
        aria-label={`Scene ${scene.order}: ${scene.title}`}
    >
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-1">
            {progress && (
                <div className="bg-white/90 backdrop-blur text-xs px-2 py-1 rounded-md shadow-sm text-gray-600 font-medium border border-gray-200/50" aria-label={`Checklist progress: ${progress}`}>
                    {progress}
                </div>
            )}
            <div className="dropdown dropdown-end">
                <button
                    tabIndex={0}
                    className="btn btn-sm btn-circle btn-ghost bg-white/90 backdrop-blur shadow-sm hover:bg-white focus:ring-2 focus:ring-yellow-400"
                    aria-label="Scene options"
                    aria-haspopup="true"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48 mt-1 border border-gray-100" role="menu">
                    <li role="menuitem"><button onClick={() => showToast('Edit — use inline editing')}>Edit</button></li>
                    <li role="menuitem"><button onClick={() => setShowHistory(true)}>Version history</button></li>
                    <li role="menuitem" className="text-error"><button onClick={handleDelete} aria-label="Delete scene">Delete</button></li>
                </ul>
            </div>
        </div>

        <div className={clsx("relative bg-gray-100", layout === 'list' ? "w-1/3 min-w-[200px]" : "w-full aspect-video")}>
            <img
                src={`/scenes/scene-${String(((scene.order - 1) % 8) + 1).padStart(2, '0')}.webp`}
                alt={scene.title}
                className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                loading="lazy"
            />
            <div className="scene-position absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-xs font-semibold px-2 py-1 rounded-md">
                {scene.order}
            </div>
            {scene.status !== 'draft' && (
                <div className={clsx(
                    "absolute bottom-2 right-2 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded",
                    scene.status === 'review' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                )} aria-label={`Status: ${scene.status}`}>
                    {scene.status}
                </div>
            )}
        </div>

        <div className={clsx("p-4 flex flex-col", layout === 'list' ? "w-2/3" : "w-full")}>
            {scene.cameraNote && (
                <div className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1" aria-label="Camera Note">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    {scene.cameraNote}
                </div>
            )}
            <h3 className="font-semibold text-gray-900 mb-2">{scene.title}</h3>
            <SceneDescription sceneId={scene.id} body={scene.body} />
        </div>
    </div>
    {showHistory && <VersionHistoryPanel scene={scene} onClose={() => setShowHistory(false)} />}
    </>
  );
}
