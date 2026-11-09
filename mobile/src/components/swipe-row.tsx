import { useRef, type PropsWithChildren, type RefObject } from 'react';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Row that swipes left to reveal Edit and Delete. `openRowRef` keeps one row open at a time. */
export function SwipeRow({
  children,
  onEdit,
  onDelete,
  openRowRef,
}: PropsWithChildren<{
  onEdit: () => void;
  onDelete: () => void;
  openRowRef: RefObject<SwipeableMethods | null>;
}>) {
  const c = useTheme();
  const row = useRef<SwipeableMethods>(null);

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
