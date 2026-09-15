export type FurnitureType = 'sofa' | 'bed' | 'armchair' | 'table';

export interface PlacedFurniture {
  id: number;
  type: FurnitureType;
  x: number; // percentage across the floor, 0-100
  y: number; // percentage down the floor, 0-100
  rotation: number; // degrees
}

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
export const savedThisMonth = 58000;

export const categoryBreakdown: { category: string; icon: string; amount: number }[] = [
  { category: '식비', icon: 'restaurant-outline', amount: 210000 },
  { category: '월세', icon: 'business-outline', amount: 200000 },
  { category: '공과금', icon: 'flash-outline', amount: 72000 },
];

export const recentActivity: { icon: string; text: string; tone: 'success' | 'accent' | 'danger' }[] = [
  { icon: 'sparkles-outline', text: '이번 달 58,000원 절약했어요', tone: 'success' },
  { icon: 'receipt-outline', text: '식비 12,000원 지출 등록', tone: 'accent' },
  { icon: 'heart-outline', text: '내 3D 배치에 좋아요 3개', tone: 'danger' },
];

export function formatWon(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}
