import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText, Badge, Button, Card, ErrorState, LoadingBlock, Screen, StatTile } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStudent } from '@/lib/teacher-data';
import { openWhatsApp } from '@/lib/whatsapp';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: s, isPending, isError, refetch, isRefetching } = useStudent(id);

  return (
    <Screen safeTop={false} onRefresh={refetch} refreshing={isRefetching}>
      <Stack.Screen options={{ title: s?.name ?? '' }} />
      {isPending ? (
        <LoadingBlock />
      ) : isError || !s ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          <View style={{ gap: Spacing.two }}>
            <AppText variant="title">{s.name}</AppText>
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Badge label={s.type === 'iqra' ? 'Iqra student' : 'Quran student'} tone="tint" />
              {s.readyToAdvance ? <Badge label="Ready to advance" tone="tint" /> : null}
            </View>
          </View>

          <Card>
            <AppText variant="label">Current position</AppText>
            <AppText variant="heading">{s.progress}</AppText>
          </Card>

          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <StatTile
              label="Attendance"
              value={s.attendanceRate === null ? '—' : `${s.attendanceRate}%`}
              hint="This term"
            />
            <StatTile label="Pass rate" value={s.passRate === null ? '—' : `${s.passRate}%`} hint="Homework" />
          </View>

          <View style={{ gap: Spacing.two }}>
            <Button
              title={s.pendingHomework ? `Homework · ${s.pendingHomework} to review` : 'Homework'}
              onPress={() => router.push(`/teacher/homework/${s.id}`)}
            />
            {s.parentPhone ? (
              <Button title="Message parent on WhatsApp" variant="secondary" onPress={() => openWhatsApp(s.parentPhone!)} />
            ) : (
              <AppText variant="caption" style={{ textAlign: 'center' }}>
                No parent phone number on file
              </AppText>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
