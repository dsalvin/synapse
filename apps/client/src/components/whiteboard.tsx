"use client";

import { Stage, Layer, Rect, Circle, Text, Group, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { useWhiteboard } from '@/hooks/use-whiteboard';
import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from './toolbar';
import { useAppStore } from '@/lib/store';
import { Grid } from './grid';

type TextEditState = { id: string; isEditing: boolean; text: string; x: number; y: number; };

type Shape = {
  id: string;
  type: 'rect' | 'circle' | 'note' | 'pen' | 'connector';
  from?: string;
  to?: string;
  x?: number; y?: number;
  width?: number; height?: number;
  radius?: number; fill?: string;
  text?: string;
  points?: number[];
  stroke?: string;
};

const SmartArrow = ({ shape, allShapes }: { shape: Shape, allShapes: Shape[] }) => {
    const fromShape = allShapes.find(s => s.id === shape.from);
    const toShape = allShapes.find(s => s.id === shape.to);

    if (!fromShape || !toShape) return null;

    const from = { x: (fromShape.x || 0) + (fromShape.width || fromShape.radius || 0) / 2, y: (fromShape.y || 0) + (fromShape.height || fromShape.radius || 0) / 2 };
    const to = { x: (toShape.x || 0) + (toShape.width || toShape.radius || 0) / 2, y: (toShape.y || 0) + (toShape.height || toShape.radius || 0) / 2 };

    return <Arrow points={[from.x, from.y, to.x, to.y]} stroke={shape.stroke || 'black'} strokeWidth={3} pointerLength={10} pointerWidth={10} />;
};

const LiveCursor = ({ x, y, name }: { x: number; y: number; name: string }) => {
    return <Text text={`\uD83D\uDC49 ${name}`} x={x + 10} y={y + 10} fill="blue" fontSize={16} />;
};

export default function Whiteboard({ boardId }: { boardId: string }) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const { activeTool, fillColor } = useAppStore(); 
  
  const [textEdit, setTextEdit] = useState<TextEditState>({ isEditing: false, id: '', text: '', x: 0, y: 0 });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const isDrawing = useRef(false);
  const currentLineId = useRef<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const isConnecting = useRef(false);
  const connectorStartPoint = useRef<{ fromId: string } | null>(null);
  const connectorPreview = useRef<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  const { cursors, sendCursorPosition, sendObject } = useWhiteboard(boardId, 
    (newShapes) => setShapes(prev => [...prev, ...newShapes]),
    (updatedShape) => setShapes(prev => prev.map(s => s.id === updatedShape.id ? { ...s, ...updatedShape } : s))
  );

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setStageSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (textEdit.isEditing && textAreaRef.current) textAreaRef.current.focus();
  }, [textEdit.isEditing]);

  const getPointerPos = () => stageRef.current?.getPointerPosition() || { x: 0, y: 0 };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (textEdit.isEditing) return;

    if (activeTool === 'connector' && e.target !== e.target.getStage()) {
        isConnecting.current = true;
        connectorStartPoint.current = { fromId: e.target.id() };
        const pos = getPointerPos();
        connectorPreview.current = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
        return;
    }

    if (activeTool === 'select' || e.target !== e.target.getStage()) return;
    
    const pos = getPointerPos();
    if (activeTool === 'pen') {
        isDrawing.current = true;
        const id = uuidv4();
        currentLineId.current = id;
        setShapes(prev => [...prev, { id, type: 'pen', points: [pos.x, pos.y], stroke: fillColor }]);
        return;
    }
    let newShape: Shape;
    if (activeTool === 'rectangle') { newShape = { id: uuidv4(), type: 'rect', x: pos.x, y: pos.y, width: 100, height: 100, fill: fillColor }; } 
    else if (activeTool === 'circle') { newShape = { id: uuidv4(), type: 'circle', x: pos.x, y: pos.y, radius: 50, fill: fillColor }; } 
    else if (activeTool === 'note') { newShape = { id: uuidv4(), type: 'note', x: pos.x, y: pos.y, width: 150, height: 150, fill: fillColor, text: 'New Note' }; } 
    else { return; }
    setShapes(prev => [...prev, newShape]);
    sendObject({ type: 'OBJECT_ADD', payload: [newShape] });
  };
  
  const handleStageMouseMove = () => {
    const pos = getPointerPos();
    sendCursorPosition(pos);

    if (activeTool === 'connector' && isConnecting.current) {
        connectorPreview.current = { ...connectorPreview.current!, x2: pos.x, y2: pos.y };
        setShapes(prev => [...prev]);
        return;
    }

    if (activeTool === 'pen' && isDrawing.current) {
        setShapes(prev => prev.map(shape => (shape.id === currentLineId.current) ? { ...shape, points: [...(shape.points || []), pos.x, pos.y] } : shape));
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'connector' && isConnecting.current && connectorStartPoint.current) {
        if (e.target !== e.target.getStage()) {
            const toId = e.target.id();
            const fromId = connectorStartPoint.current.fromId;
            if (toId && fromId && toId !== fromId) {
                setShapes(prev => [...prev, { id: uuidv4(), type: 'connector', from: fromId, to: toId, stroke: fillColor }]);
                sendObject({ type: 'OBJECT_ADD', payload: [{ id: uuidv4(), type: 'connector', from: fromId, to: toId, stroke: fillColor }] });
            }
        }
    }
    isConnecting.current = false;
    connectorStartPoint.current = null;
    connectorPreview.current = null;
    
    if (activeTool === 'pen' && isDrawing.current) {
        isDrawing.current = false;
        const finalLine = shapes.find(s => s.id === currentLineId.current);
        if (finalLine) sendObject({ type: 'OBJECT_ADD', payload: [finalLine] });
        currentLineId.current = null;
    }
    setShapes(prev => [...prev]); // Force re-render to clear preview
  };
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const newPos = { x: e.target.x(), y: e.target.y() };
    setShapes(prev => prev.map(shape => shape.id === id ? { ...shape, ...newPos } : shape));
    sendObject({ type: 'OBJECT_UPDATE', payload: { id, ...newPos }});
  };

  const handleTextEditEnd = () => {
    if (textAreaRef.current) {
        const payload = { id: textEdit.id, text: textAreaRef.current.value };
        setShapes(prev => prev.map(s => s.id === textEdit.id ? { ...s, text: payload.text } : s));
        sendObject({ type: 'OBJECT_UPDATE', payload });
    }
    setTextEdit({ isEditing: false, id: '', text: '', x: 0, y: 0 });
  };
  
  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>, shape: Shape) => {
    if (shape.type !== 'note') return;
    setTextEdit({ id: shape.id, isEditing: true, text: shape.text || '', x: e.target.getAbsolutePosition().x, y: e.target.getAbsolutePosition().y });
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <Toolbar />
      {textEdit.isEditing && (
        <textarea ref={textAreaRef} value={textEdit.text} onChange={(e) => setTextEdit(prev => ({ ...prev, text: e.target.value }))} onBlur={handleTextEditEnd} style={{ position: 'absolute', top: `${textEdit.y}px`, left: `${textEdit.x}px`, width: `${150}px`, height: `${150}px`, fontSize: '16px', border: '1px solid #3b82f6', padding: '12px', margin: '0', background: '#ffef96', fontFamily: 'sans-serif', resize: 'none', zIndex: 20, lineHeight: '1.5' }} />
      )}
      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} draggable={activeTool === 'select'} onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} style={{ cursor: activeTool === 'connector' ? 'crosshair' : 'default' }}>
        <Layer>
          <Grid width={stageSize.width} height={stageSize.height} />
          {shapes.map((shape) => {
            const isSelected = activeTool === 'select';
            const dragProps = { draggable: isSelected, onDragEnd: handleDragEnd };

            if (shape.type === 'connector') {
              return <SmartArrow key={shape.id} shape={shape} allShapes={shapes} />;
            }
            if (shape.type === 'pen') { return <Line key={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={4} tension={0.5} lineCap="round" />; }
            if (shape.type === 'note') { return ( <Group key={shape.id} id={shape.id} x={shape.x} y={shape.y} {...dragProps} onDblClick={(e) => handleDoubleClick(e, shape)}> <Rect width={shape.width} height={shape.height} fill={shape.fill} cornerRadius={5} id={shape.id}/> <Text text={shape.text || ''} width={shape.width} padding={12} fontSize={16} listening={false}/> </Group> ); }
            
            {/* ✅ THE FIX IS HERE: No more spread operator. We pass props explicitly. */}
            if (shape.type === 'rect') {
                return <Rect key={shape.id} id={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} {...dragProps} />;
            }
            if (shape.type === 'circle') {
                return <Circle key={shape.id} id={shape.id} x={shape.x} y={shape.y} radius={shape.radius} fill={shape.fill} {...dragProps} />;
            }
            return null;
          })}
          {connectorPreview.current && <Arrow points={[connectorPreview.current.x1, connectorPreview.current.y1, connectorPreview.current.x2, connectorPreview.current.y2]} stroke="grey" strokeWidth={2} dash={[5, 5]} />}
          {Object.entries(cursors).map(([userId, pos]) => ( <LiveCursor key={userId} x={pos.x} y={pos.y} name={userId.substring(0, 6)} /> ))}
        </Layer>
      </Stage>
    </div>
  );
}
