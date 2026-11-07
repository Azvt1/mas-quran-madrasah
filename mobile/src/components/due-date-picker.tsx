import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { AppText, Card, Chip, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatSessionDate, fromDateString, localDateString } from '@/lib/greeting';

type Mode = 'next' | 'date' | 'none';

/**
 * Due date: next class (one tap), any date the teacher picks, or none.
 * `value` / `onChange` use YYYY-MM-DD strings like homework.due_date.
 */
export function DueDatePicker({
  value,
  onChange,
  nextClass,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  nextClass: string | null;
}) {
  const c = useTheme();
  const scheme = useColorScheme();
  const today = localDateString();
  const [mode, setMode] = useState<Mode>(value === null ? 'none' : value === nextClass ? 'next' : 'date');
  const [showCalendar, setShowCalendar] = useState(false);

  function pickMode(m: Mode) {
    setMode(m);
    if (m === 'none') onChange(null);
    if (m === 'next') onChange(nextClass);
    if (m === 'date') {
      if (!value || value === nextClass) onChange(addDays(today, 7));
      setShowCalendar(false);
    }
  }

  function openCalendar() {
    const current = fromDateString(value ?? addDays(today, 7));
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (e, d) => {
          if (e.type === 'set' && d) onChange(localDateString(d));
        },
      });
    } else {
      setShowCalendar((s) => !s);
    }
  }

  const quick = [
    { label: '1 week', date: addDays(today, 7) },
    { label: '2 weeks', date: addDays(today, 14) },
  ];

  return (
    <View style={{ gap: Spacing.two }}>
      <AppText variant="label">Due</AppText>
      <Segmented
        value={mode}
        onChange={pickMode}
        options={[
          { value: 'next', label: 'Next class' },
          { value: 'date', label: 'Pick date' },
          { value: 'none', label: 'None' },
        ]}
      />

      {mode === 'date' ? (
        <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' }}>
          {quick.map((q) => (
            <Chip key={q.label} label={q.label} selected={value === q.date} onPress={() => { onChange(q.date); setShowCalendar(false); }} />
          ))}
          <Chip
            label="Calendar…"
            selected={!!value && !quick.some((q) => q.date === value)}
            onPress={openCalendar}
          />
        </View>
      ) : null}

      {mode === 'date' && showCalendar && Platform.OS === 'ios' ? (
        <Card style={{ padding: Spacing.one }}>
          <DateTimePicker
            value={fromDateString(value ?? addDays(today, 7))}
            mode="date"
            display="inline"
            minimumDate={new Date()}
            accentColor={c.tint}
            themeVariant={scheme === 'dark' ? 'dark' : 'light'}
            onChange={(_, d) => d && onChange(localDateString(d))}
          />
        </Card>
      ) : null}

      {mode !== 'none' ? (
        <AppText variant="caption">
          {value ? `Due ${formatSessionDate(value)}` : 'No upcoming class found'}
        </AppText>
      ) : null}
    </View>
  );
}
