import Svg, { Circle, Rect } from 'react-native-svg';

import { Brand } from '@/constants/theme';
import { FurnitureType } from '@/data/mock';

const SIZE: Record<FurnitureType, { w: number; h: number }> = {
  sofa: { w: 56, h: 38 },
  bed: { w: 40, h: 54 },
  armchair: { w: 38, h: 38 },
  table: { w: 40, h: 40 },
};

export function furnitureSize(type: FurnitureType) {
  return SIZE[type];
}

export function FurnitureIcon({ type }: { type: FurnitureType }) {
  const { w, h } = SIZE[type];

  if (type === 'sofa') {
    return (
      <Svg width={w} height={h} viewBox="0 0 56 38">
        <Rect x={2} y={10} width={52} height={26} rx={8} fill={Brand.sage} stroke={Brand.deepGreen} strokeWidth={1.5} />
        <Rect x={2} y={2} width={52} height={12} rx={6} fill={Brand.cream} stroke={Brand.deepGreen} strokeWidth={1} />
        <Rect x={6} y={14} width={20} height={18} rx={4} fill="#ffffff" opacity={0.35} />
        <Rect x={30} y={14} width={20} height={18} rx={4} fill="#ffffff" opacity={0.35} />
      </Svg>
    );
  }
  if (type === 'bed') {
    return (
      <Svg width={w} height={h} viewBox="0 0 40 54">
        <Rect x={1} y={1} width={38} height={52} rx={6} fill={Brand.sage} stroke={Brand.deepGreen} strokeWidth={1.5} />
        <Rect x={5} y={5} width={30} height={12} rx={4} fill={Brand.cream} />
        <Rect x={5} y={34} width={30} height={1.5} fill={Brand.deepGreen} opacity={0.4} />
      </Svg>
    );
  }
  if (type === 'armchair') {
    return (
      <Svg width={w} height={h} viewBox="0 0 38 38">
        <Rect x={5} y={10} width={28} height={24} rx={6} fill={Brand.terracotta} stroke={Brand.deepGreen} strokeWidth={1.5} />
        <Rect x={5} y={2} width={28} height={10} rx={5} fill={Brand.cream} />
        <Rect x={1} y={11} width={6} height={18} rx={3} fill={Brand.bark} />
        <Rect x={31} y={11} width={6} height={18} rx={3} fill={Brand.bark} />
      </Svg>
    );
  }
  return (
    <Svg width={w} height={h} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={18} fill={Brand.cream} stroke={Brand.deepGreen} strokeWidth={1.5} />
      <Circle cx={20} cy={20} r={12} fill="none" stroke={Brand.deepGreen} strokeOpacity={0.25} strokeWidth={1} />
    </Svg>
  );
}
