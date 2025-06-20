import type { Shape } from '@/types/board.d';

type Point = { x: number; y: number; };

function getShapeAnchors(shape: Shape): Point[] {
    switch (shape.type) {
        case 'rect':
        case 'note':
        case 'diamond':
            return [
                { x: shape.x + shape.width / 2, y: shape.y },
                { x: shape.x + shape.width, y: shape.y + shape.height / 2 },
                { x: shape.x + shape.width / 2, y: shape.y + shape.height },
                { x: shape.x, y: shape.y + shape.height / 2 },
            ];
        case 'circle':
            return [
                { x: shape.x, y: shape.y - shape.radius },
                { x: shape.x + shape.radius, y: shape.y },
                { x: shape.x, y: shape.y + shape.radius },
                { x: shape.x - shape.radius, y: shape.y },
            ];
        default:
            return [];
    }
}

export function findBestConnectionPoints(fromShape: Shape, toShape: Shape) {
    const fromAnchors = getShapeAnchors(fromShape);
    const toAnchors = getShapeAnchors(toShape);

    if (fromAnchors.length === 0 || toAnchors.length === 0) {
        return null;
    }

    let bestConnection = { from: fromAnchors[0], to: toAnchors[0], distance: Infinity };

    for (const fromPoint of fromAnchors) {
        for (const toPoint of toAnchors) {
            const distance = Math.sqrt(
                Math.pow(toPoint.x - fromPoint.x, 2) + Math.pow(toPoint.y - fromPoint.y, 2)
            );
            if (distance < bestConnection.distance) {
                bestConnection = { from: fromPoint, to: toPoint, distance };
            }
        }
    }

    return { start: bestConnection.from, end: bestConnection.to };
}