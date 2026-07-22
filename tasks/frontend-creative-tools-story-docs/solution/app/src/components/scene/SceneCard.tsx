import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { clsx } from 'clsx';
import { deleteScene, type Scene, type ViewMode } from '@/store';
import { editingSceneIdStore, versionHistorySceneIdStore, showToast } from '@/store/ui';
import { checklistStats } from '@/lib/markdown';
import { prefersReducedMotion } from '@/lib/motion';
import { SceneDescription } from './SceneDescription';
import { KebabMenu } from '../common/KebabMenu';
import { Ri } from '../common/Ri';

/** Stagger window: cards mounted during the first paint stagger/reveal; later mounts are session creates. */
let initialMountDeadline = 0;

const STATUS_STYLES: Record<Scene['status'], string> = {
  draft: 'bg-gray-100 text-gray-600 ring-gray-200',
  review: 'bg-amber-50 text-amber-700 ring-amber-200',
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export function SceneCard({
  scene,
  index,
  layout,
  isDragging = false,
}: {
  scene: Scene;
  index: number;
  layout: ViewMode;
  isDragging?: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || prefersReducedMotion()) return;
    if (initialMountDeadline === 0) initialMountDeadline = Date.now() + 900;

    if (layout === 'slide') {
      // Active slide enters with a short slide/fade on every advance.
      gsap.fromTo(
        el,
        { opacity: 0, x: 28 },
        { opacity: 1, x: 0, duration: 0.32, ease: 'power2.out', clearProps: 'transform', overwrite: true }
      );
      return;
    }

    const inFirstPaint = Date.now() < initialMountDeadline;
    const belowFold = el.getBoundingClientRect().top > window.innerHeight - 40;

    const enter = () =>
      gsap.fromTo(
        el,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
          delay: inFirstPaint ? Math.min(index * 0.06, 0.5) : 0,
          clearProps: 'transform',
          overwrite: true,
        }
      );

    if (inFirstPaint && belowFold) {
      // Below-the-fold cards reveal as real scrolling brings them into view.
      gsap.set(el, { opacity: 0, y: 24 });
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            enter();
          }
        },
        { threshold: 0.08 }
      );
      io.observe(el);
      return () => io.disconnect();
    }

    const tween = enter();
    return () => {
      tween.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = () => {
    if (isLeaving) return;
    const finish = () => {
      deleteScene(scene.id);
      showToast('Scene Deleted');
    };
    if (prefersReducedMotion() || !cardRef.current) {
      finish();
      return;
    }
    setIsLeaving(true);
    gsap.to(cardRef.current, {
      opacity: 0,
      scale: 0.94,
      y: -8,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: finish,
    });
  };

  const checklist = checklistStats(scene.body);
  const isSlide = layout === 'slide';
  const isCanvas = layout === 'canvas';
  const isList = layout === 'list';

  return (
    <article
      ref={cardRef}
      data-flip-id={scene.id}
      data-uuid={scene.id}
      aria-label={`Scene ${scene.order}: ${scene.title}`}
      className={clsx(
        'scene-item group relative flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
        'transition-[transform,box-shadow,border-color,opacity] duration-300 ease-out',
        isList ? 'flex-row' : 'flex-col',
        !isCanvas && !isSlide && 'hover:-translate-y-1 hover:border-yellow-300/70 hover:shadow-xl hover:shadow-yellow-900/5',
        isSlide && 'mx-auto w-full max-w-3xl shadow-lg',
        isCanvas &&
          clsx(
            'w-60 select-none shadow-md transition-shadow duration-200',
            isDragging ? 'cursor-grabbing shadow-2xl ring-2 ring-yellow-400' : 'cursor-grab hover:shadow-xl'
          ),
        isLeaving && 'pointer-events-none'
      )}
    >
      {/* Image region holds its space while loading */}
      <div
        className={clsx(
          'relative shrink-0 overflow-hidden bg-gray-100',
          isList ? 'min-h-36 w-2/5 self-stretch sm:w-1/3' : isSlide ? 'aspect-[21/9]' : 'aspect-video'
        )}
      >
        <img
          src={`/scenes/scene-0${scene.image}.webp`}
          alt={`Illustration for scene ${scene.order}, ${scene.title}`}
          loading={index < 4 ? 'eager' : 'lazy'}
          draggable={false}
          className="h-full w-full object-cover transition-[filter,transform] duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
        />
        <span
          className="scene-position absolute left-2.5 top-2.5 rounded-lg bg-gray-900/75 px-2 py-0.5 text-xs font-bold tabular-nums text-white backdrop-blur-sm"
          aria-hidden="true"
        >
          {scene.order}
        </span>
        <span
          className={clsx(
            'absolute bottom-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset',
            STATUS_STYLES[scene.status]
          )}
        >
          {scene.status}
        </span>

        {/* Per-scene actions fade in on hover but stay keyboard reachable */}
        <div
          className={clsx(
            'absolute right-1.5 top-1.5 z-20 transition-opacity duration-200',
            isSlide ? 'opacity-100' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'
          )}
        >
          <KebabMenu
            label={`Scene ${scene.order} options`}
            buttonClassName="bg-white/95 shadow-sm backdrop-blur"
            items={[
              {
                label: 'Edit Scene',
                icon: 'pencil-line',
                onActivate: () => editingSceneIdStore.set(scene.id),
              },
              {
                label: 'Version History',
                icon: 'history-line',
                onActivate: () => versionHistorySceneIdStore.set(scene.id),
              },
              {
                label: 'Delete Scene',
                icon: 'delete-bin-line',
                destructive: true,
                onActivate: handleDelete,
              },
            ]}
          />
        </div>
      </div>

      <div className={clsx('flex min-w-0 flex-1 flex-col', isSlide ? 'p-5 sm:p-6' : 'p-3.5')}>
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h2
            className={clsx(
              'min-w-0 flex-1 truncate font-bold tracking-tight text-gray-900',
              isSlide ? 'text-xl' : 'text-[15px]'
            )}
          >
            {scene.title}
          </h2>
          {checklist.total > 0 && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-bold tabular-nums text-yellow-800 ring-1 ring-inset ring-yellow-200/80"
              aria-label={`Checklist progress: ${checklist.checked} of ${checklist.total}`}
              title="Checklist progress"
            >
              <Ri name="checkbox-circle-line" size={12} className="text-yellow-600" />
              {checklist.checked}/{checklist.total}
            </span>
          )}
        </div>

        {scene.cameraNote && (
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-sky-700">
            <Ri name="camera-line" size={13} className="shrink-0" />
            <span className="truncate">{scene.cameraNote}</span>
          </p>
        )}

        <SceneDescription sceneId={scene.id} body={scene.body} />
      </div>
    </article>
  );
}
