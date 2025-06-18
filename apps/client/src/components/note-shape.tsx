"use client";

import { Group, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

// We move the helper function here as it's only used for the note
const getContrastingTextColor = (hexColor: string) => {
    if (!hexColor) return '#111827';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#FFFFFF';
};

// Define the shape type again for props
type Shape = {
  id: string;
  x?: number; y?: number;
  width?: number; height?: number;
  fill?: string;
  text?: string;
};

// Define the props for our new component
interface NoteShapeProps {
    shape: Shape;
    isSelected: boolean;
    onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
    onDblClick: (e: KonvaEventObject<MouseEvent>) => void;
}

export const NoteShape = ({ shape, isSelected, onDragEnd, onDblClick }: NoteShapeProps) => {
    return (
        <Group
            key={shape.id}
            id={shape.id}
            x={shape.x}
            y={shape.y}
            draggable={isSelected}
            onDragEnd={onDragEnd}
            onDblClick={onDblClick}
        >
            <Rect
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                cornerRadius={5}
            />
            <Text
                text={shape.text || ''}
                width={shape.width}
                padding={12}
                fontSize={16}
                listening={false} // The text itself should not be interactive
                fill={getContrastingTextColor(shape.fill || '#ffef96')}
            />
        </Group>
    );
};