"use client";

import { MousePointer2, Square, Circle, Type, Pencil } from 'lucide-react';
import { useAppStore, Tool } from '@/lib/store';
import { clsx } from 'clsx';

const ToolButton = ({ tool, icon: Icon, activeTool, onClick }: {
  tool: Tool;
  icon: React.ElementType;
  activeTool: Tool;
  onClick: (tool: Tool) => void;
}) => (
  <button
    onClick={() => onClick(tool)}
    className={clsx(
      "p-2 rounded-md hover:bg-blue-100",
      { "bg-blue-200 text-blue-800": activeTool === tool }
    )}
  >
    <Icon size={20} />
  </button>
);

const COLORS = ['#333333', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export function Toolbar() {
  const { activeTool, setActiveTool, fillColor, setFillColor } = useAppStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md p-2 flex items-center gap-2 z-10">
      {/* --- Tools Section --- */}
      <div className="flex items-center gap-2 border-r pr-2 mr-2">
        <ToolButton tool="select" icon={MousePointer2} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="rectangle" icon={Square} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="circle" icon={Circle} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="note" icon={Type} activeTool={activeTool} onClick={setActiveTool} />
        <ToolButton tool="pen" icon={Pencil} activeTool={activeTool} onClick={setActiveTool} />
      </div>

      {/* --- NEW: Color Palette Section --- */}
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