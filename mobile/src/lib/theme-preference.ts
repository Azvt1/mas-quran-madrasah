import 'expo-sqlite/localStorage/install';
import { Appearance } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'theme-preference';

export function getThemePreference(): ThemePreference {
  const saved = localStorage.getItem(KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

function apply(preference: ThemePreference) {
  // useColorScheme, the tab bar and date pickers all follow this override
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function setThemePreference(preference: ThemePreference) {
  localStorage.setItem(KEY, preference);
  apply(preference);
}

export function applySavedThemePreference() {
  apply(getThemePreference());
}
