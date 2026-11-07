import { View } from 'react-native';

import { AppText, Badge, Card, EmptyState, ErrorState, LoadingBlock, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatSessionDate } from '@/lib/greeting';
import { useMyHomework, type StudentAssignment } from '@/lib/student-data';

export default function MyHomework() {
  const { data, isPending, isError, refetch, isRefetching } = useMyHomework();
  const current = (data ?? []).filter((a) => a.activeTerm);
  // Same buckets as the teacher sees
  const todo = current.filter((a) => !a.isCompleted && a.behaviorSatisfactory === null);
  const passed = current.filter((a) => a.isCompleted);
  const notPassed = current.filter((a) => !a.isCompleted && a.behaviorSatisfactory !== null);

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
      ) : !current.length ? (
        <EmptyState title="No homework yet" message="Homework from your teacher will appear here." />
      ) : (
        <>
          <Group title="To do" items={todo} />
          <Group title="Try again" items={notPassed} />
          <Group title="Passed" items={passed} />
        </>
      )}
    </Screen>
  );
}

function Group({ title, items }: { title: string; items: StudentAssignment[] }) {
  if (!items.length) return null;
  return (
    <View style={{ gap: Spacing.two }}>
      <SectionTitle>{`${title} · ${items.length}`}</SectionTitle>
      {items.map((a) => (
        <Card key={a.id} style={{ gap: Spacing.two }}>
          <AppText variant="heading">{a.title}</AppText>
          {a.instructions ? <AppText variant="caption">{a.instructions}</AppText> : null}
          <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', alignItems: 'center' }}>
            {a.isCompleted ? <Badge label="Passed" tone="tint" /> : null}
            {!a.isCompleted && a.behaviorSatisfactory !== null ? <Badge label="Not passed" tone="danger" /> : null}
            {a.behaviorSatisfactory === false ? <Badge label="Behaviour: needs improvement" tone="warning" /> : null}
            {a.dueDate && !a.isCompleted ? <AppText variant="caption">Due {formatSessionDate(a.dueDate)}</AppText> : null}
          </View>
          {a.feedback ? (
            <AppText variant="caption" style={{ fontStyle: 'italic' }}>
              Teacher: “{a.feedback}”
            </AppText>
          ) : null}
        </Card>
      ))}
    </View>
  );
}
