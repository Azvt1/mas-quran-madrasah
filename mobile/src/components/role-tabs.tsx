import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

export interface TabDef {
  name: string;
  label: string;
  /** SF Symbol (iOS) */
  sf: { default: string; selected: string };
  /** Material Symbol (Android) */
  md: string;
}

export function RoleTabs({ tabs }: { tabs: TabDef[] }) {
  const c = useTheme();
  return (
    <NativeTabs tintColor={c.tint} backgroundColor={c.card}>
      {tabs.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={t.sf as never} md={t.md as never} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
