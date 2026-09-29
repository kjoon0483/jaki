import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Asks for a room name, for "save as new". */
export function SaveRoomSheet({
  visible,
  defaultName,
  onClose,
  onSave,
}: {
  visible: boolean;
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<{ error: string | null }>;
}) {
  const theme = useTheme();
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(defaultName);
    setError(null);
  }, [visible, defaultName]);

  async function save() {
    setSaving(true);
    const { error: saveError } = await onSave(name.trim());
    setSaving(false);
    if (saveError) setError(saveError);
    else onClose();
  }

  return (
    <Sheet visible={visible} title="방 저장하기" onClose={onClose}>
      <Text style={[styles.help, { color: theme.textSecondary }]}>
        저장한 방은 &apos;내 방&apos;에서 다시 열거나 커뮤니티에 공유할 수 있어요.
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="예: 6평 원룸 봄 배치"
        placeholderTextColor={theme.textSecondary}
        maxLength={40}
        autoFocus
        onSubmitEditing={() => name.trim() && save()}
        accessibilityLabel="방 이름"
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="저장하기" onPress={save} loading={saving} disabled={!name.trim()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 13, lineHeight: 19 },
  input: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16 },
  error: { fontSize: 13, lineHeight: 19 },
});
