import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const CARD_RADIUS = 18;

/** Rounded surface used for every grouped block of content. */
export function Card({
  children,
  tone = 'default',
  style,
}: PropsWithChildren<{ tone?: 'default' | 'accent' | 'soft'; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const backgroundColor =
    tone === 'accent' ? theme.surfaceAccent : tone === 'soft' ? theme.accentSoft : theme.backgroundElement;
  return <View style={[styles.card, { backgroundColor }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: CARD_RADIUS, padding: Spacing.three, gap: Spacing.two },
});
