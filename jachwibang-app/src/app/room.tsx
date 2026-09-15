import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FurnitureIcon, furnitureSize } from '@/components/furniture-icon';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { FurnitureType, PlacedFurniture } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/state/app-state';

const TRAY: { type: FurnitureType; label: string }[] = [
  { type: 'sofa', label: '소파' },
  { type: 'bed', label: '침대' },
  { type: 'armchair', label: '안락의자' },
  { type: 'table', label: '테이블' },
];

const SPAWN_SPOTS = [
  { x: 30, y: 35 },
  { x: 50, y: 35 },
  { x: 70, y: 35 },
  { x: 30, y: 65 },
  { x: 50, y: 65 },
  { x: 70, y: 65 },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function RoomScreen() {
  const theme = useTheme();
  const { roomFurniture, setRoomFurniture, setPosts } = useAppState();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const idCounter = useRef(roomFurniture.length);
  const floorSize = useRef({ width: 1, height: 1 });

  function onFloorLayout(e: LayoutChangeEvent) {
    floorSize.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
  }

  function addFurniture(type: FurnitureType) {
    if (roomFurniture.length >= 8) return;
    idCounter.current += 1;
    const spot = SPAWN_SPOTS[roomFurniture.length % SPAWN_SPOTS.length];
    const next: PlacedFurniture = { id: idCounter.current, type, x: spot.x, y: spot.y, rotation: 0 };
    setRoomFurniture((prev) => [...prev, next]);
    setSelectedId(next.id);
  }

  function rotateItem(id: number) {
    setRoomFurniture((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 45) % 360 } : p))
    );
  }

  function deleteItem(id: number) {
    setRoomFurniture((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function resetRoom() {
    setRoomFurniture([]);
    setSelectedId(null);
  }

  function shareToCommunity() {
    setPosts((prev) => [
      {
        id: (prev[0]?.id ?? 0) + 1,
        author: '나 (현곤)',
        liked: false,
        likes: 0,
        comments: [],
        placed: roomFurniture.map((p, i) => ({ ...p, id: i + 1 })),
      },
      ...prev,
    ]);
    setShared(true);
    setTimeout(() => setShared(false), 1200);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>3D 가구 배치</Text>

        <View
          onLayout={onFloorLayout}
          style={[styles.floor, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => setSelectedId(null)}>
          {roomFurniture.map((item) => (
            <FurnitureItem
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              floorSize={floorSize}
              accent={theme.accent}
              cardBg={theme.background}
              onSelect={setSelectedId}
              onMove={(x, y) =>
                setRoomFurniture((prev) => prev.map((p) => (p.id === item.id ? { ...p, x, y } : p)))
              }
              onRotate={() => rotateItem(item.id)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
          {roomFurniture.length === 0 && (
            <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
              아래에서 가구를 눌러 방을 채워보세요
            </Text>
          )}
        </View>

        <View style={styles.trayHeaderRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>가구 라이브러리</Text>
          <Pressable onPress={resetRoom} style={styles.resetBtn}>
            <Ionicons name="refresh-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.muted, { color: theme.textSecondary }]}>초기화</Text>
          </Pressable>
        </View>

        <View style={styles.trayRow}>
          {TRAY.map((t) => (
            <Pressable
              key={t.type}
              onPress={() => addFurniture(t.type)}
              style={[styles.trayButton, { backgroundColor: theme.backgroundElement }]}>
              <FurnitureIcon type={t.type} />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          가구를 드래그해서 옮기고, 탭하면 회전·삭제 버튼이 나와요
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.backgroundElement }]}
            onPress={() => Alert.alert('저장 완료', '배치안을 저장했어요.')}>
            <Text style={[styles.actionText, { color: theme.text }]}>배치안 저장하기</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.accent, flexDirection: 'row', gap: 6 }]}
            onPress={shareToCommunity}>
            <Ionicons name={shared ? 'checkmark' : 'share-social-outline'} size={14} color={theme.onAccent} />
            <Text style={[styles.actionText, { color: theme.onAccent }]}>
              {shared ? '공유완료' : '커뮤니티에 공유'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FurnitureItem({
  item,
  selected,
  floorSize,
  accent,
  cardBg,
  onSelect,
  onMove,
  onRotate,
  onDelete,
}: {
  item: PlacedFurniture;
  selected: boolean;
  floorSize: React.MutableRefObject<{ width: number; height: number }>;
  accent: string;
  cardBg: string;
  onSelect: (id: number) => void;
  onMove: (x: number, y: number) => void;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const startRef = useRef({ x: item.x, y: item.y });
  const size = furnitureSize(item.type);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        startRef.current = { x: item.x, y: item.y };
      },
      onPanResponderMove: (_, gesture) => {
        const { width, height } = floorSize.current;
        const nextX = clamp(startRef.current.x + (gesture.dx / width) * 100, 6, 94);
        const nextY = clamp(startRef.current.y + (gesture.dy / height) * 100, 6, 94);
        onMove(nextX, nextY);
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) < 4 && Math.abs(gesture.dy) < 4) {
          onSelect(item.id);
        }
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.itemWrap,
        { left: `${item.x}%`, top: `${item.y}%`, marginLeft: -size.w / 2, marginTop: -size.h / 2 },
      ]}>
      {selected && (
        <View style={styles.controls}>
          <Pressable onPress={onRotate} style={[styles.controlBtn, { backgroundColor: cardBg }]}>
            <Ionicons name="reload-outline" size={12} color={accent} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.controlBtn, { backgroundColor: cardBg }]}>
            <Ionicons name="close" size={12} color={accent} />
          </Pressable>
        </View>
      )}
      <View
        style={[
          styles.iconFrame,
          selected && { borderColor: accent },
          { transform: [{ rotate: `${item.rotation}deg` }] },
        ]}>
        <FurnitureIcon type={item.type} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flex: 1,
  },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  floor: {
    height: 260,
    borderRadius: Spacing.three,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  emptyHint: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    fontSize: 12,
  },
  itemWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFrame: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  controls: {
    position: 'absolute',
    top: -26,
    flexDirection: 'row',
    gap: 4,
    zIndex: 5,
  },
  controlBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: 12 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trayRow: { flexDirection: 'row', gap: Spacing.two },
  trayButton: {
    width: 52,
    height: 52,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 10 },
  actionRow: { flexDirection: 'row', gap: Spacing.two, marginTop: 'auto' },
  actionBtn: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});
