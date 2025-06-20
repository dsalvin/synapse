"use client";

import { MousePointer2, Square, Circle, Diamond, Type, Pencil, Share2, Undo2, Redo2, Eraser } from 'lucide-react';
import { useAppStore, Tool } from '@/lib/store';
import { clsx } from 'clsx';

const ToolButton = ({ tool, icon: Icon, activeTool, onClick, disabled = false }: {
  tool: Tool;
  icon: React.ElementType;
  activeTool: Tool;
  onClick: (tool: Tool) => void;
  disabled?: boolean;
}) => (
  <button
    onClick={() => onClick(tool)}
    disabled={disabled}
    className={clsx(
      "p-2 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed",
      { "bg-blue-200 text-blue-800": activeTool === tool }
    )}
  >
    <Icon size={20} />
  </button>
);

const ActionButton = ({ icon: Icon, onClick, disabled = false }: {
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Icon size={20} />
  </button>
);

const COLORS = ['#333333', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export function Toolbar() {
  const { 
    activeTool, setActiveTool, 
    fillColor, setFillColor,
    undo, redo,
    history, historyIndex
  } = useAppStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md p-2 flex items-center gap-2 z-10">
      {/* --- Undo/Redo Section --- */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ActionButton icon={Undo2} onClick={undo} disabled={!canUndo} />
        <ActionButton icon={Redo2} onClick={redo} disabled={!canRedo} />
      </div>

      {/* --- Tools Section --- */}
      <div className="flex items-center gap-2 border-r pr-2 mr-2">
        <ToolButton tool="select" icon={MousePointer2} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="rectangle" icon={Square} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="circle" icon={Circle} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="diamond" icon={Diamond} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="note" icon={Type} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="pen" icon={Pencil} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="eraser" icon={Eraser} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="connector" icon={Share2} activeTool={activeTool} onClick={setActiveTool} />
      </div>

      {/* --- Color Palette Section --- */}
      <div className="flex items-center gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setFillColor(color)}
            className={clsx(
              "w-6 h-6 rounded-full border-2",
              { "border-blue-500": fillColor === color, "border-transparent": fillColor !== color }
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}