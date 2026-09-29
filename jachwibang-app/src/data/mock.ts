export type FurnitureType = 'sofa' | 'bed' | 'armchair' | 'table' | 'lamp' | 'rug' | 'plant' | 'bookshelf';

export interface PlacedFurniture {
  id: number;
  type: FurnitureType;
  x: number; // percentage across the floor, 0-100
  y: number; // percentage down the floor, 0-100
  rotation: number; // degrees
  scale?: number; // size multiplier, default 1
}

export type WallFeatureType = 'window' | 'door';

/** A window or door placed on one of the room's 4 edges. */
export interface WallFeature {
  id: number;
  edge: 'top' | 'left' | 'bottom' | 'right';
  position: number; // percent along the edge, 0-100
  type: WallFeatureType;
}

/** A room's floor plan: which cells of a cols x rows grid are actual floor. */
export interface RoomShape {
  cols: number;
  rows: number;
  cells: string[]; // "x,y" keys of active floor cells
  features: WallFeature[];
}

/** Real-world size of one grid cell, for the meter-based size inputs. */
export const CELL_METERS = 0.5;

export function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

export function parseCellKey(key: string) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

function rectCells(cols: number, rows: number): string[] {
  const cells: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) cells.push(cellKey(x, y));
  }
  return cells;
}

export const ROOM_MIN_SIZE = 4;
export const ROOM_MAX_SIZE = 16;
export const ROOM_MIN_CELLS = 4;

export const initialRoomShape: RoomShape = {
  cols: 8,
  rows: 7,
  cells: rectCells(8, 7),
  features: [
    { id: 1, edge: 'top', position: 30, type: 'window' },
    { id: 2, edge: 'left', position: 70, type: 'door' },
  ],
};

export interface Comment {
  author: string;
  text: string;
}

export interface CommunityPost {
  id: number;
  author: string;
  placed: PlacedFurniture[];
  liked: boolean;
  likes: number;
  comments: Comment[];
}

export const initialRoomFurniture: PlacedFurniture[] = [
  { id: 1, type: 'sofa', x: 30, y: 32, rotation: 0 },
  { id: 2, type: 'bed', x: 68, y: 66, rotation: 0 },
];

export const initialPosts: CommunityPost[] = [
  {
    id: 1,
    author: '정우',
    liked: false,
    likes: 12,
    comments: [{ author: '준영', text: '소파 위치 완전 좋다' }],
    placed: [
      { id: 1, type: 'sofa', x: 28, y: 38, rotation: 0 },
      { id: 2, type: 'table', x: 68, y: 64, rotation: 0 },
      { id: 3, type: 'armchair', x: 66, y: 28, rotation: 20 },
    ],
  },
  {
    id: 2,
    author: '준영',
    liked: true,
    likes: 8,
    comments: [],
    placed: [
      { id: 1, type: 'bed', x: 35, y: 42, rotation: 0 },
      { id: 2, type: 'table', x: 72, y: 70, rotation: 0 },
    ],
  },
];

export const monthlyExpensesByDay: Record<number, number> = {
  2: 8000,
  5: 32000,
  9: 15000,
  14: 52000,
  18: 9000,
  23: 41000,
  27: 6000,
};

export const totalThisMonth = 482000;
/** Monthly spending goal shown as a progress bar on the home screen. */
export const monthlyBudget = 600000;
export const savedThisMonth = 58000;

export const categoryBreakdown: { category: string; icon: string; amount: number }[] = [
  { category: '식비', icon: 'restaurant-outline', amount: 210000 },
  { category: '월세', icon: 'business-outline', amount: 200000 },
  { category: '공과금', icon: 'flash-outline', amount: 72000 },
];

export const recentActivity: { icon: string; text: string; tone: 'success' | 'accent' | 'warm' }[] = [
  { icon: 'sparkles-outline', text: '이번 달 58,000원 절약했어요', tone: 'success' },
  { icon: 'receipt-outline', text: '식비 12,000원 지출 등록', tone: 'accent' },
  { icon: 'heart-outline', text: '내 3D 배치에 좋아요 3개', tone: 'warm' },
];

export function formatWon(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}
