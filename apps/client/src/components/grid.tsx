"use client";

import { useMemo } from 'react';
import { Rect } from 'react-konva';

const GRID_SIZE = 30;
const DOT_RADIUS = 1;
const BG_COLOR = '#f7f7f7';
const DOT_COLOR = '#d1d1d1';

export const Grid = ({ width, height }: { width: number; height: number; }) => {
  const patternCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const context = canvas.getContext('2d');

    if (context) {
      context.fillStyle = BG_COLOR;
      context.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
      
      context.beginPath();
      context.arc(GRID_SIZE / 2, GRID_SIZE / 2, DOT_RADIUS, 0, 2 * Math.PI, false);
      context.fillStyle = DOT_COLOR;
      context.fill();
    }
    return canvas;
  }, []);

  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      // This is the corrected line
      fillPatternImage={patternCanvas as unknown as HTMLImageElement}
      fillPatternRepeat="repeat"
      listening={false}
    />
  );
};