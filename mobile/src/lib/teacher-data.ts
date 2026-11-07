import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { localDateString } from '@/lib/greeting';
import { surahName } from '@/lib/quran/surahs';
import { supabase } from '@/lib/supabase';

// Everything here runs as the signed-in teacher, so Row Level Security limits
// every query to their own students and homework. Each screen loads in one
// parallel round trip.

export type StudentType = 'iqra' | 'quran';
export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface TeacherStudent {
  id: string;
  name: string;
  type: StudentType;
  parentPhone: string | null;
  readyToAdvance: boolean;
  progress: string;
  /** % of this term's past classes attended (present or late); null before any class. */
  attendanceRate: number | null;
  pendingHomework: number;
  passRate: number | null;
}

export interface Assignment {
  id: string;
  homeworkId: string;
  title: string;
  instructions: string | null;
  surahNumber: number | null;
  dueDate: string | null;
  bookReference: string | null;
  assignedAt: string;
  isCompleted: boolean;
  behaviorSatisfactory: boolean | null;
  feedback: string | null;
  termId: string | null;
}

/** pending = no feedback yet; see CLAUDE.md "Critical homework logic". */
export function homeworkStatus(a: Pick<Assignment, 'isCompleted' | 'behaviorSatisfactory'>) {
  if (a.isCompleted) return 'completed' as const;
  if (a.behaviorSatisfactory === null) return 'pending' as const;
  return 'not-completed' as const;
}

/**
 * Homework still ahead of the student: no feedback yet and not past its due
 * date. Used for parent messages, which shouldn't list old or failed work.
 */
export function upcomingHomework(list: Assignment[], excludeId?: string): Assignment[] {
  const today = localDateString();
  return list
    .filter((a) => a.id !== excludeId && homeworkStatus(a) === 'pending' && (!a.dueDate || a.dueDate >= today))
    .sort((x, y) => (x.dueDate ?? '9999').localeCompare(y.dueDate ?? '9999'));
}

function useTeacherId() {
  const { profile } = useAuth();
  return profile?.role === 'teacher' ? profile.id : undefined;
}

// ── Students ────────────────────────────────────────────────────────────────

async function fetchStudents(teacherId: string): Promise<TeacherStudent[]> {
  const today = localDateString();
  const [students, term, assignments, iqra, quran, attendance] = await Promise.all([
    supabase
      .from('students')
      .select('id, student_type, parent_phone, ready_to_advance, profiles:profile_id(full_name)')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('enrollment_date'),
    supabase.from('terms').select('id, class_sessions(id, session_date)').eq('is_active', true).maybeSingle(),
    supabase
      .from('homework_assignments')
      .select('student_id, is_completed, behavior_satisfactory, homework!inner(surah_number, term_id, terms!inner(is_active))')
      .eq('homework.terms.is_active', true),
    supabase.from('iqra_progress').select('student_id, current_book, current_page'),
    supabase.from('quran_progress').select('student_id, current_surah, current_juz'),
    supabase
      .from('attendance_records')
      .select('student_id, session_id, status, class_sessions!inner(terms!inner(is_active))')
      .eq('class_sessions.terms.is_active', true),
  ]);
  if (students.error) throw students.error;

  const sessions = (term.data?.class_sessions ?? []) as { id: string; session_date: string }[];
  const pastSessions = new Set(sessions.filter((s) => s.session_date <= today).map((s) => s.id));
  const iqraMap = new Map((iqra.data ?? []).map((r) => [r.student_id, r]));
  const quranMap = new Map((quran.data ?? []).map((r) => [r.student_id, r]));

  return (students.data ?? []).map((s) => {
    const mine = (assignments.data ?? []).filter((a) => a.student_id === s.id);
    const completed = mine.filter((a) => a.is_completed).length;
    const notCompleted = mine.filter((a) => !a.is_completed && a.behavior_satisfactory !== null).length;
    const pending = mine.filter((a) => !a.is_completed && a.behavior_satisfactory === null).length;
    const attended = (attendance.data ?? []).filter(
      (r) => r.student_id === s.id && pastSessions.has(r.session_id) && r.status !== 'absent',
    ).length;

    const type = s.student_type as StudentType;
    let progress = 'Not set';
    if (type === 'iqra') {
      const p = iqraMap.get(s.id);
      if (p) progress = `Book ${p.current_book} · Page ${p.current_page}`;
    } else {
      // Quran position = lowest surah assigned (students go 114 → 1), as on the website
      const surahs = mine
        .map((a) => (a.homework as unknown as { surah_number: number | null }).surah_number)
        .filter((n): n is number => !!n);
      const q = quranMap.get(s.id);
      if (surahs.length) progress = `Surah ${surahName(Math.min(...surahs))}`;
      else if (q) progress = `Surah ${surahName(q.current_surah)}`;
    }

    return {
      id: s.id,
      name: (s.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Student',
      type,
      parentPhone: s.parent_phone,
      readyToAdvance: s.ready_to_advance ?? false,
      progress,
      attendanceRate: pastSessions.size ? Math.round((attended / pastSessions.size) * 100) : null,
      pendingHomework: pending,
      passRate: completed + notCompleted ? Math.round((completed / (completed + notCompleted)) * 100) : null,
    };
  });
}

export function useStudents() {
  const teacherId = useTeacherId();
  return useQuery({
    queryKey: ['teacher', 'students', teacherId],
    queryFn: () => fetchStudents(teacherId!),
    enabled: !!teacherId,
  });
}

export function useStudent(studentId: string) {
  const query = useStudents();
  return { ...query, data: query.data?.find((s) => s.id === studentId) };
}

// ── Attendance ──────────────────────────────────────────────────────────────

export interface SessionSummary {
  id: string;
  date: string;
  marked: number;
}

export function useTermSessions() {
  const teacherId = useTeacherId();
  return useQuery({
    queryKey: ['teacher', 'sessions', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const [term, records, students] = await Promise.all([
        supabase
          .from('terms')
          .select('id, name, class_sessions(id, session_date)')
          .eq('is_active', true)
          .order('session_date', { referencedTable: 'class_sessions' })
          .maybeSingle(),
        supabase
          .from('attendance_records')
          .select('session_id, student_id, class_sessions!inner(terms!inner(is_active))')
          .eq('class_sessions.terms.is_active', true),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('teacher_id', teacherId!).eq('is_active', true),
      ]);
      if (term.error) throw term.error;
      const markedBySession = new Map<string, number>();
      (records.data ?? []).forEach((r) =>
        markedBySession.set(r.session_id, (markedBySession.get(r.session_id) ?? 0) + 1),
      );
      const sessions: SessionSummary[] = ((term.data?.class_sessions ?? []) as { id: string; session_date: string }[])
        .map((s) => ({ id: s.id, date: s.session_date, marked: markedBySession.get(s.id) ?? 0 }));
      return { termName: term.data?.name ?? null, sessions, studentCount: students.count ?? 0 };
    },
  });
}

export function useSessionAttendance(sessionId: string) {
  return useQuery({
    queryKey: ['teacher', 'session', sessionId],
    queryFn: async () => {
      const [session, records] = await Promise.all([
        supabase.from('class_sessions').select('id, session_date').eq('id', sessionId).single(),
        supabase.from('attendance_records').select('student_id, status').eq('session_id', sessionId),
      ]);
      if (session.error) throw session.error;
      const statuses: Record<string, AttendanceStatus> = {};
      (records.data ?? []).forEach((r) => {
        if (r.status === 'present' || r.status === 'late' || r.status === 'absent') statuses[r.student_id] = r.status;
      });
      return { date: session.data.session_date as string, statuses };
    },
  });
}

export function useSaveAttendance(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (statuses: Record<string, AttendanceStatus>) => {
      const rows = Object.entries(statuses).map(([studentId, status]) => ({
        session_id: sessionId,
        student_id: studentId,
        status,
        recorded_at: new Date().toISOString(),
      }));
      if (!rows.length) return;
      const { error } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'session_id,student_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher'] }),
  });
}

// ── Homework ────────────────────────────────────────────────────────────────

export function useStudentHomework(studentId: string) {
  return useQuery({
    queryKey: ['teacher', 'homework', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select(
          'id, is_completed, behavior_satisfactory, teacher_feedback, assigned_at, homework:homework_id(id, title, instructions, surah_number, due_date, book_reference, term_id, terms(is_active))',
        )
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((a) => {
          const hw = a.homework as unknown as {
            id: string;
            title: string;
            instructions: string | null;
            surah_number: number | null;
            due_date: string | null;
            book_reference: string | null;
            term_id: string | null;
            terms: { is_active: boolean } | null;
          } | null;
          return {
            assignment: {
              id: a.id,
              homeworkId: hw?.id ?? '',
              title: hw?.title ?? 'Homework',
              instructions: hw?.instructions ?? null,
              surahNumber: hw?.surah_number ?? null,
              dueDate: hw?.due_date ?? null,
              bookReference: hw?.book_reference ?? null,
              assignedAt: a.assigned_at,
              isCompleted: a.is_completed,
              behaviorSatisfactory: a.behavior_satisfactory,
              feedback: a.teacher_feedback,
              termId: hw?.term_id ?? null,
            } satisfies Assignment,
            activeTerm: hw?.terms?.is_active ?? false,
          };
        })
        // Current term only, like the website's default tab
        .filter((x) => x.activeTerm)
        .map((x) => x.assignment);
    },
  });
}

export interface FeedbackInput {
  assignmentId: string;
  isCompleted: boolean;
  behaviorSatisfactory: boolean;
  feedback: string | null;
}

export function useSaveFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: FeedbackInput) => {
      const { error } = await supabase
        .from('homework_assignments')
        .update({
          is_completed: f.isCompleted,
          completed_at: f.isCompleted ? new Date().toISOString() : null,
          behavior_satisfactory: f.behaviorSatisfactory,
          teacher_feedback: f.feedback,
        })
        .eq('id', f.assignmentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher'] }),
  });
}

export interface NewHomework {
  studentId: string;
  title: string;
  bookReference: string | null;
  surahNumber: number | null;
  dueDate: string | null;
  instructions: string | null;
}

export function useAssignHomework() {
  const qc = useQueryClient();
  const teacherId = useTeacherId();
  return useMutation({
    mutationFn: async (h: NewHomework) => {
      const { data: term } = await supabase.from('terms').select('id').eq('is_active', true).maybeSingle();
      const { data: hw, error } = await supabase
        .from('homework')
        .insert({
          teacher_id: teacherId,
          title: h.title,
          instructions: h.instructions,
          due_date: h.dueDate,
          book_reference: h.bookReference,
          surah_number: h.surahNumber,
          term_id: term?.id ?? null,
        })
        .select('id')
        .single();
      if (error || !hw) throw error ?? new Error('Could not create homework');
      const { error: aErr } = await supabase
        .from('homework_assignments')
        .insert({ homework_id: hw.id, student_id: h.studentId });
      if (aErr) throw aErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher'] }),
  });
}

export function useUpdateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (h: Omit<NewHomework, 'studentId'> & { homeworkId: string }) => {
      const { error } = await supabase
        .from('homework')
        .update({
          title: h.title,
          instructions: h.instructions,
          due_date: h.dueDate,
          book_reference: h.bookReference,
          surah_number: h.surahNumber,
        })
        .eq('id', h.homeworkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher'] }),
  });
}

export function useNextClass() {
  return useQuery({
    queryKey: ['next-class', localDateString()],
    queryFn: async () => {
      const { data } = await supabase
        .from('class_sessions')
        .select('session_date')
        .gt('session_date', localDateString())
        .order('session_date')
        .limit(1)
        .maybeSingle();
      return (data?.session_date as string | undefined) ?? null;
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from('homework_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher'] }),
  });
}

export function useIqraBook(studentId: string) {
  return useQuery({
    queryKey: ['teacher', 'iqra', studentId],
    queryFn: async () => {
      const { data } = await supabase.from('iqra_progress').select('current_book').eq('student_id', studentId).maybeSingle();
      return (data?.current_book as number | undefined) ?? 1;
    },
  });
}
