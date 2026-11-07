import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ITEM_H = 44;
const VISIBLE = 5; // rows shown; the middle one is selected
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

/** iOS-style scrolling wheel of numbers, like the website's ayah drum. */
function Wheel({ items, value, onChange, label }: { items: number[]; value: number; onChange: (v: number) => void; label: string }) {
  const c = useTheme();
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const lastIndex = useRef(Math.max(0, items.indexOf(value)));

  // Jump to the selected value when the list changes (new surah, or "from" moved)
  useEffect(() => {
    const idx = Math.max(0, items.indexOf(value));
    lastIndex.current = idx;
    ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, items[0]]);

  const indexAt = (y: number) => Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));

  // Tick as each number passes the centre
  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = indexAt(e.nativeEvent.contentOffset.y);
    if (idx !== lastIndex.current) {
      lastIndex.current = idx;
      Haptics.selectionAsync();
    }
  }

  function settle(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const v = items[indexAt(e.nativeEvent.contentOffset.y)];
    if (v !== value) onChange(v);
  }

  return (
    <View style={{ flex: 1 }}>
      <AppText variant="label" style={{ textAlign: 'center', marginBottom: Spacing.one }}>
        {label}
      </AppText>
      <View style={{ height: ITEM_H * VISIBLE }}>
        <View
          pointerEvents="none"
          style={[styles.band, { top: PAD, backgroundColor: c.tintSoft, borderColor: c.tint }]}
        />
        <ScrollView
          ref={ref}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: PAD }}
          contentOffset={{ x: 0, y: Math.max(0, items.indexOf(value)) * ITEM_H }}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onMomentumScrollEnd={settle}
          onScrollEndDrag={(e) => {
            // No momentum (slow drag): settle now
            if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e);
          }}>
          {items.map((n) => {
            const selected = n === value;
            return (
              <View key={n} style={styles.item}>
                <Text
                  style={{
                    fontSize: selected ? 22 : 17,
                    fontWeight: selected ? '700' : '400',
                    color: selected ? c.tint : c.textSecondary,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {n}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/** From/To ayah wheels; "To" never goes below "From". */
export function AyahRangePicker({
  maxAyahs,
  from,
  to,
  onChange,
}: {
  maxAyahs: number;
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const c = useTheme();
  const fromItems = Array.from({ length: maxAyahs }, (_, i) => i + 1);
  const toItems = fromItems.filter((n) => n >= from);

  return (
    <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border }]}>
      <Wheel label="From ayah" items={fromItems} value={from} onChange={(f) => onChange(f, Math.max(f, to))} />
      <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.border }} />
      <Wheel label="To ayah" items={toItems} value={to} onChange={(t) => onChange(from, t)} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  band: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 1,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
});
