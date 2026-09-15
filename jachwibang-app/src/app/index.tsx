import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatWon, recentActivity, savedThisMonth, totalThisMonth } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>안녕하세요, 현곤님</Text>
        <Text style={[styles.pageTitle, { color: theme.text }]}>오늘의 자취방</Text>

        <View style={styles.cardRow}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="wallet-outline" size={20} color={theme.accent} />
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>이번 달 지출</Text>
            <Text style={[styles.cardValue, { color: theme.text }]}>{formatWon(totalThisMonth)}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="leaf-outline" size={20} color={theme.accent} />
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>이번 달 절약</Text>
            <Text style={[styles.cardValue, { color: theme.text }]}>{formatWon(savedThisMonth)}</Text>
            <View style={styles.trendRow}>
              <Ionicons name="trending-down-outline" size={13} color={theme.success} />
              <Text style={[styles.trendText, { color: theme.success }]}>지난달보다 11%</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>최근 활동</Text>
        <View style={{ gap: Spacing.two }}>
          {recentActivity.map((item, i) => (
            <View key={i} style={styles.activityRow}>
              <Ionicons name={item.icon as never} size={15} color={theme[item.tone]} />
              <Text style={[styles.activityText, { color: theme.text }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  greeting: {
    fontSize: 13,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardLabel: {
    fontSize: 12,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 11,
  },
  sectionLabel: {
    fontSize: 13,
    marginTop: Spacing.two,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  activityText: {
    fontSize: 13,
  },
});
