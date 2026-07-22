import type { Badge } from '../types';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export function BadgeItem({ badge }: { badge: Badge, hookId: string, slotNumber: number | null }) {
    const attendees = useStore(state => state.attendees);
    const selection = useStore(state => state.selection);
    const setSelection = useStore(state => state.setSelection);

    const attendee = attendees.find(a => a.badgeId === badge.id);
    if (!attendee) return null;

    const isSelected = selection.ids.includes(badge.id);
    const isMero = badge.id === 'BADGE-27';

    return (
        <motion.div
            layoutId={badge.id}
            tabIndex={0}
            onClick={() => setSelection({ kind: 'badge', ids: [badge.id], primaryId: badge.id })}
            onKeyDown={(e) => {
               if (e.key === 'Enter') {
                   setSelection({ kind: 'badge', ids: [badge.id], primaryId: badge.id });
               }
            }}
            className={`
                relative h-9 w-[176px] rounded flex items-center px-2 cursor-pointer
                border shadow-sm bg-background transition-colors
                ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/30'}
                ${isMero && badge.status === 'seeded-overflow' ? 'text-destructive' : ''}
            `}
        >
            <div className="flex-1 truncate">
                <span className="font-semibold text-sm mr-2">{attendee.familyNameKey}</span>
                <span className="text-xs text-muted-foreground truncate">{attendee.displayName}</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground opacity-50 ml-1 shrink-0">
                {badge.backMark}
            </div>
        </motion.div>
    );
}
