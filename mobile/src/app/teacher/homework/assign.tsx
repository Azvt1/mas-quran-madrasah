import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { HomeworkForm, type HomeworkValues } from '@/components/homework-form';
import { LoadingBlock, Screen } from '@/components/ui';
import { formatSessionDate } from '@/lib/greeting';
import { useAssignHomework, useIqraBook, useNextClass, useStudent } from '@/lib/teacher-data';
import { homeworkListMessage, openWhatsApp } from '@/lib/whatsapp';

export default function AssignHomework() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const student = useStudent(studentId);
  const book = useIqraBook(studentId);
  const nextClass = useNextClass();
  const assign = useAssignHomework();
  const s = student.data;

  async function onSubmit(v: HomeworkValues) {
    try {
      await assign.mutateAsync({ studentId, bookReference: null, ...v });
    } catch {
      Alert.alert('Could not assign', 'Check your internet connection and try again.');
      return;
    }
    if (!s?.parentPhone) {
      router.back();
      return;
    }
    Alert.alert(
      'Homework assigned',
      `Let ${s.name.split(' ')[0]}'s parent know on WhatsApp?${v.dueDate ? `\nDue ${formatSessionDate(v.dueDate)}` : ''}`,
      [
        { text: 'Not now', style: 'cancel', onPress: () => router.back() },
        {
          text: 'Send',
          onPress: () => {
            openWhatsApp(s.parentPhone!, homeworkListMessage(s.name, [{ title: v.title, dueDate: v.dueDate, instructions: v.instructions }]));
            router.back();
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Assign homework' }} />
      {!s || book.isPending || nextClass.isPending ? (
        <Screen safeTop={false}>
          <LoadingBlock />
        </Screen>
      ) : (
        <HomeworkForm
          studentName={s.name}
          type={s.type}
          currentBook={book.data ?? 1}
          nextClass={nextClass.data ?? null}
          submitLabel="Assign"
          submitting={assign.isPending}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}
