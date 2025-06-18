"use client";

import { Stage, Layer, Rect, Circle, Text, Group, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { useWhiteboard } from '@/hooks/use-whiteboard';
import { useEffect, useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from './toolbar';
import { useAppStore } from '@/lib/store';
import { Grid } from './grid';
import { Plus, Minus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PresenceAvatars } from './presence-avatars';
import { NoteShape } from './note-shape';
import { User } from 'next-auth';

type TextEditState = { 
  id: string; 
  isEditing: boolean; 
  text: string; 
  x: number; 
  y: number; 
  fill?: string; 
  textColor?: string;
};

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

type PresenceUser = {
    id: string;
    name: string;
    image: string;
};

const ZoomControls = ({ scale, onZoomIn, onZoomOut }: { scale: number, onZoomIn: () => void, onZoomOut: () => void }) => {
    return (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-1 flex items-center gap-1 z-10">
            <button onClick={onZoomOut} className="p-2 hover:bg-gray-100 rounded-md"><Minus size={16} /></button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={onZoomIn} className="p-2 hover:bg-gray-100 rounded-md"><Plus size={16} /></button>
        </div>
    );
};

const SmartArrow = ({ shape, allShapes }: { shape: Shape, allShapes: Shape[] }) => {
    const fromShape = allShapes.find(s => s.id === shape.from);
    const toShape = allShapes.find(s => s.id === shape.to);
    if (!fromShape || !toShape) return null;
    const existingConnectors = allShapes.filter(s => (s.type === 'connector') && ((s.from === shape.from && s.to === shape.to) || (s.from === shape.to && s.to === shape.from)));
    const connectorIndex = existingConnectors.findIndex(s => s.id === shape.id);
    const offset = (connectorIndex - (existingConnectors.length - 1) / 2) * 10;
    const from = { x: (fromShape.x || 0) + (fromShape.width || 0) / 2, y: (fromShape.y || 0) + (fromShape.height || 0) / 2 };
    const to = { x: (toShape.x || 0) + (toShape.width || 0) / 2, y: (toShape.y || 0) + (toShape.height || 0) / 2 };
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const perpendicularAngle = angle + Math.PI / 2;
    const offsetX = Math.cos(perpendicularAngle) * offset;
    const offsetY = Math.sin(perpendicularAngle) * offset;
    const points = [from.x + offsetX, from.y + offsetY, to.x + offsetX, to.y + offsetY];
    return <Arrow points={points} stroke={shape.stroke || 'black'} strokeWidth={3} pointerLength={10} pointerWidth={10} />;
};

const LiveCursor = ({ x, y, name }: { x: number; y: number; name: string }) => {
    return <Text text={`\uD83D\uDC49 ${name}`} x={x + 10} y={y + 10} fill="blue" fontSize={16} />;
};

const WhiteboardCanvas = ({ boardId, user }: { boardId: string, user: User & { id: string } }) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
  const { activeTool, fillColor } = useAppStore(); 
  
  const [textEdit, setTextEdit] = useState<TextEditState>({ isEditing: false, id: '', text: '', x: 0, y: 0, fill: '#ffef96' });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isDrawing = useRef(false);
  const currentLineId = useRef<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const isConnecting = useRef(false);
  const connectorStartPoint = useRef<{ fromId: string } | null>(null);
  const [connectorPreview, setConnectorPreview] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const handleBoardLoad = useCallback((initialShapes: Shape[]) => { setShapes(initialShapes); }, []);
  const handleAddShapes = useCallback((newShapes: Shape[]) => { setShapes(prev => { const newShapesFiltered = newShapes.filter(newShape => !prev.some(existingShape => existingShape.id === newShape.id)); return [...prev, ...newShapesFiltered]; }); }, []);
  const handleUpdateShape = useCallback((updatedShape: Partial<Shape> & { id: string }) => { setShapes(prev => prev.map(s => s.id === updatedShape.id ? { ...s, ...updatedShape } : s)); }, []);
  const handlePresenceUpdate = useCallback(({ users }: { users: PresenceUser[] }) => { setPresentUsers(users); }, []);

  const { cursors, sendCursorPosition, sendObject } = useWhiteboard(boardId, user, handleBoardLoad, handleAddShapes, handleUpdateShape, handlePresenceUpdate);

  useEffect(() => { const handleResize = () => setStageSize({ width: window.innerWidth, height: window.innerHeight }); handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
  useEffect(() => { if (textEdit.isEditing && textAreaRef.current) textAreaRef.current.focus(); }, [textEdit.isEditing]);

  const getPointerPos = () => {
      const stage = stageRef.current;
      if (!stage) return null;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return null;
      return {
          x: (pointerPos.x - stage.x()) / stage.scaleX(),
          y: (pointerPos.y - stage.y()) / stage.scaleY(),
      };
  };

  const zoomStage = (direction: 'in' | 'out') => {
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 };
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const direction = e.evt.deltaY > 0 ? 'out' : 'in';
      zoomStage(direction);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (textEdit.isEditing) return;
    const stage = e.target.getStage();
    const didClickOnShape = e.target !== stage;
    if (activeTool === 'select') {
        if (!didClickOnShape && stage) {
            isPanning.current = true;
            lastPointerPosition.current = stage.getPointerPosition()!;
        }
        return;
    }
    if (didClickOnShape) return;
    const pos = getPointerPos();
    if (!pos) return;
    if (activeTool === 'pen') {
        isDrawing.current = true;
        const id = uuidv4();
        currentLineId.current = id;
        const newShape: Shape = { id, type: 'pen', points: [pos.x, pos.y], stroke: fillColor };
        setShapes(prev => [...prev, newShape]);
        sendObject({ type: 'OBJECT_ADD', payload: [newShape] });
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
  
  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getPointerPos();
    if (pos) { sendCursorPosition(pos); }
    if (isPanning.current) {
        const stage = e.target.getStage();
        if (stage && pos) {
            const newPos = stage.getPointerPosition()!;
            const dx = newPos.x - lastPointerPosition.current.x;
            const dy = newPos.y - lastPointerPosition.current.y;
            setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastPointerPosition.current = newPos;
        }
        return;
    }
    if (activeTool === 'pen' && isDrawing.current && pos) {
        const line = shapes.find(s => s.id === currentLineId.current);
        if (line && line.points) {
            const newPoints = [...line.points, pos.x, pos.y];
            const updatedLine = { ...line, points: newPoints };
            setShapes(prev => prev.map(s => (s.id === currentLineId.current) ? updatedLine : s));
            sendObject({ type: 'OBJECT_UPDATE', payload: { id: currentLineId.current, points: newPoints } });
        }
    }
  };

  const handleStageMouseUp = () => {
    isPanning.current = false;
    isDrawing.current = false;
    isConnecting.current = false;
    currentLineId.current = null;
    connectorStartPoint.current = null;
    setConnectorPreview(null);
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
    const absPos = e.target.getAbsolutePosition();
    // This helper function is now in note-shape.tsx, so we can't call it here.
    // We'll just pass the essential data to the textEdit state.
    setTextEdit({ 
        id: shape.id, isEditing: true, text: shape.text || '', 
        x: absPos.x, y: absPos.y, fill: shape.fill, textColor: 'black' // Placeholder, as the textarea will handle the color
    });
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <Toolbar />
      <PresenceAvatars users={presentUsers} />
      <ZoomControls scale={stageScale} onZoomIn={() => zoomStage('in')} onZoomOut={() => zoomStage('out')} />
      {textEdit.isEditing && (
        <textarea 
          ref={textAreaRef} value={textEdit.text} 
          onChange={(e) => setTextEdit(prev => ({ ...prev, text: e.target.value }))} 
          onBlur={handleTextEditEnd} 
          style={{ position: 'absolute', top: `${textEdit.y}px`, left: `${textEdit.x}px`, 
            width: `${150 * stageScale}px`, height: `${150 * stageScale}px`, fontSize: `${16 * stageScale}px`, 
            border: '1px solid #3b82f6', padding: `${12 * stageScale}px`, margin: '0', 
            background: textEdit.fill || '#ffef96', color: textEdit.textColor, 
            fontFamily: 'sans-serif', resize: 'none', zIndex: 20, lineHeight: '1.5' 
          }} 
        />
      )}
      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} draggable={false} onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} onWheel={handleWheel} scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y} style={{ cursor: activeTool === 'select' ? 'grab' : 'default' }}>
        <Layer>
          <Grid width={stageSize.width / stageScale} height={stageSize.height / stageScale} x={-stagePos.x / stageScale} y={-stagePos.y / stageScale} />
          {shapes.filter(shape => shape && shape.type).map((shape) => {
              const isSelected = activeTool === 'select';
              if (shape.type === 'note') {
                  return <NoteShape key={shape.id} shape={shape} isSelected={isSelected} onDragEnd={handleDragEnd} onDblClick={(e) => handleDoubleClick(e, shape)} />;
              }
              if (shape.type === 'rect') { return <Rect key={shape.id} id={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} draggable={isSelected} onDragEnd={handleDragEnd} />; }
              if (shape.type === 'circle') { return <Circle key={shape.id} id={shape.id} x={shape.x} y={shape.y} radius={shape.radius} fill={shape.fill} draggable={isSelected} onDragEnd={handleDragEnd} />; }
              if (shape.type === 'pen') { return <Line key={shape.id} id={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={4} tension={0.5} lineCap="round" />; }
              if (shape.type === 'connector') { return <SmartArrow key={shape.id} shape={shape} allShapes={shapes} />; }
              return null;
          })}
          {connectorPreview && <Arrow points={[connectorPreview.x1, connectorPreview.y1, connectorPreview.x2, connectorPreview.y2]} stroke="grey" strokeWidth={2} dash={[5, 5]} />}
          {Object.entries(cursors).map(([userId, pos]) => {
                const presentUser = presentUsers.find(u => u.id === userId);
                if (presentUser && pos && userId !== user.id) {
                    return <LiveCursor key={userId} x={pos.x} y={pos.y} name={presentUser.name} />;
                }
                return null;
            })}
        </Layer>
      </Stage>
    </div>
  );
};

export default function Whiteboard({ boardId }: { boardId: string }) {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
        <div className="w-full h-screen flex items-center justify-center">
            <p className="text-2xl font-semibold">Loading Session...</p>
        </div>
    );
  }
  if (status === "unauthenticated" || !session?.user) {
      return (
          <div className="w-full h-screen flex items-center justify-center">
              <p className="text-2xl font-semibold">Access Denied. Please sign in.</p>
          </div>
      );
  }
  return <WhiteboardCanvas boardId={boardId} user={session.user} />;
}