export type BoardRole = 'owner' | 'editor' | 'viewer';
export type Board = { id: string; name: string; ownerId: string; createdAt: string; memberIds: string[]; memberRoles: { [userId: string]: BoardRole; }; };
export interface RectShape { type: 'rect'; id: string; x: number; y: number; width: number; height: number; fill: string; }
export interface CircleShape { type: 'circle'; id: string; x: number; y: number; radius: number; fill: string; }
export interface PenShape { type: 'pen'; id: string; points: number[]; stroke: string; }
export interface NoteShape { type: 'note'; id: string; x: number; y: number; width: number; height: number; fill: string; text: string; }
export interface DiamondShape { type: 'diamond'; id: string; x: number; y: number; width: number; height: number; fill: string; }
export interface ConnectorShape { type: 'connector'; id: string; from: string; to: string; stroke: string; }
export type Shape = RectShape | CircleShape | PenShape | NoteShape | DiamondShape | ConnectorShape;
export type PresenceUser = { id:string; name: string; email?: string | null; image: string; };