import { type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Scrollable page with pull-to-refresh and safe-area padding.
 * Pass `safeTop={false}` on screens that show a native header.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  safeTop = true,
}: PropsWithChildren<{ onRefresh?: () => void; refreshing?: boolean; safeTop?: boolean }>) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={safeTop ? ['top'] : []} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        // Leave room to scroll content clear of the floating tab bar
        contentContainerStyle={[styles.screen, { paddingBottom: insets.bottom + TAB_BAR_SPACE }]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.tint} />
          ) : undefined
        }>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type TextVariant = 'title' | 'heading' | 'body' | 'caption' | 'label';

export function AppText({
  children,
  variant = 'body',
  color,
  style,
}: PropsWithChildren<{ variant?: TextVariant; color?: string; style?: StyleProp<TextStyle> }>) {
  const c = useTheme();
  const defaultColor = variant === 'caption' || variant === 'label' ? c.textSecondary : c.text;
  return <Text style={[textStyles[variant], { color: color ?? defaultColor }, style]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>
      {children}
    </View>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card style={styles.statTile}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="title">{value}</AppText>
      {hint ? <AppText variant="caption">{hint}</AppText> : null}
    </Card>
  );
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const c = useTheme();
  const primary = variant === 'primary';
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: c.tint }
          : { backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
        { opacity: inactive ? 0.6 : pressed ? 0.85 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? c.onTint : c.text} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? c.onTint : c.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

type Tone = 'neutral' | 'tint' | 'warning' | 'danger';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = useTheme();
  const colors: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: c.border, fg: c.textSecondary },
    tint: { bg: c.tintSoft, fg: c.tint },
    warning: { bg: c.warning + '22', fg: c.warning },
    danger: { bg: c.danger + '1f', fg: c.danger },
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[tone].bg }]}>
      <Text style={[styles.badgeText, { color: colors[tone].fg }]}>{label}</Text>
    </View>
  );
}

/** Tappable card row with a chevron. */
export function RowCard({
  children,
  onPress,
  style,
}: PropsWithChildren<{ onPress?: () => void; style?: StyleProp<ViewStyle> }>) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        styles.row,
        { backgroundColor: pressed ? c.border : c.card, borderColor: c.border },
        style,
      ]}>
      <View style={{ flex: 1, gap: Spacing.one }}>{children}</View>
      {onPress ? <Text style={[styles.chevron, { color: c.textSecondary }]}>›</Text> : null}
    </Pressable>
  );
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="label">{children}</AppText>
      {right}
    </View>
  );
}

/** Row of mutually exclusive options, e.g. Present / Late / Absent. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; tone?: Tone }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  const toneColor = (t?: Tone) => (t === 'danger' ? c.danger : t === 'warning' ? c.warning : c.tint);
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = value === o.value;
        const color = toneColor(o.tone);
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              { borderColor: active ? color : c.border, backgroundColor: active ? color + '1f' : c.card },
            ]}>
            <Text style={[styles.segmentText, { color: active ? color : c.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small selectable pill, used in grids (Iqra books, Juz numbers). */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? c.tint : c.border, backgroundColor: selected ? c.tintSoft : c.card },
      ]}>
      <Text style={[styles.segmentText, { color: selected ? c.tint : c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: Spacing.five }}>
      <AppText variant="heading">{title}</AppText>
      {message ? (
        <AppText variant="caption" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
    </Card>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card style={{ gap: Spacing.two }}>
      <AppText variant="heading">Could not load</AppText>
      <AppText variant="caption">Check your internet connection and try again.</AppText>
      <Button title="Try again" variant="secondary" onPress={onRetry} />
    </Card>
  );
}

export function LoadingBlock() {
  const c = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={c.tint} />
    </View>
  );
}

const TAB_BAR_SPACE = 110;

const styles = StyleSheet.create({
  screen: { padding: Spacing.three, gap: Spacing.three },
  card: { borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.one },
  statTile: { flex: 1, minWidth: 140 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  buttonText: { fontSize: 17, fontWeight: '600' },
  loading: { paddingVertical: Spacing.five, alignItems: 'center' },
  badge: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chevron: { fontSize: 28, fontWeight: '300', marginTop: -4 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.two },
  segmented: { flexDirection: 'row', gap: Spacing.two },
  segment: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  chip: { minWidth: 52, height: 40, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

/** Shared text-input look. */
export function useInputStyle(): StyleProp<TextStyle> {
  const c = useTheme();
  return {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    backgroundColor: c.card,
    borderColor: c.border,
    color: c.text,
  };
}

const textStyles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
});
