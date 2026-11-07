'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleCompletionAction(formData: FormData) {
  const assignmentId  = formData.get('assignmentId') as string
  const currentState  = formData.get('currentState') === 'true'
  const studentId     = formData.get('studentId') as string

  const supabase = await createClient()
  await supabase
    .from('homework_assignments')
    .update({
      is_completed: !currentState,
      completed_at: !currentState ? new Date().toISOString() : null,
    })
    .eq('id', assignmentId)

  revalidatePath(`/teacher/homework/student/${studentId}`)
}

export async function deleteHomeworkAction(assignmentId: string, studentId: string) {
  // Verify the current user is a teacher
  const user = await getProfile()
  if (user?.role !== 'teacher') return

  // Use admin client to bypass missing RLS DELETE policy
  const admin = createAdminClient()

  // Get assignment + verify teacher owns the homework
  const { data: assignment } = await admin
    .from('homework_assignments')
    .select('homework_id, homework:homework_id(teacher_id)')
    .eq('id', assignmentId)
    .single()

  const hw = assignment?.homework as any
  if (!assignment || hw?.teacher_id !== user.id) return // ownership check

  // Delete the assignment
  await admin.from('homework_assignments').delete().eq('id', assignmentId)

  // Delete the parent homework record if it has no other assignments
  if (assignment.homework_id) {
    const { count } = await admin
      .from('homework_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('homework_id', assignment.homework_id)

    if (count === 0) {
      await admin.from('homework').delete().eq('id', assignment.homework_id)
    }
  }

  revalidatePath(`/teacher/homework/student/${studentId}`)
}

interface SaveFeedbackArgs {
  assignmentId: string
  studentId: string
  isCompleted: boolean
  behaviorSatisfactory: boolean
  teacherFeedback: string | null
}

export async function saveFeedbackAction({
  assignmentId,
  studentId,
  isCompleted,
  behaviorSatisfactory,
  teacherFeedback,
}: SaveFeedbackArgs) {
  const supabase = await createClient()

  await supabase
    .from('homework_assignments')
    .update({
      is_completed:           isCompleted,
      completed_at:           isCompleted ? new Date().toISOString() : null,
      behavior_satisfactory:  behaviorSatisfactory,
      teacher_feedback:       teacherFeedback,
    })
    .eq('id', assignmentId)

  revalidatePath(`/teacher/homework/student/${studentId}`)
}
