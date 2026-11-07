import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Badge, EmptyState, ErrorState, LoadingBlock, RowCard, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStudents } from '@/lib/teacher-data';

export default function HomeworkList() {
  const { data, isPending, isError, refetch, isRefetching } = useStudents();
  // Students with homework waiting for feedback first
  const sorted = [...(data ?? [])].sort((a, b) => b.pendingHomework - a.pendingHomework);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View>
        <AppText variant="title">Homework</AppText>
        <AppText variant="caption">This term</AppText>
      </View>
      {isPending ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !sorted.length ? (
        <EmptyState title="No students yet" />
      ) : (
        sorted.map((s) => (
          <RowCard key={s.id} onPress={() => router.push(`/teacher/homework/${s.id}`)}>
            <AppText variant="heading">{s.name}</AppText>
            <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' }}>
              {s.pendingHomework > 0 ? (
                <Badge label={`${s.pendingHomework} to review`} tone="warning" />
              ) : (
                <Badge label="All reviewed" />
              )}
              {s.passRate !== null ? (
                <Badge label={`${s.passRate}% passed`} tone={s.passRate >= 70 ? 'tint' : 'danger'} />
              ) : null}
            </View>
          </RowCard>
        ))
      )}
    </Screen>
  );
}
