import type { Badge } from '../types';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export function DraggableBadgeItem({ badge }: { badge: Badge, hookId: string, slotNumber: number | null }) {
    const attendees = useStore(state => state.attendees);
    const selection = useStore(state => state.selection);
    const setSelection = useStore(state => state.setSelection);
    const moveBadge = useStore(state => state.moveBadge);

    const attendee = attendees.find(a => a.badgeId === badge.id);
    if (!attendee) return null;

    const isSelected = selection.ids.includes(badge.id);
    const isMero = badge.id === 'BADGE-27';

    return (
        <motion.div
            layoutId={badge.id}
            drag
            dragSnapToOrigin
            onDragEnd={(_, info) => {
                // simple simulated drop logic: if dropped far to the right, snap it to M-R slot 7
                if (isMero && info.offset.x > 150) {
                    moveBadge(badge.id, 'HOOK-MR', 7);
                }
            }}
            tabIndex={0}
            onClick={() => setSelection({ kind: 'badge', ids: [badge.id], primaryId: badge.id })}
            onKeyDown={(e) => {
               if (e.key === 'Enter') {
                   setSelection({ kind: 'badge', ids: [badge.id], primaryId: badge.id });
                   // Keyboard placing M-R 7 explicitly logic here normally
                   if (isMero) moveBadge(badge.id, 'HOOK-MR', 7);
               }
            }}
            className={`
                relative h-9 w-[176px] rounded flex items-center px-2 cursor-grab active:cursor-grabbing z-10
                border shadow-sm bg-background transition-colors
                ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/30'}
                ${isMero && badge.status === 'seeded-overflow' ? 'text-destructive border-destructive/50' : ''}
            `}
        >
            <div className="flex-1 truncate pointer-events-none">
                <span className="font-semibold text-sm mr-2">{attendee.familyNameKey}</span>
                <span className="text-xs text-muted-foreground truncate">{attendee.displayName}</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground opacity-50 ml-1 shrink-0 pointer-events-none">
                {badge.backMark}
            </div>
        </motion.div>
    );
}
