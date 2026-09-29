import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { POST_TOPICS } from '@/data/topics';
import { useRooms } from '@/hooks/use-rooms';
import { useTheme } from '@/hooks/use-theme';
import type { AttachedRoom } from '@/lib/community';

const MAX_LENGTH = 1000;

/**
 * New-post form: topic, body and optionally one of my saved 3D rooms.
 * With `fixedRoom` (sharing straight from the 3D tab) that room is attached and the picker is hidden.
 */
export function ComposeSheet({
  visible,
  onClose,
  onSubmit,
  fixedRoom,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (body: string, topic: string, room: AttachedRoom | null) => Promise<{ error: string | null }>;
  fixedRoom?: AttachedRoom | null;
}) {
  const theme = useTheme();
  const { rooms, loading: roomsLoading, error: roomsError } = useRooms(visible && !fixedRoom);
  const [topic, setTopic] = useState<string>(POST_TOPICS[0]);
  const [body, setBody] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTopic(POST_TOPICS[0]);
    setBody('');
    setRoomId(null);
    setError(null);
  }, [visible]);

  const picked = rooms.find((r) => r.id === roomId);
  const attached: AttachedRoom | null = fixedRoom ?? (picked ? { name: picked.name, data: picked.data } : null);

  async function submit() {
    setSaving(true);
    const { error: submitError } = await onSubmit(body, topic, attached);
    setSaving(false);
    if (submitError) setError(submitError);
    else onClose();
  }

  return (
    <Sheet visible={visible} title={fixedRoom ? '내 방 공유하기' : '글쓰기'} onClose={onClose}>
      <View style={styles.chips}>
        {POST_TOPICS.map((t) => {
          const active = t === topic;
          return (
            <Pressable
              key={t}
              onPress={() => setTopic(t)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, { backgroundColor: active ? theme.accent : theme.backgroundElement }]}>
              <Text style={[styles.chipText, { color: active ? theme.onAccent : theme.text }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      {fixedRoom ? (
        <View style={[styles.roomCard, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="cube-outline" size={18} color={theme.accent} />
          <Text style={[styles.roomName, { color: theme.text }]} numberOfLines={1}>
            {fixedRoom.name}
          </Text>
          <Text style={[styles.roomHint, { color: theme.textSecondary }]}>3D 방 첨부됨</Text>
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>내 방 첨부 (선택)</Text>
          {roomsError ? (
            <Text style={[styles.roomHint, { color: theme.danger }]}>{roomsError}</Text>
          ) : rooms.length === 0 ? (
            <Text style={[styles.roomHint, { color: theme.textSecondary }]}>
              {roomsLoading ? '불러오는 중…' : '3D 배치 탭에서 방을 저장하면 여기서 첨부할 수 있어요.'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomRow}>
              {[{ id: null, name: '첨부 안 함' }, ...rooms].map((r) => {
                const active = r.id === roomId;
                return (
                  <Pressable
                    key={r.id ?? 'none'}
                    onPress={() => setRoomId(r.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, styles.roomChip, { backgroundColor: active ? theme.accent : theme.backgroundElement }]}>
                    {r.id ? <Ionicons name="cube-outline" size={14} color={active ? theme.onAccent : theme.text} /> : null}
                    <Text style={[styles.chipText, { color: active ? theme.onAccent : theme.text }]}>{r.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={fixedRoom ? '우리 방을 소개해주세요. 어떤 점이 마음에 드나요?' : '우리 방 이야기, 자취 꿀팁, 궁금한 점을 적어보세요.'}
        placeholderTextColor={theme.textSecondary}
        multiline
        autoFocus
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
        accessibilityLabel="글 내용"
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />
      <Text style={[styles.count, { color: theme.textSecondary }]}>
        {body.length} / {MAX_LENGTH}
      </Text>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="올리기" onPress={submit} loading={saving} disabled={!body.trim()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  roomRow: { flexDirection: 'row', gap: Spacing.two },
  roomChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 14 },
  roomName: { flex: 1, fontSize: 14, fontWeight: '700' },
  roomHint: { fontSize: 12, lineHeight: 18 },
  input: { minHeight: 140, borderRadius: 14, padding: Spacing.three, fontSize: 15, lineHeight: 22 },
  count: { fontSize: 12, textAlign: 'right', marginTop: -Spacing.two },
  error: { fontSize: 13, lineHeight: 19 },
});
