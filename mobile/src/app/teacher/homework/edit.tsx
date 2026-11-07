import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { HomeworkForm, type HomeworkValues } from '@/components/homework-form';
import { LoadingBlock, Screen } from '@/components/ui';
import { useIqraBook, useNextClass, useStudent, useStudentHomework, useUpdateHomework } from '@/lib/teacher-data';

export default function EditHomework() {
  const { assignmentId, studentId } = useLocalSearchParams<{ assignmentId: string; studentId: string }>();
  const student = useStudent(studentId);
  const book = useIqraBook(studentId);
  const nextClass = useNextClass();
  const hw = useStudentHomework(studentId);
  const update = useUpdateHomework();
  const a = hw.data?.find((x) => x.id === assignmentId);

  async function onSubmit(v: HomeworkValues) {
    if (!a) return;
    try {
      await update.mutateAsync({ homeworkId: a.homeworkId, bookReference: a.bookReference, ...v });
      router.back();
    } catch {
      Alert.alert('Could not save', 'Check your internet connection and try again.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit homework' }} />
      {!student.data || !a || book.isPending || nextClass.isPending ? (
        <Screen safeTop={false}>
          <LoadingBlock />
        </Screen>
      ) : (
        <HomeworkForm
          studentName={student.data.name}
          type={student.data.type}
          currentBook={book.data ?? 1}
          nextClass={nextClass.data ?? null}
          initial={{ title: a.title, dueDate: a.dueDate, instructions: a.instructions }}
          submitLabel="Save changes"
          submitting={update.isPending}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}
