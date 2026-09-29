import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Standard tab screen: safe area, scroll, centered max-width column and a page header. */
export function Screen({
  title,
  eyebrow,
  right,
  children,
}: PropsWithChildren<{ title: string; eyebrow?: string; right?: ReactNode }>) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {eyebrow ? <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text> : null}
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.three },
  headerText: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 13 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
});
