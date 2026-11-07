import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Badge, EmptyState, ErrorState, LoadingBlock, RowCard, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStudents } from '@/lib/teacher-data';

export default function StudentsList() {
  const { data, isPending, isError, refetch, isRefetching } = useStudents();

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <AppText variant="title">Students</AppText>
      {isPending ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data.length ? (
        <EmptyState title="No students yet" message="Students assigned to you will appear here." />
      ) : (
        data.map((s) => (
          <RowCard key={s.id} onPress={() => router.push(`/teacher/students/${s.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <AppText variant="heading" style={{ flexShrink: 1 }}>
                {s.name}
              </AppText>
              <Badge label={s.type === 'iqra' ? 'Iqra' : 'Quran'} tone="tint" />
            </View>
            <AppText variant="caption">{s.progress}</AppText>
            <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', marginTop: Spacing.one }}>
              {s.attendanceRate !== null ? (
                <Badge
                  label={`${s.attendanceRate}% attendance`}
                  tone={s.attendanceRate >= 80 ? 'neutral' : s.attendanceRate >= 60 ? 'warning' : 'danger'}
                />
              ) : null}
              {s.pendingHomework > 0 ? <Badge label={`${s.pendingHomework} to review`} tone="warning" /> : null}
              {s.readyToAdvance ? <Badge label="Ready to advance" tone="tint" /> : null}
            </View>
          </RowCard>
        ))
      )}
    </Screen>
  );
}
