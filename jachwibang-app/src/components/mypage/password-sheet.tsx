import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MIN_PASSWORD_LEN, passwordProblem } from '@/lib/account-rules';
import { notify } from '@/lib/confirm';
import { useAuth } from '@/state/auth-state';

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes('should be different')) return '지금 쓰는 비밀번호와 다른 비밀번호를 입력해주세요.';
  if (m.includes('reauthentication') || m.includes('nonce')) return '보안을 위해 다시 로그인한 뒤 바꿔주세요.';
  if (m.includes('password should be at least')) return `비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 해요.`;
  return message;
}

export function PasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const { changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPassword('');
    setConfirm('');
    setError(null);
  }, [visible]);

  async function save() {
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError('비밀번호가 일치하지 않아요.');
    setSaving(true);
    const { error: saveError } = await changePassword(password);
    setSaving(false);
    if (saveError) return setError(friendly(saveError));
    onClose();
    notify('비밀번호를 바꿨어요', '다음 로그인부터 새 비밀번호를 사용하세요.');
  }

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  return (
    <Sheet visible={visible} title="비밀번호 변경" onClose={onClose}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>새 비밀번호</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoFocus
          autoComplete="new-password"
          placeholder={`${MIN_PASSWORD_LEN}자 이상, 특수문자 포함`}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="새 비밀번호"
          style={inputStyle}
        />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>새 비밀번호 확인</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={save}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="새 비밀번호 확인"
          style={inputStyle}
        />
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="변경하기" onPress={save} loading={saving} disabled={!password || !confirm} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16 },
  error: { fontSize: 13, lineHeight: 19 },
});
