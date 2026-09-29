import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoomSimulator } from '@/components/room/room-simulator';
import type { RoomData } from '@/components/room/sim-bridge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Full-screen, view-only 3D room (3rd-person orbit, top view and 1st-person walk; no editing). */
export function RoomViewer({
  room,
  title,
  subtitle,
  onClose,
}: {
  room: RoomData | null;
  title: string;
  subtitle?: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible={!!room} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
            <Ionicons name="chevron-down" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.titles}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="eye-outline" size={13} color={theme.accent} />
            <Text style={[styles.badgeText, { color: theme.accent }]}>보기 전용</Text>
          </View>
        </View>
        {room ? <RoomSimulator readonly initialState={room} /> : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titles: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
