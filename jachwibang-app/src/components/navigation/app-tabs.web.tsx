import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const TAB_ITEMS = [
  { name: 'index', href: '/', label: '홈', icon: 'home-outline' },
  { name: 'budget', href: '/budget', label: '가계부', icon: 'wallet-outline' },
  { name: 'room', href: '/room', label: '3D 배치', icon: 'cube-outline' },
  { name: 'community', href: '/community', label: '커뮤니티', icon: 'people-outline' },
  { name: 'mypage', href: '/mypage', label: '마이', icon: 'person-outline' },
] as const;

export default function AppTabs() {
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <Tabs style={styles.tabsRoot}>
          <TabSlot style={styles.slot} />
          <TabList style={styles.tabList}>
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
  const color = isFocused ? Colors.light.accent : Colors.light.textSecondary;
  return (
    <Pressable {...props} style={styles.tabButton}>
      <View style={[styles.tabIconWrap, isFocused && { backgroundColor: Colors.light.backgroundSelected }]}>
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
    backgroundColor: Colors.light.backgroundElement,
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: Colors.light.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.light.border,
  },
  tabsRoot: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  tabList: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
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
