import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingBlock,
  RowCard,
  Screen,
  SectionTitle,
  StatTile,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatSessionDate } from '@/lib/greeting';
import { homeworkStatus, upcomingHomework, useStudent, useStudentHomework, type Assignment } from '@/lib/teacher-data';
import { homeworkListMessage, openWhatsApp } from '@/lib/whatsapp';

export default function StudentHomework() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const student = useStudent(studentId);
  const hw = useStudentHomework(studentId);

  const all = hw.data ?? [];
  const pending = all.filter((a) => homeworkStatus(a) === 'pending');
  const notCompleted = all.filter((a) => homeworkStatus(a) === 'not-completed');
  const completed = all.filter((a) => homeworkStatus(a) === 'completed');
  const assessed = completed.length + notCompleted.length;
  const passRate = assessed ? Math.round((completed.length / assessed) * 100) : null;

  const open = (a: Assignment) =>
    router.push({ pathname: '/teacher/homework/feedback', params: { assignmentId: a.id, studentId } });

  return (
    <Screen safeTop={false} onRefresh={hw.refetch} refreshing={hw.isRefetching}>
      <Stack.Screen options={{ title: student.data?.name ?? 'Homework' }} />
      <View style={{ gap: Spacing.two }}>
        <Button
          title="Assign homework"
          onPress={() => router.push({ pathname: '/teacher/homework/assign', params: { studentId } })}
        />
        <ParentButton
          name={student.data?.name}
          phone={student.data?.parentPhone ?? null}
          items={upcomingHomework(all)}
        />
      </View>
      {hw.isPending ? (
        <LoadingBlock />
      ) : hw.isError ? (
        <ErrorState onRetry={hw.refetch} />
      ) : !all.length ? (
        <EmptyState title="No homework this term" message="Tap Assign homework to add the first one." />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <StatTile label="To review" value={pending.length} />
            <StatTile label="Pass rate" value={passRate === null ? '—' : `${passRate}%`} hint={`${completed.length} of ${assessed} passed`} />
          </View>
          <Section title="Waiting for feedback" items={pending} onPress={open} />
          <Section title="Not completed" items={notCompleted} onPress={open} />
          <Section title="Completed" items={completed} onPress={open} />
        </>
      )}
    </Screen>
  );
}

function ParentButton({ name, phone, items }: { name?: string; phone: string | null; items: Assignment[] }) {
  if (!name) return null;
  if (!phone) {
    return (
      <AppText variant="caption" style={{ textAlign: 'center' }}>
        No parent phone on file. Add it on the website under Users.
      </AppText>
    );
  }
  return (
    <Button
      title="Message parent on WhatsApp"
      variant="secondary"
      onPress={() => openWhatsApp(phone, homeworkListMessage(name, items.map((a) => ({ title: a.title, dueDate: a.dueDate }))))}
    />
  );
}

function Section({ title, items, onPress }: { title: string; items: Assignment[]; onPress: (a: Assignment) => void }) {
  if (!items.length) return null;
  return (
    <View style={{ gap: Spacing.two }}>
      <SectionTitle>{`${title} · ${items.length}`}</SectionTitle>
      {items.map((a) => {
        const status = homeworkStatus(a);
        return (
          <RowCard key={a.id} onPress={() => onPress(a)}>
            <AppText variant="heading">{a.title}</AppText>
            {a.bookReference ? <AppText variant="caption">{a.bookReference}</AppText> : null}
            <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', alignItems: 'center' }}>
              {status === 'pending' ? <Badge label="Give feedback" tone="warning" /> : null}
              {status === 'completed' ? <Badge label="Passed" tone="tint" /> : null}
              {status === 'not-completed' ? <Badge label="Not passed" tone="danger" /> : null}
              {a.dueDate ? <AppText variant="caption">Due {formatSessionDate(a.dueDate)}</AppText> : null}
            </View>
            {a.feedback ? (
              <AppText variant="caption" style={{ fontStyle: 'italic' }}>
                “{a.feedback}”
              </AppText>
            ) : null}
          </RowCard>
        );
      })}
    </View>
  );
}
