import type Ionicons from '@expo/vector-icons/Ionicons';

export const EXPENSE_CATEGORIES = [
  { key: '식비', icon: 'restaurant-outline' },
  { key: '카페·간식', icon: 'cafe-outline' },
  { key: '월세·관리비', icon: 'business-outline' },
  { key: '공과금', icon: 'flash-outline' },
  { key: '생활용품', icon: 'basket-outline' },
  { key: '교통', icon: 'bus-outline' },
  { key: '쇼핑', icon: 'bag-handle-outline' },
  { key: '기타', icon: 'ellipsis-horizontal-circle-outline' },
] as const satisfies readonly { key: string; icon: keyof typeof Ionicons.glyphMap }[];

export const INCOME_CATEGORIES = [
  { key: '월급', icon: 'briefcase-outline' },
  { key: '알바', icon: 'time-outline' },
  { key: '용돈', icon: 'gift-outline' },
  { key: '장학금·지원금', icon: 'school-outline' },
  { key: '기타 수입', icon: 'add-circle-outline' },
] as const satisfies readonly { key: string; icon: keyof typeof Ionicons.glyphMap }[];

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['key'];

export function categoryIcon(key: string): keyof typeof Ionicons.glyphMap {
  return (
    [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.key === key)?.icon ??
    'ellipsis-horizontal-circle-outline'
  );
}
