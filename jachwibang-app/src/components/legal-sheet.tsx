import { StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { EFFECTIVE_DATE, LegalDoc } from '@/data/legal';
import { useTheme } from '@/hooks/use-theme';

/** Shows the terms of service or the privacy policy. */
export function LegalSheet({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const theme = useTheme();
  return (
    <Sheet visible={!!doc} title={doc?.title ?? ''} onClose={onClose}>
      {doc?.sections.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={[styles.heading, { color: theme.text }]}>{s.heading}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{s.body}</Text>
        </View>
      ))}
      <Text style={[styles.date, { color: theme.textSecondary }]}>시행일: {EFFECTIVE_DATE}</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: 4 },
  heading: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 20 },
  date: { fontSize: 12, marginTop: 4, marginBottom: 8 },
});
