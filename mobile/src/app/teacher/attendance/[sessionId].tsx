import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { AppText, Badge, Button, Card, ErrorState, LoadingBlock, Screen, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSessionDate } from '@/lib/greeting';
import {
  useSaveAttendance,
  useSessionAttendance,
  useStudents,
  type AttendanceStatus,
} from '@/lib/teacher-data';

const OPTIONS = [
  { value: 'present' as const, label: 'Present' },
  { value: 'late' as const, label: 'Late', tone: 'warning' as const },
  { value: 'absent' as const, label: 'Absent', tone: 'danger' as const },
];

export default function MarkAttendance() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const students = useStudents();
  const session = useSessionAttendance(sessionId);
  const save = useSaveAttendance(sessionId);
  // Local edits on top of what's saved; null until the teacher changes something
  const [edits, setEdits] = useState<Record<string, AttendanceStatus>>({});

  const saved = session.data?.statuses ?? {};
  const statuses = { ...saved, ...edits };
  const list = students.data ?? [];
  const markedCount = list.filter((s) => statuses[s.id]).length;
  const dirty = Object.keys(edits).length > 0;

  function markAllPresent() {
    const next: Record<string, AttendanceStatus> = {};
    list.forEach((s) => (next[s.id] = statuses[s.id] ?? 'present'));
    setEdits((e) => ({ ...e, ...next }));
  }

  async function onSave() {
    try {
      await save.mutateAsync(statuses);
      setEdits({});
      router.back();
    } catch {
      Alert.alert('Could not save', 'Check your internet connection and try again.');
    }
  }

  const c = useTheme();
  const loading = students.isPending || session.isPending;
  const failed = students.isError || session.isError;
  const saveLabel = dirty ? 'Save attendance' : 'Saved';

  return (
    <>
      <Stack.Screen
        options={{
          title: session.data ? formatSessionDate(session.data.date) : 'Attendance',
          // Always-visible Save in the header, so it's never hidden by the tab bar
          headerRight: () =>
            save.isPending ? (
              <ActivityIndicator color={c.tint} />
            ) : (
              <Pressable onPress={onSave} disabled={!dirty} hitSlop={12}>
                <Text style={{ color: dirty ? c.tint : c.textSecondary, fontSize: 17, fontWeight: '600' }}>Save</Text>
              </Pressable>
            ),
        }}
      />
      <Screen safeTop={false}>
        {loading ? (
          <LoadingBlock />
        ) : failed ? (
          <ErrorState onRetry={() => { students.refetch(); session.refetch(); }} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge label={`${markedCount} of ${list.length} marked`} tone={markedCount === list.length ? 'tint' : 'warning'} />
              <Button title="All present" variant="secondary" onPress={markAllPresent} />
            </View>
            {list.map((s) => (
              <Card key={s.id} style={{ gap: Spacing.two }}>
                <AppText variant="heading">{s.name}</AppText>
                <Segmented
                  options={OPTIONS}
                  value={statuses[s.id] ?? null}
                  onChange={(v) => setEdits((e) => ({ ...e, [s.id]: v }))}
                />
              </Card>
            ))}
            <Button title={saveLabel} onPress={onSave} loading={save.isPending} disabled={!dirty} />
          </>
        )}
      </Screen>
    </>
  );
}
