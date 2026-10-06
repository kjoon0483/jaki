import { useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { RoomData } from '@/components/room/sim-bridge';
import { useTheme } from '@/hooks/use-theme';

type Bounds = { xMin: number; xMax: number; zMin: number; zMax: number };
type PlanItem = { x: number; z: number; w: number; d: number; a?: number; t?: string; c?: string[] };

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Still preview of a shared room: the photo taken when it was saved, or, for rooms saved before
 * photos existed, a top-down floor plan drawn from the furniture positions.
 */
export function RoomPreview({ room, style }: { room: RoomData; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const thumb = typeof room.thumb === 'string' && room.thumb.startsWith('data:image/') ? room.thumb : null;
  return (
    <View style={[styles.frame, { backgroundColor: theme.backgroundSelected }, style]}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <FloorPlan room={room} />
      )}
    </View>
  );
}

function FloorPlan({ room }: { room: RoomData }) {
  const theme = useTheme();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const R = room.R as Bounds | undefined;
  const items = (Array.isArray(room.items) ? room.items : []) as PlanItem[];
  const rw = R ? R.xMax - R.xMin : 0;
  const rd = R ? R.zMax - R.zMin : 0;

  // Fit the room rectangle inside the frame with a small margin.
  let plan: { w: number; h: number } | null = null;
  if (box && rw > 0 && rd > 0) {
    const scale = Math.min((box.w * 0.86) / rw, (box.h * 0.86) / rd);
    plan = { w: rw * scale, h: rd * scale };
  }
  const floor = typeof room.wall === 'string' && HEX.test(room.wall) ? room.wall : theme.background;

  return (
    <View style={styles.planWrap} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {plan && R ? (
        <View style={[styles.plan, { width: plan.w, height: plan.h, backgroundColor: floor, borderColor: theme.text }]}>
          {items.map((it, i) => {
            if (![it.x, it.z, it.w, it.d].every(Number.isFinite)) return null;
            const isWall = it.t === 'wall';
            const color = isWall ? theme.text : it.c?.find((c) => HEX.test(c)) ?? theme.accent;
            return (
              <View
                key={i}
                style={[
                  styles.item,
                  {
                    left: `${((it.x - it.w / 2 - R.xMin) / rw) * 100}%`,
                    top: `${((it.z - it.d / 2 - R.zMin) / rd) * 100}%`,
                    width: `${(it.w / rw) * 100}%`,
                    height: `${(it.d / rd) * 100}%`,
                    backgroundColor: color,
                    opacity: isWall ? 0.85 : 0.75,
                    borderColor: theme.text,
                    transform: [{ rotate: `${it.a ?? 0}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, overflow: 'hidden' },
  planWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  plan: { borderWidth: 2, borderRadius: 2 },
  item: { position: 'absolute', borderWidth: StyleSheet.hairlineWidth, borderRadius: 2 },
});
