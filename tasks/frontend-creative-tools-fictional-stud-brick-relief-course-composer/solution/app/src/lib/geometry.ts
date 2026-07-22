import { BrickRecord, PartDefinitionRecord } from '../types';

export function getBrickFootprint(brick: BrickRecord, part: PartDefinitionRecord) {
  const w = brick.rotationQuarterTurns % 2 === 1 ? part.depthStuds : part.widthStuds;
  const h = brick.rotationQuarterTurns % 2 === 1 ? part.widthStuds : part.depthStuds;
  return {
    x: brick.x,
    y: brick.y,
    w,
    h,
    maxX: brick.x + w,
    maxY: brick.y + h
  };
}

export function rectIntersect(r1: ReturnType<typeof getBrickFootprint>, r2: ReturnType<typeof getBrickFootprint>) {
  const left = Math.max(r1.x, r2.x);
  const right = Math.min(r1.maxX, r2.maxX);
  const top = Math.max(r1.y, r2.y);
  const bottom = Math.min(r1.maxY, r2.maxY);

  if (left < right && top < bottom) {
    return { x: left, y: top, w: right - left, h: bottom - top };
  }
  return null;
}

export function rectArea(r: { w: number, h: number }) {
  return r.w * r.h;
}
