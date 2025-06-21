"use client";

import { MousePointer2, Square, Circle, Diamond, Type, Pencil, Share2, Undo2, Redo2, Eraser } from 'lucide-react';
import { useAppStore, Tool } from '@/lib/store';
import { clsx } from 'clsx';

const ToolButton = ({ title, tool, icon: Icon, activeTool, onClick, disabled = false }: { title: string; tool: Tool; icon: React.ElementType; activeTool: Tool; onClick: (tool: Tool) => void; disabled?: boolean; }) => ( <button title={title} onClick={() => onClick(tool)} disabled={disabled} className={clsx( "p-2 rounded-md hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed", { "bg-teal-200 text-teal-800": activeTool === tool && !disabled } )}> <Icon size={20} /> </button> );
const ActionButton = ({ title, icon: Icon, onClick, disabled = false }: { title: string; icon: React.ElementType; onClick: () => void; disabled?: boolean; }) => ( <button title={title} onClick={onClick} disabled={disabled} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"> <Icon size={20} /> </button> );
const COLORS = ['#333333', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

interface ToolbarProps { isViewer: boolean; }

export function Toolbar({ isViewer }: ToolbarProps) {
  const { activeTool, setActiveTool, fillColor, setFillColor, undo, redo, history, historyIndex } = useAppStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="bg-white rounded-lg shadow-md p-1 flex items-center gap-2">
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ActionButton title="Undo" icon={Undo2} onClick={undo} disabled={!canUndo || isViewer} />
        <ActionButton title="Redo" icon={Redo2} onClick={redo} disabled={!canRedo || isViewer} />
      </div>
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ToolButton title="Select" tool="select" icon={MousePointer2} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton title="Rectangle" tool="rectangle" icon={Square} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
        <ToolButton title="Circle" tool="circle" icon={Circle} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
        <ToolButton title="Diamond" tool="diamond" icon={Diamond} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
        <ToolButton title="Note" tool="note" icon={Type} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
        <ToolButton title="Pen" tool="pen" icon={Pencil} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
        <ToolButton title="Eraser" tool="eraser" icon={Eraser} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
        <ToolButton title="Connector" tool="connector" icon={Share2} activeTool={activeTool} onClick={setActiveTool} disabled={isViewer} />
      </div>
      <div className="flex items-center gap-2">
        {COLORS.map((color) => ( <button key={color} title={color} onClick={() => setFillColor(color)} disabled={isViewer} className={clsx( "w-6 h-6 rounded-full border-2 disabled:opacity-50", { "border-teal-500": fillColor === color, "border-transparent": fillColor !== color } )} style={{ backgroundColor: color }} /> ))}
      </div>
    </div>
  );
}