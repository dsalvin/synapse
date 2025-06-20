import { create } from 'zustand';
import type { Shape } from '@/types/board.d';

export type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'diamond' | 'note' | 'connector' | 'eraser';

type AppState = {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  history: Shape[][];
  historyIndex: number;
  setShapes: (newShapes: Shape[], fromHistory?: boolean) => void;
  updateShapeInHistory: (updatedShape: Shape) => void;
  undo: () => void;
  redo: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  fillColor: '#333',
  setFillColor: (color) => set({ fillColor: color }),
  history: [[]],
  historyIndex: 0,
  setShapes: (newShapes, fromHistory = false) => {
    if (fromHistory) {
      set({ history: [[...newShapes]], historyIndex: 0 });
      return;
    }
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  updateShapeInHistory: (updatedShape) => {
    const { history, historyIndex } = get();
    const currentShapes = history[historyIndex];
    const newShapes = currentShapes.map(s => s.id === updatedShape.id ? updatedShape : s);
    const newHistory = [...history];
    newHistory[historyIndex] = newShapes;
    set({ history: newHistory });
  },
  undo: () => {
    const { historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 });
    }
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 });
    }
  },
}));