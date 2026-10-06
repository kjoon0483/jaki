import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComposeSheet } from '@/components/community/compose-sheet';
import { RoomSimulator } from '@/components/room/room-simulator';
import { RoomsSheet } from '@/components/room/rooms-sheet';
import { SaveRoomSheet } from '@/components/room/save-room-sheet';
import type { RoomSimulatorHandle } from '@/components/room/sim-bridge';
import { Spacing } from '@/constants/theme';
import { useRooms } from '@/hooks/use-rooms';
import { useTheme } from '@/hooks/use-theme';
import { AttachedRoom, insertPost } from '@/lib/community';
import { confirmAsync, notify } from '@/lib/confirm';
import { useAuth } from '@/state/auth-state';

export default function RoomScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const sim = useRef<RoomSimulatorHandle>(null);
  const { rooms, loading, error, saveRoom, deleteRoom } = useRooms();

  // The saved room currently open in the editor (null = not saved yet).
  const [current, setCurrent] = useState<{ id: string; name: string } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareRoom, setShareRoom] = useState<AttachedRoom | null>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 2200);
    return () => clearTimeout(t);
  }, [status]);

  async function snapshot() {
    try {
      return await sim.current!.serialize({ thumb: true });
    } catch (e) {
      notify('방을 읽지 못했어요', (e as Error).message);
      return null;
    }
  }

  async function saveTo(name: string, id?: string) {
    const data = await snapshot();
    if (!data) return { error: '3D 화면에서 방을 읽지 못했어요.' };
    const { room, error: saveError } = await saveRoom(name, data, id);
    if (saveError || !room) return { error: saveError ?? '저장하지 못했어요.' };
    setCurrent({ id: room.id, name: room.name });
    setStatus('저장했어요');
    return { error: null };
  }

  async function onSavePress() {
    if (!current) {
      setSaveOpen(true);
      return;
    }
    setBusy('save');
    const { error: saveError } = await saveTo(current.name, current.id);
    setBusy(null);
    if (saveError) notify('저장하지 못했어요', saveError);
  }

  async function onSharePress() {
    setBusy('share');
    const data = await snapshot();
    setBusy(null);
    if (data) setShareRoom({ name: current?.name ?? '내 방', data });
  }

  async function onDelete(room: { id: string; name: string }) {
    if (!(await confirmAsync('방 삭제', `'${room.name}'을(를) 삭제할까요? 이미 커뮤니티에 공유한 글은 그대로 남아요.`, '삭제'))) return;
    const { error: deleteError } = await deleteRoom(room.id);
    if (deleteError) notify('삭제하지 못했어요', deleteError);
    else if (current?.id === room.id) setCurrent(null);
  }

  async function onNew() {
    if (!(await confirmAsync('새 방', '기본 방으로 새로 시작할까요? 저장하지 않은 변경은 사라져요.', '새로 시작'))) return;
    sim.current?.reset();
    setCurrent(null);
    setListOpen(false);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <Pressable
          style={[styles.roomPicker, { backgroundColor: theme.backgroundElement }]}
          onPress={() => setListOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="내 방 목록">
          <Ionicons name="cube-outline" size={16} color={theme.accent} />
          <Text style={[styles.roomName, { color: theme.text }]} numberOfLines={1}>
            {status ?? current?.name ?? '저장 안 된 방'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          style={[styles.toolBtn, { backgroundColor: theme.backgroundElement }]}
          onPress={onSavePress}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel="저장">
          {busy === 'save' ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <>
              <Ionicons name="save-outline" size={16} color={theme.text} />
              <Text style={[styles.toolText, { color: theme.text }]}>저장</Text>
            </>
          )}
        </Pressable>
        <Pressable
          style={[styles.toolBtn, { backgroundColor: theme.accent }]}
          onPress={onSharePress}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel="커뮤니티에 공유">
          {busy === 'share' ? (
            <ActivityIndicator size="small" color={theme.onAccent} />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={16} color={theme.onAccent} />
              <Text style={[styles.toolText, { color: theme.onAccent }]}>공유</Text>
            </>
          )}
        </Pressable>
      </View>

      <RoomSimulator ref={sim} />

      <RoomsSheet
        visible={listOpen}
        rooms={rooms}
        loading={loading}
        error={error}
        currentId={current?.id ?? null}
        onClose={() => setListOpen(false)}
        onOpen={(r) => {
          sim.current?.load(r.data);
          setCurrent({ id: r.id, name: r.name });
          setListOpen(false);
        }}
        onShare={(r) => {
          setListOpen(false);
          setShareRoom({ name: r.name, data: r.data });
        }}
        onDelete={onDelete}
        onNew={onNew}
      />
      <SaveRoomSheet
        visible={saveOpen}
        defaultName={`내 방 ${rooms.length + 1}`}
        onClose={() => setSaveOpen(false)}
        onSave={(name) => saveTo(name)}
      />
      <ComposeSheet
        visible={!!shareRoom}
        fixedRoom={shareRoom}
        onClose={() => setShareRoom(null)}
        onSubmit={async (body, topic, room) => {
          if (!session) return { error: '로그인이 필요해요.' };
          const { error: postError } = await insertPost(session.user.id, body, topic, room);
          if (!postError) setStatus('커뮤니티에 올렸어요');
          return { error: postError };
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  roomPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
  },
  roomName: { flex: 1, fontSize: 14, fontWeight: '700' },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 38,
    minWidth: 66,
    borderRadius: 12,
  },
  toolText: { fontSize: 13, fontWeight: '700' },
});
