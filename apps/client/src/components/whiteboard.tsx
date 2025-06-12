"use client";

import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { useWhiteboard } from '@/hooks/use-whiteboard';
import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from './toolbar';
import { useAppStore } from '@/lib/store';
import { Grid } from './grid';

// --- NEW: Text editing state ---
type TextEditState = {
  id: string;
  isEditing: boolean;
  text: string;
  x: number;
  y: number;
};

// --- UPDATED: Shape type now includes 'pen' and 'points' ---
// --- UPDATED: Shape type now includes 'pen' and properties for it ---
type Shape = {
    id: string;
    type: 'rect' | 'circle' | 'note' | 'pen';
    x?: number; y?: number;
    width?: number; height?: number;
    radius?: number; fill?: string;
    text?: string;
    points?: number[];
    stroke?: string;
  };

const LiveCursor = ({ x, y, name }: { x: number; y: number; name: string }) => {
    return <Text text={`\uD83D\uDC49 ${name}`} x={x+10} y={y+10} fill="blue" fontSize={16}/>;
};

export default function Whiteboard({ boardId }: { boardId: string }) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const { activeTool, fillColor } = useAppStore();
  
  // --- NEW: State for managing text editing ---
  const [textEdit, setTextEdit] = useState<TextEditState>({ isEditing: false, id: '', text: '', x: 0, y: 0 });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- NEW: Refs for freehand drawing ---
  const isDrawing = useRef(false);
  const currentLineId = useRef<string | null>(null);

  const { cursors, sendCursorPosition, sendObject, presence } = useWhiteboard(boardId, (newShapes) => {
    setShapes(prev => [...prev, ...newShapes]);
  }, (updatedShape) => {
    setShapes(prev => prev.map(s => s.id === updatedShape.id ? { ...s, ...updatedShape } : s));
  });

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setStageSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // --- NEW: Focus the textarea when editing starts ---
  useEffect(() => {
    if (textEdit.isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [textEdit.isEditing]);

  const handleStageMouseDown = (e: any) => {
    if (textEdit.isEditing || activeTool === 'select' || e.target !== e.target.getStage()) {
      return;
    }

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

     // --- NEW: Pen tool logic ---
     if (activeTool === 'pen') {
        isDrawing.current = true;
        const id = uuidv4();
        currentLineId.current = id;
        const newLine: Shape = { id, type: 'pen', points: [pos.x, pos.y], stroke: fillColor };
        setShapes(prev => [...prev, newLine]);
        return;
      }

    let newShape: Shape;

    if (activeTool === 'note') {
      newShape = { id: uuidv4(), type: 'note', x: pos.x, y: pos.y, width: 150, height: 150, fill: '#ffef96', text: 'New Note' };
    } else {
      newShape = { id: uuidv4(), type: activeTool === 'rectangle' ? 'rect' : 'circle', x: pos.x, y: pos.y, fill: '#333', ...(activeTool === 'rectangle' ? { width: 100, height: 100 } : { radius: 50 })};
    }
    
    setShapes(prev => [...prev, newShape]);
    sendObject({ type: 'OBJECT_ADD', payload: [newShape] }); // Send as an array
  };

  // --- NEW: Mouse Move handler for drawing ---
  const handleStageMouseMove = (e: any) => {
    sendCursorPosition(e.target.getStage()!.getPointerPosition()!);
    if (activeTool !== 'pen' || !isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setShapes(prev => prev.map(shape => {
      if (shape.id === currentLineId.current) {
        return { ...shape, points: [...shape.points!, point.x, point.y] };
      }
      return shape;
    }));
  };

  // --- NEW: Mouse Up handler to finish drawing ---
  const handleStageMouseUp = () => {
    if (activeTool === 'pen' && isDrawing.current) {
      isDrawing.current = false;
      const finalLine = shapes.find(s => s.id === currentLineId.current);
      if (finalLine) {
        sendObject({ type: 'OBJECT_ADD', payload: [finalLine] });
      }
      currentLineId.current = null;
    }
  };

  // --- NEW: Handler for when text editing finishes ---
  const handleTextEditEnd = () => {
    if (textAreaRef.current) {
        sendObject({ type: 'OBJECT_UPDATE', payload: { id: textEdit.id, text: textAreaRef.current.value } });
        setShapes(prev => prev.map(s => s.id === textEdit.id ? { ...s, text: textAreaRef.current!.value } : s));
    }
    setTextEdit({ isEditing: false, id: '', text: '', x: 0, y: 0 });
  };
  
  // --- NEW: Handler to initiate text editing on double click ---
  const handleDoubleClick = (e: any, shape: Shape) => {
    if (shape.type !== 'note') return;
    const absPos = e.target.getAbsolutePosition();
    setTextEdit({
        id: shape.id,
        isEditing: true,
        text: shape.text || '',
        x: absPos.x,
        y: absPos.y
    });
  }

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <Toolbar />
      {/* --- NEW: Textarea overlay for editing --- */}
      {textEdit.isEditing && (
        <textarea
          ref={textAreaRef}
          value={textEdit.text}
          onChange={(e) => setTextEdit(prev => ({ ...prev, text: e.target.value }))}
          onBlur={handleTextEditEnd}
          style={{
            position: 'absolute',
            top: `${textEdit.y}px`,
            left: `${textEdit.x}px`,
            width: `${150}px`, // Should match note width
            height: `${150}px`, // Should match note height
            fontSize: '16px',
            border: '1px solid #3b82f6',
            padding: '12px',
            margin: '0',
            background: '#ffef96',
            fontFamily: 'sans-serif',
            resize: 'none',
            zIndex: 20,
            lineHeight: '1.5',
          }}
        />
      )}
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        draggable={activeTool === 'select'}
        onMouseDown={handleStageMouseDown}
        onMouseMove={(e) => sendCursorPosition(e.target.getStage()!.getPointerPosition()!)}
      >
        <Layer>
          <Grid width={stageSize.width} height={stageSize.height} />
          
          {shapes.map((shape) => {
            const isSelected = activeTool === 'select';
            // --- NEW: Render logic for lines ---
            if (shape.type === 'pen') {
                return <Line key={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={4} tension={0.5} lineCap="round" lineJoin="round" globalCompositeOperation="source-over" />;
              }
            // --- NEW: Render logic for notes ---
            if (shape.type === 'note') {
              return (
                <Group key={shape.id} x={shape.x} y={shape.y} draggable={isSelected} onDblClick={(e) => handleDoubleClick(e, shape)}>
                  <Rect width={shape.width} height={shape.height} fill={shape.fill} shadowBlur={5} shadowOpacity={0.3} cornerRadius={5} />
                  <Text text={shape.text} width={shape.width} padding={12} fontSize={16} lineHeight={1.5} />
                </Group>
              );
            }
            if (shape.type === 'rect') {
              return <Rect key={shape.id} {...shape} draggable={isSelected} />;
            }
            if (shape.type === 'circle') {
              return <Circle key={shape.id} {...shape} draggable={isSelected} />;
            }
            return null;
          })}
          
          {Object.entries(cursors).map(([userId, pos]) => (
            <LiveCursor key={userId} x={pos.x} y={pos.y} name={userId.substring(0, 6)} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}