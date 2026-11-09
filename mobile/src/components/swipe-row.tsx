import 'expo-sqlite/localStorage/install';
import { useEffect, useRef, useState, type PropsWithChildren, type RefObject } from 'react';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HINT_KEY = 'swipe-hint-plays';
const HINT_MAX_PLAYS = 5;
const HINT_BOUNCE = { damping: 12, stiffness: 160, mass: 1, overshootClamping: false };

function claimHintPlay() {
  const plays = Number(localStorage.getItem(HINT_KEY) ?? 0);
  if (plays >= HINT_MAX_PLAYS) return false;
  localStorage.setItem(HINT_KEY, String(plays + 1));
  return true;
}

/** Row that swipes left to reveal Edit and Delete. `openRowRef` keeps one row open at a time.
 *  With `hint`, the row bounces open and shut until the teacher has swiped once. */
export function SwipeRow({
  children,
  onEdit,
  onDelete,
  openRowRef,
  hint = false,
}: PropsWithChildren<{
  onEdit: () => void;
  onDelete: () => void;
  openRowRef: RefObject<SwipeableMethods | null>;
  hint?: boolean;
}>) {
  const c = useTheme();
  const row = useRef<SwipeableMethods>(null);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (!hint) return;
    const start = setTimeout(() => {
      if (claimHintPlay()) setBouncing(true);
    }, 700);
    return () => clearTimeout(start);
  }, [hint]);

  useEffect(() => {
    if (!bouncing) return;
    row.current?.openRight();
    const close = setTimeout(() => row.current?.close(), 650);
    const done = setTimeout(() => setBouncing(false), 1600);
    return () => {
      clearTimeout(close);
      clearTimeout(done);
    };
  }, [bouncing]);

  function act(action: () => void) {
    row.current?.close();
    action();
  }

  return (
    <ReanimatedSwipeable
      ref={row}
      friction={1.5}
      rightThreshold={40}
      overshootRight={false}
      animationOptions={bouncing ? HINT_BOUNCE : undefined}
      onSwipeableOpenStartDrag={() => localStorage.setItem(HINT_KEY, String(HINT_MAX_PLAYS))}
      onSwipeableWillOpen={() => {
        if (openRowRef.current !== row.current) openRowRef.current?.close();
        openRowRef.current = row.current;
      }}
      renderRightActions={() => (
        <View style={styles.actions}>
          <Action label="Edit" icon={{ ios: 'pencil', android: 'edit' }} color={c.tint} onPress={() => act(onEdit)} />
          <Action label="Delete" icon={{ ios: 'trash', android: 'delete' }} color={c.danger} onPress={() => act(onDelete)} />
        </View>
      )}>
      {children}
    </ReanimatedSwipeable>
  );
}

function Action({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps['name'];
  color: string;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { backgroundColor: color, opacity: pressed ? 0.7 : 1 }]}>
      <SymbolView name={icon} size={22} tintColor={c.onTint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two, paddingLeft: Spacing.two },
  action: { width: 56, borderRadius: Radius.card, alignItems: 'center', justifyContent: 'center' },
});
