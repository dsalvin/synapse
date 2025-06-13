import { create } from 'zustand';

export type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'note' | 'connector';

// --- NEW: Add fillColor state ---
type AppState = {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  fillColor: '#333', // Default color
  setFillColor: (color) => set({ fillColor: color }),
}));