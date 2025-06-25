"use client";

import { Stage, Layer, Rect, Circle, Text, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { useWhiteboard } from '@/hooks/use-whiteboard';
import { useEffect, useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from './toolbar';
import { useAppStore } from '@/lib/store';
import { Grid } from './grid';
import { Plus, Minus } from 'lucide-react';
import { PresenceAvatars } from './presence-avatars';
import { NoteShape } from './note-shape';
import { DiamondShape } from './diamond-shape';
import { ShareButton } from './share-button';
import { User } from 'next-auth';
import { findBestConnectionPoints } from '@/lib/geometry';
import type { Board, Shape, PresenceUser, PenShape, RectShape, CircleShape, NoteShape as NoteShapeType, DiamondShape as DiamondShapeType, ConnectorShape } from '@/types/board.d';

type TextEditState = { id: string; isEditing: boolean; text: string; x: number; y: number; fill: string; textColor?: string; };
const ZoomControls = ({ scale, onZoomIn, onZoomOut }: { scale: number, onZoomIn: () => void, onZoomOut: () => void }) => ( <div className="absolute bottom-4 right-4 bg-black rounded-lg shadow-md p-1 flex items-center gap-1 z-10"> <button onClick={onZoomOut} className="p-2 hover:bg-teal-100 rounded-md"><Minus size={16} /></button> <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span> <button onClick={onZoomIn} className="p-2 hover:bg-teal-100 rounded-md"><Plus size={16} /></button> </div> );
const SmartArrow = ({ shape, allShapes }: { shape: Shape, allShapes: Shape[] }) => { if (shape.type !== 'connector') return null; const fromShape = allShapes.find(s => s.id === shape.from); const toShape = allShapes.find(s => s.id === shape.to); if (!fromShape || !toShape) return null; const connection = findBestConnectionPoints(fromShape, toShape); if (!connection) return null; const points = [connection.start.x, connection.start.y, connection.end.x, connection.end.y]; return <Arrow points={points} stroke={shape.stroke} strokeWidth={3} pointerLength={10} pointerWidth={10} />; };
const LiveCursor = ({ x, y, name }: { x: number; y: number; name: string }) => ( <Text text={`\uD83D\uDC49 ${name}`} x={x + 10} y={y + 10} fill="blue" fontSize={16} /> );

const Whiteboard = ({ boardId, user }: { boardId: string, user: User & { id: string } }) => {
  const { history, historyIndex, setShapes, updateShapeInHistory, activeTool, setActiveTool } = useAppStore();
  const fillColor = useAppStore(state => state.fillColor);
  const shapes = history[historyIndex] || [];
  const [board, setBoard] = useState<Board | null>(null);
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
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
  const userRole = board?.memberRoles[user.id];
  const isViewer = userRole === 'viewer';

  const fetchBoardData = useCallback(async () => { try { const response = await fetch(`/api/boards/${boardId}`, { cache: 'no-store' }); if (response.ok) { const data = await response.json(); setBoard(data); if (data.memberRoles[user.id] === 'viewer') { setActiveTool('select'); } } } catch (error) { console.error("Failed to fetch board details:", error); } }, [boardId, user.id, setActiveTool]);
  useEffect(() => { fetchBoardData(); const handleBoardUpdate = () => fetchBoardData(); window.addEventListener('boardUpdate', handleBoardUpdate); return () => { window.removeEventListener('boardUpdate', handleBoardUpdate); } }, [fetchBoardData]);
  const handleBoardLoad = useCallback((initialShapes: Shape[]) => { useAppStore.getState().setShapes(initialShapes, true); }, []);
  const handleAddShapes = useCallback((newShapes: Shape[]) => { const currentShapes = useAppStore.getState().history[useAppStore.getState().historyIndex] || []; const filteredNewShapes = newShapes.filter(newShape => !currentShapes.some(s => s.id === newShape.id)); if (filteredNewShapes.length > 0) { useAppStore.getState().setShapes([...currentShapes, ...filteredNewShapes]); } }, []);
  const handleUpdateShape = useCallback((updatedShape: Partial<Shape> & { id: string }) => { const currentShapes = useAppStore.getState().history[useAppStore.getState().historyIndex] || []; useAppStore.getState().setShapes( currentShapes.map(s => s.id === updatedShape.id ? { ...s, ...updatedShape } as Shape : s) ); }, []);
  const handleDeleteShapes = useCallback((shapeIds: string[]) => { const currentShapes = useAppStore.getState().history[useAppStore.getState().historyIndex] || []; useAppStore.getState().setShapes(currentShapes.filter(s => !shapeIds.includes(s.id))); }, []);
  const handlePresenceUpdate = useCallback(({ users }: { users: PresenceUser[] }) => { setPresentUsers(users); }, []);
  const { sendObject, sendCursorPosition } = useWhiteboard(boardId, user, handleBoardLoad, handleAddShapes, handleUpdateShape, handleDeleteShapes, handlePresenceUpdate);

  useEffect(() => { const handleResize = () => setStageSize({ width: window.innerWidth, height: window.innerHeight }); handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
  useEffect(() => { if (textEdit.isEditing && textAreaRef.current) textAreaRef.current.focus(); }, [textEdit.isEditing]);

  const getPointerPos = () => { const stage = stageRef.current; if (!stage) return null; const pointerPos = stage.getPointerPosition(); if (!pointerPos) return null; return { x: (pointerPos.x - stage.x()) / stage.scaleX(), y: (pointerPos.y - stage.y()) / stage.scaleY(), }; };
  const zoomStage = (direction: 'in' | 'out') => { const stage = stageRef.current; if (!stage) return; const scaleBy = 1.1; const oldScale = stage.scaleX(); const pointer = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 }; const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale, }; const newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy; setStageScale(newScale); setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale, }); };
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => { e.evt.preventDefault(); const direction = e.evt.deltaY > 0 ? 'out' : 'in'; zoomStage(direction); };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isViewer || textEdit.isEditing) return;
    const stage = e.target.getStage();
    const didClickOnShape = e.target !== stage;
    const pos = getPointerPos();
    if (!pos) return;

    if (activeTool === 'connector' && didClickOnShape) {
        isConnecting.current = true;
        connectorStartPoint.current = { fromId: e.target.id() };
        setConnectorPreview({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
        return;
    }
    if (activeTool === 'eraser' && didClickOnShape) { const idToDelete = e.target.id(); if (idToDelete) { handleDeleteShapes([idToDelete]); sendObject({ type: 'OBJECT_DELETE', payload: [idToDelete] }); } return; }
    if (activeTool === 'select') { if (!didClickOnShape && stage) { isPanning.current = true; lastPointerPosition.current = stage.getPointerPosition()!; } return; }
    if (didClickOnShape) return;
    if (activeTool === 'pen') {
        isDrawing.current = true; const id = uuidv4(); currentLineId.current = id;
        const newShape: PenShape = { id, type: 'pen', points: [pos.x, pos.y], stroke: fillColor };
        setShapes([...shapes, newShape]);
        return;
    }
    let newShape: RectShape | CircleShape | NoteShapeType | DiamondShapeType;
    if (activeTool === 'rectangle') { newShape = { id: uuidv4(), type: 'rect', x: pos.x, y: pos.y, width: 100, height: 100, fill: fillColor }; }
    else if (activeTool === 'circle') { newShape = { id: uuidv4(), type: 'circle', x: pos.x, y: pos.y, radius: 50, fill: fillColor }; }
    else if (activeTool === 'note') { newShape = { id: uuidv4(), type: 'note', x: pos.x, y: pos.y, width: 150, height: 150, fill: fillColor, text: 'New Note' }; }
    else if (activeTool === 'diamond') { newShape = { id: uuidv4(), type: 'diamond', x: pos.x, y: pos.y, width: 100, height: 100, fill: fillColor }; }
    else { return; }
    setShapes([...shapes, newShape]); sendObject({ type: 'OBJECT_ADD', payload: [newShape] });
  };
  
  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getPointerPos();
    if(pos) { sendCursorPosition(pos); }
    if (isPanning.current) { const stage = e.target.getStage(); if (stage && pos) { const newPos = stage.getPointerPosition()!; const dx = newPos.x - lastPointerPosition.current.x; const dy = newPos.y - lastPointerPosition.current.y; setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy })); lastPointerPosition.current = newPos; } return; }
    if (activeTool === 'connector' && isConnecting.current && pos) { setConnectorPreview(prev => (prev ? { ...prev, x2: pos.x, y2: pos.y } : null)); return; }
    if (activeTool === 'pen' && isDrawing.current && pos) {
        if(isViewer) return;
        const line = useAppStore.getState().history[useAppStore.getState().historyIndex].find(s => s.id === currentLineId.current);
        if (line && line.type === 'pen') {
            const newPoints = [...line.points, pos.x, pos.y];
            updateShapeInHistory({ ...line, points: newPoints });
        }
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const didClickOnShape = e.target !== e.target.getStage();
    if (activeTool === 'connector' && isConnecting.current && connectorStartPoint.current) {
        if (didClickOnShape) {
            const toId = e.target.id(); const fromId = connectorStartPoint.current.fromId;
            if (toId && fromId && toId !== fromId) {
                const newConnector: ConnectorShape = { id: uuidv4(), type: 'connector', from: fromId, to: toId, stroke: fillColor };
                setShapes([...shapes, newConnector]);
                sendObject({ type: 'OBJECT_ADD', payload: [newConnector] });
            }
        }
    }
    if (activeTool === 'pen' && isDrawing.current) {
      if(isViewer) return;
      const finalShapes = useAppStore.getState().history[useAppStore.getState().historyIndex];
      const line = finalShapes.find(s => s.id === currentLineId.current);
      if (line) { sendObject({ type: 'OBJECT_ADD', payload: [line] }); }
    }
    isPanning.current = false; isDrawing.current = false; currentLineId.current = null; isConnecting.current = false; connectorStartPoint.current = null; setConnectorPreview(null);
  };
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isViewer) return;
    const id = e.target.id();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    let payload: Shape;
    switch(shape.type) {
        case 'pen':
            const dx = e.target.x(); const dy = e.target.y();
            const newPoints = shape.points.map((p, i) => i % 2 === 0 ? p + dx : p + dy);
            payload = { ...shape, points: newPoints };
            e.target.position({ x: 0, y: 0 });
            break;
        case 'rect': case 'circle': case 'note': case 'diamond':
            payload = { ...shape, x: e.target.x(), y: e.target.y() };
            break;
        default: return;
    }
    const newShapes = shapes.map(s => (s.id === id ? payload : s));
    setShapes(newShapes); sendObject({ type: 'OBJECT_UPDATE', payload });
  };
  
  const handleTextEditEnd = () => {
    if (textAreaRef.current) {
        const payload = { id: textEdit.id, text: textAreaRef.current.value };
        setShapes(shapes.map(s => { if (s.id === textEdit.id && s.type === 'note') { return { ...s, text: payload.text }; } return s; }));
        sendObject({ type: 'OBJECT_UPDATE', payload });
    }
    setTextEdit({ isEditing: false, id: '', text: '', x: 0, y: 0, fill: '#ffef96' });
  };
  
  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>, shape: Shape) => {
    if (isViewer) return;
    if (shape.type !== 'note') return;
    const absPos = e.target.getAbsolutePosition();
    setTextEdit({ id: shape.id, isEditing: true, text: shape.text, x: absPos.x, y: absPos.y, fill: shape.fill, textColor: 'black' });
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-16 p-2 flex items-center justify-between pointer-events-none z-20">
          <div className="pointer-events-auto">
            <ShareButton board={board} onBoardUpdate={fetchBoardData} />
          </div>
          <div className="pointer-events-auto">
            <Toolbar isViewer={isViewer} />
          </div>
          <div className="pointer-events-auto">
            <PresenceAvatars users={presentUsers} />
          </div>
      </div>
      <ZoomControls scale={stageScale} onZoomIn={() => zoomStage('in')} onZoomOut={() => zoomStage('out')} />
      {textEdit.isEditing && ( <textarea ref={textAreaRef} value={textEdit.text} onChange={(e) => setTextEdit(prev => ({ ...prev, text: e.target.value }))} onBlur={handleTextEditEnd} style={{ position: 'absolute', top: `${textEdit.y}px`, left: `${textEdit.x}px`, width: `${150 * stageScale}px`, height: `${150 * stageScale}px`, fontSize: `${16 * stageScale}px`, border: '1px solid #3b82f6', padding: `${12 * stageScale}px`, margin: '0', background: textEdit.fill, color: textEdit.textColor, fontFamily: 'sans-serif', resize: 'none', zIndex: 30, lineHeight: '1.5' }} /> )}
      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} draggable={false} onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} onWheel={handleWheel} scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y} style={{ cursor: activeTool === 'eraser' ? 'crosshair' : activeTool === 'select' ? 'grab' : 'default' }}>
        <Layer>
          <Grid width={stageSize.width / stageScale} height={stageSize.height / stageScale} x={-stagePos.x / stageScale} y={-stagePos.y / stageScale} />
          {shapes.filter(Boolean).map((shape) => {
              const isSelected = activeTool === 'select' && !isViewer;
              switch(shape.type) {
                case 'note': return <NoteShape key={shape.id} shape={shape} isSelected={isSelected} onDragEnd={handleDragEnd} onDblClick={(e) => handleDoubleClick(e, shape)} />;
                case 'diamond': return <DiamondShape key={shape.id} shape={shape} isSelected={isSelected} onDragEnd={handleDragEnd} />;
                case 'rect': return <Rect key={shape.id} id={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} draggable={isSelected} onDragEnd={handleDragEnd} />;
                case 'circle': return <Circle key={shape.id} id={shape.id} x={shape.x} y={shape.y} radius={shape.radius} fill={shape.fill} draggable={isSelected} onDragEnd={handleDragEnd} />;
                case 'pen': return <Line key={shape.id} id={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={4} tension={0.5} lineCap="round" draggable={isSelected} onDragEnd={handleDragEnd}/>;
                case 'connector': return <SmartArrow key={shape.id} shape={shape} allShapes={shapes} />;
                default: return null;
              }
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Whiteboard;