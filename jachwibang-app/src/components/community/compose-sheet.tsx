import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { POST_TOPICS } from '@/data/topics';
import { useTheme } from '@/hooks/use-theme';

const MAX_LENGTH = 1000;

/** New-post form: pick a topic and write the body. */
export function ComposeSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (body: string, topic: string) => Promise<{ error: string | null }>;
}) {
  const theme = useTheme();
  const [topic, setTopic] = useState<string>(POST_TOPICS[0]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTopic(POST_TOPICS[0]);
    setBody('');
    setError(null);
  }, [visible]);

  async function submit() {
    setSaving(true);
    const { error: submitError } = await onSubmit(body, topic);
    setSaving(false);
    if (submitError) setError(submitError);
    else onClose();
  }

  return (
    <Sheet visible={visible} title="글쓰기" onClose={onClose}>
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
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={'우리 방 이야기, 자취 꿀팁, 궁금한 점을 적어보세요.'}
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  input: { minHeight: 160, borderRadius: 14, padding: Spacing.three, fontSize: 15, lineHeight: 22 },
  count: { fontSize: 12, textAlign: 'right', marginTop: -Spacing.two },
  error: { fontSize: 13, lineHeight: 19 },
});
