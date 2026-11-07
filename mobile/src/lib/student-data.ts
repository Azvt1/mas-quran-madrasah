import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { localDateString } from '@/lib/greeting';
import { supabase } from '@/lib/supabase';

// Runs as the signed-in student; RLS only returns their own rows.

export interface StudentAssignment {
  id: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  behaviorSatisfactory: boolean | null;
  feedback: string | null;
  surahNumber: number | null;
  createdAt: string;
  activeTerm: boolean;
}

function useStudentKey() {
  const { profile } = useAuth();
  return profile?.role === 'student' ? profile.id : undefined;
}

export function useMyHomework() {
  const id = useStudentKey();
  return useQuery({
    queryKey: ['student', 'homework', id],
    enabled: !!id,
    queryFn: async (): Promise<StudentAssignment[]> => {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select(
          'id, is_completed, behavior_satisfactory, teacher_feedback, assigned_at, homework:homework_id(title, instructions, due_date, surah_number, created_at, terms(is_active))',
        )
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a) => {
        const hw = a.homework as unknown as {
          title: string;
          instructions: string | null;
          due_date: string | null;
          surah_number: number | null;
          created_at: string;
          terms: { is_active: boolean } | null;
        } | null;
        return {
          id: a.id,
          title: hw?.title ?? 'Homework',
          instructions: hw?.instructions ?? null,
          dueDate: hw?.due_date ?? null,
          isCompleted: a.is_completed,
          behaviorSatisfactory: a.behavior_satisfactory,
          feedback: a.teacher_feedback,
          surahNumber: hw?.surah_number ?? null,
          createdAt: hw?.created_at ?? a.assigned_at,
          activeTerm: hw?.terms?.is_active ?? false,
        };
      });
    },
  });
}

export type MyStatus = 'present' | 'late' | 'absent' | 'excused' | null;

export function useMyAttendance() {
  const id = useStudentKey();
  return useQuery({
    queryKey: ['student', 'attendance', id],
    enabled: !!id,
    queryFn: async () => {
      const today = localDateString();
      const [term, records] = await Promise.all([
        supabase
          .from('terms')
          .select('name, class_sessions(id, session_date)')
          .eq('is_active', true)
          .order('session_date', { referencedTable: 'class_sessions' })
          .maybeSingle(),
        supabase
          .from('attendance_records')
          .select('session_id, status, class_sessions!inner(terms!inner(is_active))')
          .eq('class_sessions.terms.is_active', true),
      ]);
      if (term.error) throw term.error;
      const byId = new Map((records.data ?? []).map((r) => [r.session_id, r.status as MyStatus]));
      const sessions = ((term.data?.class_sessions ?? []) as { id: string; session_date: string }[]).map((s) => ({
        id: s.id,
        date: s.session_date,
        status: byId.get(s.id) ?? null,
        past: s.session_date <= today,
      }));
      const past = sessions.filter((s) => s.past);
      const count = (st: MyStatus) => past.filter((s) => s.status === st).length;
      const attended = count('present') + count('late');
      return {
        termName: term.data?.name ?? null,
        sessions,
        present: count('present'),
        late: count('late'),
        absent: count('absent'),
        rate: past.length ? Math.round((attended / past.length) * 100) : null,
      };
    },
  });
}

export function useMyProgress() {
  const id = useStudentKey();
  return useQuery({
    queryKey: ['student', 'progress', id],
    enabled: !!id,
    queryFn: async () => {
      const [student, iqra] = await Promise.all([
        supabase.from('students').select('student_type, teacher:teacher_id(full_name)').eq('profile_id', id!).maybeSingle(),
        supabase.from('iqra_progress').select('current_book, current_page, updated_at').maybeSingle(),
      ]);
      if (student.error) throw student.error;
      return {
        type: (student.data?.student_type ?? 'iqra') as 'iqra' | 'quran',
        teacherName: (student.data?.teacher as unknown as { full_name: string } | null)?.full_name ?? null,
        iqra: iqra.data as { current_book: number; current_page: number; updated_at: string } | null,
      };
    },
  });
}
