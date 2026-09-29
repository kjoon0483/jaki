import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Brand } from '@/constants/theme';
import { FurnitureType } from '@/data/mock';

type Pt = { x: number; y: number };

/** Darkens (negative) or lightens (positive) a hex color by `amount` (-1..1). */
function shade(hex: string, amount: number) {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c, 16);
  const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const adjust = (v: number) => (amount >= 0 ? clamp255(v + (255 - v) * amount) : clamp255(v + v * amount));
  const r = adjust((num >> 16) & 255);
  const g = adjust((num >> 8) & 255);
  const b = adjust(num & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Builds the 3 visible faces of an isometric box (top / left-front / right-front),
 * in the same 2:1 projection the room floor uses, normalized to start at (0,0).
 */
function isoBox(w: number, d: number, height: number, unitW: number, unitH: number) {
  const p = (gx: number, gy: number): Pt => ({ x: (gx - gy) * (unitW / 2), y: (gx + gy) * (unitH / 2) });
  const back = p(0, 0);
  const right = p(w, 0);
  const front = p(w, d);
  const left = p(0, d);
  const drop = (pt: Pt): Pt => ({ x: pt.x, y: pt.y + height });
  const rightDrop = drop(right);
  const leftDrop = drop(left);
  const frontDrop = drop(front);
  const all = [back, right, front, left, rightDrop, leftDrop, frontDrop];
  const minX = Math.min(...all.map((pt) => pt.x));
  const minY = Math.min(...all.map((pt) => pt.y));
  const s = (pt: Pt): Pt => ({ x: pt.x - minX, y: pt.y - minY });
  const width = Math.max(...all.map((pt) => pt.x)) - minX;
  const boxHeight = Math.max(...all.map((pt) => pt.y)) - minY;
  return {
    top: [s(back), s(right), s(front), s(left)],
    rightFace: [s(right), s(front), s(frontDrop), s(rightDrop)],
    leftFace: [s(left), s(front), s(frontDrop), s(leftDrop)],
    width,
    height: boxHeight,
  };
}

function pts(list: Pt[]) {
  return list.map((p) => `${p.x},${p.y}`).join(' ');
}

/** Point at fraction `t` down a face's vertical edge (top corner -> its dropped corner). */
function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function IsoBoxShape({
  box,
  color,
  strokeColor,
}: {
  box: ReturnType<typeof isoBox>;
  color: string;
  strokeColor: string;
}) {
  return (
    <>
      <Polygon points={pts(box.rightFace)} fill={shade(color, -0.1)} stroke={strokeColor} strokeWidth={1} />
      <Polygon points={pts(box.leftFace)} fill={shade(color, -0.32)} stroke={strokeColor} strokeWidth={1} />
      <Polygon points={pts(box.top)} fill={shade(color, 0.16)} stroke={strokeColor} strokeWidth={1} />
    </>
  );
}

const SOFA = isoBox(2, 1.05, 20, 26, 13);
const SOFA_BACK = isoBox(2, 0.35, 15, 26, 13);
const BED = isoBox(1.3, 2, 15, 26, 13);
const BED_PILLOW = isoBox(1.1, 0.55, 8, 22, 11);
const ARMCHAIR = isoBox(1.15, 1.1, 19, 26, 13);
const BOOKSHELF = isoBox(1.6, 0.42, 27, 26, 13);
const RUG_BOX = isoBox(2.5, 1.7, 2, 26, 13);
const POT = isoBox(0.62, 0.62, 9, 22, 11);
const LAMP_BASE = isoBox(0.5, 0.5, 3, 20, 10);

const PAD = 4;

export function furnitureSize(type: FurnitureType): { w: number; h: number } {
  switch (type) {
    case 'sofa':
      return { w: SOFA.width + PAD * 2, h: SOFA.height + SOFA_BACK.height * 0.55 + PAD * 2 };
    case 'bed':
      return { w: BED.width + PAD * 2, h: BED.height + PAD * 2 };
    case 'armchair':
      return { w: ARMCHAIR.width + PAD * 2, h: ARMCHAIR.height + PAD * 2 };
    case 'table':
      return { w: 46, h: 40 };
    case 'lamp':
      return { w: 30, h: 46 };
    case 'rug':
      return { w: RUG_BOX.width + PAD * 2, h: RUG_BOX.height + PAD * 2 };
    case 'plant':
      return { w: 34, h: 46 };
    case 'bookshelf':
      return { w: BOOKSHELF.width + PAD * 2, h: BOOKSHELF.height + PAD * 2 };
  }
}

export function FurnitureIcon({ type }: { type: FurnitureType }) {
  const { w, h } = furnitureSize(type);
  const stroke = Brand.deepGreen;

  if (type === 'sofa') {
    const backY = h - SOFA.height - PAD - SOFA_BACK.height * 0.55;
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Ellipse cx={w / 2} cy={h - 3} rx={w / 2 - 3} ry={3} fill="#000000" opacity={0.12} />
        <PolyGroup x={PAD} y={backY}>
          <IsoBoxShape box={SOFA_BACK} color={Brand.cream} strokeColor={stroke} />
        </PolyGroup>
        <PolyGroup x={PAD} y={h - SOFA.height - PAD}>
          <IsoBoxShape box={SOFA} color={Brand.sage} strokeColor={stroke} />
          <Polygon
            points={pts([
              lerp(SOFA.top[0], SOFA.top[3], 0.5),
              lerp(SOFA.top[1], SOFA.top[2], 0.5),
            ])}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        </PolyGroup>
      </Svg>
    );
  }

  if (type === 'bed') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Ellipse cx={w / 2} cy={h - 2} rx={w / 2 - 3} ry={2.5} fill="#000000" opacity={0.12} />
        <PolyGroup x={PAD} y={PAD}>
          <IsoBoxShape box={BED} color={Brand.sage} strokeColor={stroke} />
        </PolyGroup>
        <PolyGroup x={PAD + (BED.width - BED_PILLOW.width) / 2} y={PAD - BED_PILLOW.height * 0.35}>
          <IsoBoxShape box={BED_PILLOW} color="#FFFFFF" strokeColor={stroke} />
        </PolyGroup>
      </Svg>
    );
  }

  if (type === 'armchair') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Ellipse cx={w / 2} cy={h - 3} rx={w / 2 - 3} ry={3} fill="#000000" opacity={0.12} />
        <PolyGroup x={PAD} y={PAD}>
          <IsoBoxShape box={ARMCHAIR} color={Brand.terracotta} strokeColor={stroke} />
        </PolyGroup>
      </Svg>
    );
  }

  if (type === 'table') {
    const rx = w / 2 - 3;
    const ry = rx * 0.5;
    const height = 14;
    const cx = w / 2;
    const cy = ry + 3;
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Ellipse cx={cx} cy={cy + height + ry * 0.6} rx={rx} ry={ry * 0.7} fill="#000000" opacity={0.12} />
        <Rect x={cx - rx} y={cy} width={rx * 2} height={height} fill={shade(Brand.terracotta, -0.22)} />
        <Ellipse cx={cx} cy={cy + height} rx={rx} ry={ry} fill={shade(Brand.terracotta, -0.22)} />
        <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={shade(Brand.terracotta, 0.12)} stroke={stroke} strokeWidth={1} />
        <Ellipse cx={cx} cy={cy} rx={rx * 0.6} ry={ry * 0.6} fill="none" stroke={stroke} strokeOpacity={0.25} strokeWidth={1} />
      </Svg>
    );
  }

  if (type === 'lamp') {
    const baseY = h - LAMP_BASE.height - 2;
    const poleX = w / 2;
    const poleTopY = baseY - 26;
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Ellipse cx={w / 2} cy={h - 1.5} rx={w / 2 - 5} ry={2} fill="#000000" opacity={0.12} />
        <PolyGroup x={(w - LAMP_BASE.width) / 2} y={baseY}>
          <IsoBoxShape box={LAMP_BASE} color={Brand.bark} strokeColor={stroke} />
        </PolyGroup>
        <Rect x={poleX - 1.5} y={poleTopY} width={3} height={baseY - poleTopY + 4} fill={Brand.bark} />
        <Path
          d={`M${poleX - 13} ${poleTopY} L${poleX + 13} ${poleTopY} L${poleX + 9} ${poleTopY - 14} L${poleX - 9} ${poleTopY - 14} Z`}
          fill={shade(Brand.terracotta, 0.2)}
          stroke={stroke}
          strokeWidth={1}
        />
        <Circle cx={poleX} cy={poleTopY - 2} r={2} fill="#FFF6DE" opacity={0.95} />
      </Svg>
    );
  }

  if (type === 'rug') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <PolyGroup x={PAD} y={PAD}>
          <IsoBoxShape box={RUG_BOX} color={Brand.terracotta} strokeColor={stroke} />
          <Polygon
            points={pts([
              lerp(RUG_BOX.top[0], RUG_BOX.top[1], 0.12),
              lerp(RUG_BOX.top[0], RUG_BOX.top[3], 0.12),
              lerp(RUG_BOX.top[2], RUG_BOX.top[3], 0.12),
              lerp(RUG_BOX.top[2], RUG_BOX.top[1], 0.12),
            ])}
            fill="none"
            stroke={Brand.cream}
            strokeWidth={1.5}
            opacity={0.8}
          />
        </PolyGroup>
      </Svg>
    );
  }

  if (type === 'plant') {
    const potY = h - POT.height - 2;
    const potCx = (w - POT.width) / 2 + POT.width / 2;
    const foliageY = potY - 12;
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Ellipse cx={w / 2} cy={h - 1.5} rx={w / 2 - 6} ry={2} fill="#000000" opacity={0.12} />
        <PolyGroup x={(w - POT.width) / 2} y={potY}>
          <IsoBoxShape box={POT} color={Brand.terracotta} strokeColor={stroke} />
        </PolyGroup>
        <Circle cx={potCx} cy={foliageY} r={10} fill={Brand.sage} stroke={stroke} strokeWidth={1} />
        <Circle cx={potCx - 7} cy={foliageY + 5} r={6.5} fill={Brand.bark} stroke={stroke} strokeWidth={1} />
        <Circle cx={potCx + 7} cy={foliageY + 5} r={6.5} fill={Brand.bark} stroke={stroke} strokeWidth={1} />
        <Circle cx={potCx - 3} cy={foliageY - 4} r={3} fill="#ffffff" opacity={0.22} />
      </Svg>
    );
  }

  const shelfY = PAD;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Ellipse cx={w / 2} cy={h - 2} rx={w / 2 - 3} ry={2} fill="#000000" opacity={0.12} />
      <PolyGroup x={PAD} y={shelfY}>
        <IsoBoxShape box={BOOKSHELF} color={Brand.bark} strokeColor={stroke} />
        {[0.28, 0.55, 0.8].map((t, i) => (
          <Polygon
            key={i}
            points={pts([
              lerp(BOOKSHELF.leftFace[0], BOOKSHELF.leftFace[3], t),
              lerp(BOOKSHELF.leftFace[1], BOOKSHELF.leftFace[2], t),
              lerp(BOOKSHELF.rightFace[0], BOOKSHELF.rightFace[3], t),
            ])}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
        ))}
      </PolyGroup>
    </Svg>
  );
}

/** Groups children under a translate offset, using SVG's native <G transform>. */
function PolyGroup({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return <G transform={`translate(${x}, ${y})`}>{children}</G>;
}
