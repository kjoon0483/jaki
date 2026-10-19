import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_ITEMS = [
  { name: 'index', href: '/', label: '홈', icon: 'home-outline' },
  { name: 'budget', href: '/budget', label: '가계부', icon: 'wallet-outline' },
  { name: 'room', href: '/room', label: '3D 배치', icon: 'cube-outline' },
  { name: 'community', href: '/community', label: '커뮤니티', icon: 'people-outline' },
  { name: 'mypage', href: '/mypage', label: '마이', icon: 'person-outline' },
] as const;

export default function AppTabs() {
  const theme = useTheme();
  // 3D 1인칭으로 걷는 동안(room-simulator.web.tsx 가 알려 준다)에는 아래 탭을 숨겨 화면 전체를 쓴다.
  const [walking, setWalking] = useState(() => typeof document !== 'undefined' && document.body.dataset.walking === '1');
  useEffect(() => {
    const update = () => setWalking(document.body.dataset.walking === '1');
    window.addEventListener('oneroom-walk', update);
    return () => window.removeEventListener('oneroom-walk', update);
  }, []);
  return (
    <View style={[styles.page, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.phone, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Tabs style={styles.tabsRoot}>
          <TabSlot style={styles.slot} />
          <TabList style={[styles.tabList, { borderColor: theme.border, backgroundColor: theme.background }, walking && styles.hidden]}>
            {TAB_ITEMS.map((item) => (
              <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
                <TabButton label={item.label} icon={item.icon} />
              </TabTrigger>
            ))}
          </TabList>
        </Tabs>
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;
  return (
    <Pressable {...props} style={styles.tabButton}>
      <View style={[styles.tabIconWrap, isFocused && { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={[styles.tabLabel, { color }, isFocused && styles.tabLabelFocused]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  tabsRoot: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  slot: {
    flex: 1,
  },
  tabList: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Spacing.one,
  },
  tabIconWrap: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});
