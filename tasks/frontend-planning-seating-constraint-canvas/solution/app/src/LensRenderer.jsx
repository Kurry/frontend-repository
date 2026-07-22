import React from 'react';
import { getTableSeats, OBSTACLES, ROOM_WIDTH, ROOM_HEIGHT } from './store/store';

// Helper to determine if a line segment intersects an AABB rect
const lineIntersectsRect = (x1, y1, x2, y2, rx, ry, rw, rh) => {
    // Basic bounding box check first
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) return false;

    // Check if either point is inside the rect
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
    if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

    // We can do proper line intersection, but for our simple raycast bounds check is often close enough
    // or we check intersection with the 4 line segments of the rect.
    const segments = [
        [rx, ry, rx + rw, ry],
        [rx + rw, ry, rx + rw, ry + rh],
        [rx + rw, ry + rh, rx, ry + rh],
        [rx, ry + rh, rx, ry]
    ];

    const intersects = (a, b, c, d, p, q, r, s) => {
        let det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) return false;
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    };

    return segments.some(seg => intersects(x1, y1, x2, y2, seg[0], seg[1], seg[2], seg[3]));
};

export function LensRenderer({ state, stageCenterX = 12, stageCenterY = 1.5 }) {
    if (!state.lenses.accessibility && !state.lenses.sightline) return null;

    const rays = [];
    const blockages = [];

    if (state.lenses.sightline) {
        state.tables.forEach(table => {
            const seats = getTableSeats(table);
            seats.forEach(seat => {
                const assignment = state.assignments.find(a => a.seatId === seat.id);
                if (assignment) {
                    const sx = seat.x;
                    const sy = seat.y;
                    let blocked = false;

                    // Check obstacle intersection
                    for (const obs of OBSTACLES) {
                        if (obs.type !== 'stage' && lineIntersectsRect(sx, sy, stageCenterX, stageCenterY, obs.x, obs.y, obs.width, obs.height)) {
                            blocked = true;
                            blockages.push({ id: `block-obs-${obs.id}-${seat.id}`, rx: obs.x, ry: obs.y, rw: obs.width, rh: obs.height });
                        }
                    }

                    // Check table intersection
                    for (const otherTable of state.tables) {
                        if (otherTable.id !== table.id) {
                            if (lineIntersectsRect(sx, sy, stageCenterX, stageCenterY, otherTable.x, otherTable.y, otherTable.width, otherTable.height)) {
                                blocked = true;
                                blockages.push({ id: `block-tab-${otherTable.id}-${seat.id}`, rx: otherTable.x, ry: otherTable.y, rw: otherTable.width, rh: otherTable.height });
                            }
                        }
                    }

                    rays.push({ id: `ray-${seat.id}`, x1: sx, y1: sy, x2: stageCenterX, y2: stageCenterY, blocked });
                }
            });
        });
    }

    return (
        <svg className="absolute inset-0 pointer-events-none z-40" width="100%" height="100%">
            {rays.map(ray => (
                <line
                    key={ray.id}
                    x1={ray.x1 * 32} y1={ray.y1 * 32}
                    x2={ray.x2 * 32} y2={ray.y2 * 32}
                    stroke={ray.blocked ? "rgba(239, 68, 68, 0.6)" : "rgba(34, 197, 94, 0.3)"}
                    strokeWidth="2"
                    strokeDasharray={ray.blocked ? "4" : "none"}
                />
            ))}
            {blockages.map(b => (
                <rect
                    key={b.id}
                    x={b.rx * 32} y={b.ry * 32}
                    width={b.rw * 32} height={b.rh * 32}
                    fill="none"
                    stroke="red"
                    strokeWidth="3"
                />
            ))}
        </svg>
    );
}
