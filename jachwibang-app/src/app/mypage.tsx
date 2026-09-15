import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MENU = [
  { label: '프로필 수정', icon: 'person-outline' },
  { label: '알림 설정', icon: 'notifications-outline' },
] as const;

export default function MyPageScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>마이페이지</Text>

        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>현</Text>
          </View>
          <View>
            <Text style={[styles.name, { color: theme.text }]}>이현곤</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>hyungon@example.com</Text>
          </View>
        </View>

        <View style={[styles.menuBox, { backgroundColor: theme.backgroundElement }]}>
          {MENU.map((item, i) => (
            <Pressable
              key={item.label}
              style={[styles.menuRow, i < MENU.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={() => Alert.alert(item.label, '준비 중인 기능이에요.')}>
              <View style={styles.menuLabel}>
                <Ionicons name={item.icon} size={16} color={theme.text} />
                <Text style={[styles.menuText, { color: theme.text }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
            </Pressable>
          ))}
          <Pressable
            style={styles.menuRow}
            onPress={() => Alert.alert('로그아웃', '로그아웃 기능은 준비 중이에요.')}>
            <Text style={[styles.menuText, { color: theme.danger }]}>로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  email: { fontSize: 12, marginTop: 2 },
  menuBox: { borderRadius: Spacing.three, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  menuLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  menuText: { fontSize: 13 },
});
