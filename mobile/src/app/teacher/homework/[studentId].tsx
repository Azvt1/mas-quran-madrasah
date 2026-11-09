import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, type RefObject } from 'react';
import { Alert, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

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
import { SwipeRow } from '@/components/swipe-row';
import { Spacing } from '@/constants/theme';
import { formatSessionDate } from '@/lib/greeting';
import {
  homeworkStatus,
  upcomingHomework,
  useDeleteAssignment,
  useStudent,
  useStudentHomework,
  type Assignment,
} from '@/lib/teacher-data';
import { homeworkListMessage, openWhatsApp } from '@/lib/whatsapp';

export default function StudentHomework() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const student = useStudent(studentId);
  const hw = useStudentHomework(studentId);
  const remove = useDeleteAssignment();
  const openRowRef = useRef<SwipeableMethods>(null);

  const all = hw.data ?? [];
  const pending = all.filter((a) => homeworkStatus(a) === 'pending');
  const notCompleted = all.filter((a) => homeworkStatus(a) === 'not-completed');
  const completed = all.filter((a) => homeworkStatus(a) === 'completed');
  const assessed = completed.length + notCompleted.length;
  const passRate = assessed ? Math.round((completed.length / assessed) * 100) : null;

  const open = (a: Assignment) =>
    router.push({ pathname: '/teacher/homework/feedback', params: { assignmentId: a.id, studentId } });

  const edit = (a: Assignment) =>
    router.push({ pathname: '/teacher/homework/edit', params: { assignmentId: a.id, studentId } });

  const confirmDelete = (a: Assignment) =>
    Alert.alert('Delete homework?', `"${a.title}" will be removed for this student.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(a.id);
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);

  const hintId = (pending[0] ?? notCompleted[0] ?? completed[0])?.id;
  const row = { onPress: open, onEdit: edit, onDelete: confirmDelete, openRowRef, hintId };

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
          <Section title="Waiting for feedback" items={pending} {...row} />
          <Section title="Not completed" items={notCompleted} {...row} />
          <Section title="Completed" items={completed} {...row} />
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
      onPress={() => openWhatsApp(phone, homeworkListMessage(name, items))}
    />
  );
}

function Section({
  title,
  items,
  onPress,
  onEdit,
  onDelete,
  openRowRef,
  hintId,
}: {
  title: string;
  items: Assignment[];
  onPress: (a: Assignment) => void;
  onEdit: (a: Assignment) => void;
  onDelete: (a: Assignment) => void;
  openRowRef: RefObject<SwipeableMethods | null>;
  hintId?: string;
}) {
  if (!items.length) return null;
  return (
    <View style={{ gap: Spacing.two }}>
      <SectionTitle>{`${title} · ${items.length}`}</SectionTitle>
      {items.map((a) => {
        const status = homeworkStatus(a);
        return (
          <SwipeRow key={a.id} onEdit={() => onEdit(a)} onDelete={() => onDelete(a)} openRowRef={openRowRef} hint={a.id === hintId}>
            <RowCard onPress={() => onPress(a)}>
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
          </SwipeRow>
        );
      })}
    </View>
  );
}
