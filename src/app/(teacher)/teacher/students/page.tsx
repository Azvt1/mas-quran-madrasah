import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { parseISO, startOfDay } from 'date-fns'
import { CalendarCheck, BookOpen, TrendingUp, AlertTriangle, CheckCircle2, ArrowRightCircle } from 'lucide-react'
import WhatsAppButton from '@/components/shared/WhatsAppButton'

function AttendancePill({ rate, total }: { rate: number; total: number }) {
  if (total === 0) return <span className="text-xs text-slate-300">No sessions yet</span>
  const atRisk = rate < 80
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
      atRisk ? 'bg-red-50 text-red-600 border-red-100' : 'bg-teal-50 text-teal-700 border-teal-100'
    }`}>
      {atRisk && <AlertTriangle size={10} />}
      {rate}%
    </span>
  )
}

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  const user = await requireRole('teacher')

  // One round trip. Names come via the admin client (profiles RLS hides them
  // from teachers), filtered to this teacher. Everything else is RLS-scoped to
  // this teacher's students and narrowed to the active term below.
  const admin = createAdminClient()
  const [
    { data: studentRows },
    { data: term },
    { data: pendingHw },
    { data: iqraRows },
    { data: quranRows },
    { data: allAttRecords },
  ] = await Promise.all([
    admin.from('students').select('id, student_type, profile_id, ready_to_advance, parent_phone, profiles:profile_id(full_name)')
      .eq('teacher_id', user.id).eq('is_active', true).order('enrollment_date'),
    supabase.from('terms').select('id, class_sessions(id, session_date)').eq('is_active', true).single(),
    supabase.from('homework_assignments').select('student_id, homework:homework_id(term_id)')
      .eq('is_completed', false).is('behavior_satisfactory', null),
    supabase.from('iqra_progress').select('student_id, current_book, current_page'),
    supabase.from('quran_progress').select('student_id, current_surah, current_juz'),
    supabase.from('attendance_records').select('student_id, session_id, status, class_sessions!inner(terms!inner(is_active))')
      .eq('class_sessions.terms.is_active', true),
  ])

  if (!studentRows || studentRows.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Students</h1>
        <p className="text-sm text-slate-500">No active students assigned to you yet.</p>
      </div>
    )
  }

  const studentIds = studentRows.map(s => s.id)
  const profileMap = new Map(studentRows.map(s => [s.profile_id, (s.profiles as any)?.full_name as string]))
  const iqraMap    = new Map((iqraRows   ?? []).map(r => [r.student_id, r]))
  const quranMap   = new Map((quranRows  ?? []).map(r => [r.student_id, r]))

  const today = startOfDay(new Date())
  const sessions = ((term as any)?.class_sessions ?? []) as { id: string; session_date: string }[]
  const pastSessionIds = sessions
    .filter(s => startOfDay(parseISO(s.session_date)) <= today)
    .map(s => s.id)
  const pastSessionSet = new Set(pastSessionIds)
  const attRecords = (allAttRecords ?? []).filter(r => pastSessionSet.has(r.session_id))

  const attMap = new Map<string, { present: number; late: number }>()
  studentIds.forEach(id => attMap.set(id, { present: 0, late: 0 }))
  attRecords?.forEach(r => {
    const a = attMap.get(r.student_id)
    if (!a) return
    if (r.status === 'present') a.present++
    if (r.status === 'late')    a.late++
  })

  // Only count pending homework that belongs to the active term
  const activeTermId = term?.id ?? null
  const pendingMap = new Map<string, number>()
  pendingHw?.forEach(a => {
    const hwTermId = (a.homework as any)?.term_id ?? null
    if (activeTermId && hwTermId !== activeTermId) return  // skip other terms
    pendingMap.set(a.student_id, (pendingMap.get(a.student_id) ?? 0) + 1)
  })

  const students = studentRows.map(s => {
    const att     = attMap.get(s.id)!
    const attended = att.present + att.late
    const rate    = pastSessionIds.length > 0 ? Math.round((attended / pastSessionIds.length) * 100) : 100
    const progress = s.student_type === 'iqra'
      ? iqraMap.get(s.id)  ? `Book ${iqraMap.get(s.id)!.current_book}, Page ${iqraMap.get(s.id)!.current_page}` : null
      : quranMap.get(s.id) ? `Surah ${quranMap.get(s.id)!.current_surah} · Juz ${quranMap.get(s.id)!.current_juz}` : null
    return {
      id: s.id,
      name: profileMap.get(s.profile_id) ?? '—',
      student_type: s.student_type as string,
      ready_to_advance: s.ready_to_advance,
      parent_phone: (s as any).parent_phone as string | null,
      rate, totalSessions: pastSessionIds.length,
      pendingHw: pendingMap.get(s.id) ?? 0,
      progress,
    }
  })

  const iqra  = students.filter(s => s.student_type === 'iqra')
  const quran = students.filter(s => s.student_type === 'quran')

  const StudentCard = ({ s }: { s: typeof students[number] }) => (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${s.ready_to_advance ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{s.name}</p>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{s.student_type}</p>
        </div>
        {s.ready_to_advance && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
            <ArrowRightCircle size={10} /> Pending transfer
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CalendarCheck size={13} className="text-slate-400" />
          <AttendancePill rate={s.rate} total={s.totalSessions} />
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen size={13} className="text-slate-400" />
          {s.pendingHw > 0 ? (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              {s.pendingHw} pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-teal-600">
              <CheckCircle2 size={11} /> All done
            </span>
          )}
        </div>
        {s.progress && (
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500">{s.progress}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <Link href={`/teacher/homework/student/${s.id}`}
          className="flex-1 text-center text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 py-1.5 rounded-md border border-slate-200 hover:border-teal-200 transition-colors">
          Homework
        </Link>
        <Link href={`/teacher/progress/${s.id}`}
          className="flex-1 text-center text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 py-1.5 rounded-md border border-slate-200 hover:border-teal-200 transition-colors">
          Progress
        </Link>
        <Link href="/teacher/attendance"
          className="flex-1 text-center text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 py-1.5 rounded-md border border-slate-200 hover:border-teal-200 transition-colors">
          Attendance
        </Link>
      </div>
      <div className="pt-1 border-t border-slate-100">
        <WhatsAppButton parentPhone={s.parent_phone} studentName={s.name} />
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Students</h1>
        <p className="text-sm text-slate-500 mt-0.5">{students.length} active student{students.length !== 1 ? 's' : ''}</p>
      </div>
      {iqra.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Iqra</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {iqra.map(s => <StudentCard key={s.id} s={s} />)}
          </div>
        </div>
      )}
      {quran.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quran</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {quran.map(s => <StudentCard key={s.id} s={s} />)}
          </div>
        </div>
      )}
    </div>
  )
}
