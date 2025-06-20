"use client";

import { Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { DiamondShape as DiamondShapeType } from '@/types/board.d';

interface DiamondShapeProps {
    shape: DiamondShapeType;
    isSelected: boolean;
    onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}

export const DiamondShape = ({ shape, isSelected, onDragEnd }: DiamondShapeProps) => {
    const { x, y, width, height, fill, id } = shape;
    const points = [ width / 2, 0, width, height / 2, width / 2, height, 0, height / 2 ];

    return (
        <Line
            key={id} id={id} x={x} y={y}
            points={points} fill={fill} closed={true}
            draggable={isSelected} onDragEnd={onDragEnd}
            stroke="black" strokeWidth={1}
        />
    );
};