import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { AppText, Button, Card, LoadingBlock, Screen, Segmented, useInputStyle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  upcomingHomework,
  useDeleteAssignment,
  useSaveFeedback,
  useStudent,
  useStudentHomework,
  type Assignment,
} from '@/lib/teacher-data';
import { homeworkMessage, openWhatsApp } from '@/lib/whatsapp';

export default function Feedback() {
  const { assignmentId, studentId } = useLocalSearchParams<{ assignmentId: string; studentId: string }>();
  const hw = useStudentHomework(studentId);
  const assignment = hw.data?.find((a) => a.id === assignmentId);

  return (
    <>
      <Stack.Screen options={{ title: 'Feedback' }} />
      {assignment ? (
        <FeedbackForm assignment={assignment} studentId={studentId} others={hw.data ?? []} />
      ) : (
        <Screen safeTop={false}>
          <LoadingBlock />
        </Screen>
      )}
    </>
  );
}

function FeedbackForm({ assignment: a, studentId, others }: { assignment: Assignment; studentId: string; others: Assignment[] }) {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const student = useStudent(studentId);
  const save = useSaveFeedback();
  const remove = useDeleteAssignment();

  // Same defaults as the website: an un-reviewed item starts blank
  const reviewed = a.behaviorSatisfactory !== null;
  const [done, setDone] = useState<'yes' | 'no' | null>(reviewed || a.isCompleted ? (a.isCompleted ? 'yes' : 'no') : null);
  const [behaviour, setBehaviour] = useState<'good' | 'poor' | null>(
    a.behaviorSatisfactory === null ? null : a.behaviorSatisfactory ? 'good' : 'poor',
  );
  // An un-reviewed item starts with the note written when it was assigned
  const [text, setText] = useState(reviewed ? (a.feedback ?? '') : (a.feedback ?? a.instructions ?? ''));

  async function onSave() {
    if (!done || !behaviour) return;
    const isCompleted = done === 'yes';
    const behaviorSatisfactory = behaviour === 'good';
    const feedback = text.trim() || null;
    try {
      await save.mutateAsync({ assignmentId: a.id, isCompleted, behaviorSatisfactory, feedback });
    } catch {
      Alert.alert('Could not save', 'Check your internet connection and try again.');
      return;
    }

    const s = student.data;
    if (!s?.parentPhone) {
      router.back();
      return;
    }
    const upcoming = upcomingHomework(others, a.id);
    Alert.alert('Feedback saved', `Send it to ${s.name.split(' ')[0]}'s parent on WhatsApp?`, [
      { text: 'Not now', style: 'cancel', onPress: () => router.back() },
      {
        text: 'Send',
        onPress: () => {
          openWhatsApp(
            s.parentPhone!,
            homeworkMessage({ studentName: s.name, homeworkTitle: a.title, isCompleted, behaviorSatisfactory, feedback, upcoming }),
          );
          router.back();
        },
      },
    ]);
  }

  function onDelete() {
    Alert.alert('Delete homework?', `"${a.title}" will be removed for this student.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(a.id);
            router.back();
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <Screen safeTop={false}>
      <Card>
        <AppText variant="label">{student.data?.name ?? 'Homework'}</AppText>
        <AppText variant="heading">{a.title}</AppText>
        {a.bookReference ? <AppText variant="caption">{a.bookReference}</AppText> : null}
      </Card>

      <View style={{ gap: Spacing.two }}>
        <AppText variant="label">Homework completed?</AppText>
        <Segmented
          value={done}
          onChange={setDone}
          options={[
            { value: 'yes', label: 'Yes, passed' },
            { value: 'no', label: 'No', tone: 'danger' },
          ]}
        />
      </View>

      <View style={{ gap: Spacing.two }}>
        <AppText variant="label">Behaviour</AppText>
        <Segmented
          value={behaviour}
          onChange={setBehaviour}
          options={[
            { value: 'good', label: 'Satisfactory' },
            { value: 'poor', label: 'Needs improvement', tone: 'warning' },
          ]}
        />
      </View>

      <View style={{ gap: Spacing.two }}>
        <AppText variant="label">Comment (optional)</AppText>
        <TextInput
          style={[inputStyle, { minHeight: 96, textAlignVertical: 'top' }]}
          value={text}
          onChangeText={setText}
          placeholder="e.g. Great tajweed, revise the last two lines"
          placeholderTextColor={c.textSecondary}
          multiline
        />
      </View>

      <Button title="Save feedback" onPress={onSave} loading={save.isPending} disabled={!done || !behaviour} />
      {student.data?.parentPhone ? (
        <Button
          title="Send to parent on WhatsApp"
          variant="secondary"
          onPress={() =>
            openWhatsApp(
              student.data!.parentPhone!,
              homeworkMessage({
                studentName: student.data!.name,
                homeworkTitle: a.title,
                // Only include feedback that has actually been given
                isCompleted: reviewed || a.isCompleted ? a.isCompleted : null,
                behaviorSatisfactory: a.behaviorSatisfactory,
                feedback: a.feedback,
                upcoming: upcomingHomework(others, a.id),
              }),
            )
          }
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Edit"
            variant="secondary"
            onPress={() => router.push({ pathname: '/teacher/homework/edit', params: { assignmentId: a.id, studentId } })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Delete" variant="secondary" onPress={onDelete} loading={remove.isPending} />
        </View>
      </View>
    </Screen>
  );
}
