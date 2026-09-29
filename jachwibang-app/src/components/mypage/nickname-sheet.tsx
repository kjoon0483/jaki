import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_NICKNAME_LEN, nicknameProblem } from '@/lib/account-rules';
import { useAuth } from '@/state/auth-state';

export function NicknameSheet({ visible, current, onClose }: { visible: boolean; current: string; onClose: () => void }) {
  const theme = useTheme();
  const { updateNickname } = useAuth();
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(current);
    setError(null);
  }, [visible, current]);

  async function save() {
    const problem = nicknameProblem(name);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    const { error: saveError } = await updateNickname(name);
    setSaving(false);
    if (saveError) setError(`저장하지 못했어요: ${saveError}`);
    else onClose();
  }

  return (
    <Sheet visible={visible} title="닉네임 바꾸기" onClose={onClose}>
      <Text style={[styles.help, { color: theme.textSecondary }]}>커뮤니티 글과 댓글에 이 이름으로 보여요.</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={MAX_NICKNAME_LEN}
        autoFocus
        onSubmitEditing={save}
        placeholder="닉네임"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="닉네임"
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="저장하기" onPress={save} loading={saving} disabled={!name.trim() || name.trim() === current} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 13, lineHeight: 19 },
  input: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16 },
  error: { fontSize: 13, lineHeight: 19 },
});
