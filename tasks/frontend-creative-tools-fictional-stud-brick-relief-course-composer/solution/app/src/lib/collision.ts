import { BrickRecord, PartDefinitionRecord } from '../types';
import { getBrickFootprint, rectIntersect } from './geometry';

export function checkCollision(
  virtualBricks: Record<string, BrickRecord>,
  parts: Record<string, PartDefinitionRecord>,
  movingBrickId: string
): boolean {
  const movingBrick = virtualBricks[movingBrickId];
  if (!movingBrick) return false;

  const movingFootprint = getBrickFootprint(movingBrick, parts[movingBrick.partDefinitionId]);

  // Check bounds
  if (movingFootprint.x < 0 || movingFootprint.y < 0) return true;
  // Note: model width/depth limit check should ideally happen here, assuming 12x8 for our demo model
  if (movingFootprint.maxX > 12 || movingFootprint.maxY > 8) return true;

  for (const otherBrick of Object.values(virtualBricks)) {
    if (otherBrick.id === movingBrickId || otherBrick.status !== 'active') continue;
    if (otherBrick.course === movingBrick.course) {
      const otherFootprint = getBrickFootprint(otherBrick, parts[otherBrick.partDefinitionId]);
      const intersection = rectIntersect(movingFootprint, otherFootprint);
      if (intersection) {
        return true; // Collision detected
      }
    }
  }
  return false;
}
