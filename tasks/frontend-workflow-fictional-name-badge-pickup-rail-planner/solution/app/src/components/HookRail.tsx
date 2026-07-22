import { useStore } from '../store';
import { DraggableBadgeItem } from './DraggableBadgeItem';

export function HookRail() {
    const hooks = useStore(state => state.hooks);
    const badges = useStore(state => state.badges);

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {hooks.map(hook => {
                const hookBadges = badges.filter(b => b.hookId === hook.id);
                // slots 1..12
                const slots = Array.from({ length: hook.capacity }, (_, i) => i + 1);

                // overflow badges for this hook
                const overflowBadges = hookBadges.filter(b => b.slotNumber === null).sort((a, b) => (a.overflowOrdinal || 0) - (b.overflowOrdinal || 0));

                return (
                    <div key={hook.id} className="w-64 shrink-0 rounded-lg border border-border bg-background p-4 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                            <h3 className="font-bold">{hook.name}</h3>
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                {hookBadges.length}/{hook.capacity}
                            </span>
                        </div>

                        <div className="flex-1 space-y-[8px] relative">
                            {slots.map(slotNumber => {
                                const b = hookBadges.find(b => b.slotNumber === slotNumber);
                                return (
                                    <div key={slotNumber} className="relative flex items-center h-9">
                                        <div className="w-6 text-xs text-muted-foreground/50 font-mono text-right pr-2">
                                            {String(slotNumber).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 relative">
                                            <div className="absolute inset-0 rounded border border-dashed border-border/60 bg-muted/20" />
                                            {b && <DraggableBadgeItem badge={b} hookId={hook.id} slotNumber={slotNumber} />}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Overflow lip */}
                            <div className="mt-4 pt-4 border-t border-dashed border-destructive/30">
                                <div className="text-xs font-semibold text-destructive/70 mb-2">Overflow</div>
                                {overflowBadges.map((b) => (
                                    <div key={b.id} className="ml-6 h-9">
                                        <DraggableBadgeItem badge={b} hookId={hook.id} slotNumber={null} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
