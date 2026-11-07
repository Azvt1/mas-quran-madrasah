import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import Link from 'next/link'
import AttendanceTabs, { type StudentStat, type SessionRow } from './AttendanceTabs'

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>
}) {
  const supabase = await createClient()
  const admin = createAdminClient()

  await requireRole('admin')

  const { term: termParam } = await searchParams

  // All terms + students in parallel
  const [{ data: allTerms }, { data: studentRows }] = await Promise.all([
    supabase.from('terms').select('*').order('start_date', { ascending: false }),
    admin.from('students')
      .select('id, student_type, profile_id, teacher_id, profiles:profile_id(full_name), teacher:teacher_id(full_name)')
      .eq('is_active', true),
  ])

  if (!allTerms || allTerms.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">No terms found.</p>
      </div>
    )
  }

  const activeTerm   = allTerms.find(t => t.is_active)
  const selectedTerm = termParam
    ? allTerms.find(t => t.id === termParam) ?? activeTerm
    : activeTerm

  if (!selectedTerm) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">No active term found.</p>
      </div>
    )
  }

  const { data: allSessions } = await supabase.from('class_sessions').select('id, session_date, day_of_week')
    .eq('term_id', selectedTerm.id).order('session_date')

  const today = startOfDay(new Date())
  const pastSessions    = (allSessions ?? []).filter(s => !isAfter(parseISO(s.session_date), today))
  const pastSessionIds  = pastSessions.map(s => s.id)
  const profileMap      = new Map<string, string>()
  for (const s of studentRows ?? []) {
    profileMap.set(s.profile_id, (s.profiles as any)?.full_name)
    if (s.teacher_id) profileMap.set(s.teacher_id, (s.teacher as any)?.full_name)
  }

  // Attendance records — only for this term's past sessions
  const { data: records } = pastSessionIds.length > 0
    ? await admin
        .from('attendance_records')
        .select('session_id, student_id, status')
        .in('session_id', pastSessionIds)
    : { data: [] }

  // ── Build student stats ──────────────────────────────────────────────────
  const statsMap = new Map<string, StudentStat>()
  for (const s of studentRows ?? []) {
    statsMap.set(s.id, {
      id:             s.id,
      name:           profileMap.get(s.profile_id) ?? '—',
      teacherName:    profileMap.get(s.teacher_id)  ?? '—',
      studentType:    s.student_type,
      present: 0, late: 0, absent: 0,
      attendanceRate: pastSessions.length === 0 ? 100 : 0,
    })
  }

  for (const r of records ?? []) {
    const s = statsMap.get(r.student_id)
    if (!s) continue
    s[r.status as 'present' | 'late' | 'absent']++
  }

  for (const s of statsMap.values()) {
    if (pastSessions.length > 0) {
      s.attendanceRate = Math.round(((s.present + s.late) / pastSessions.length) * 100)
    }
  }

  const students: StudentStat[] = Array.from(statsMap.values()).sort(
    (a, b) => a.attendanceRate - b.attendanceRate
  )

  // ── Build session rows ───────────────────────────────────────────────────
  type StatusMap = { present: number; late: number; absent: number }
  const sessionStatsMap = new Map<string, StatusMap>()
  for (const r of records ?? []) {
    if (!sessionStatsMap.has(r.session_id)) {
      sessionStatsMap.set(r.session_id, { present: 0, late: 0, absent: 0 })
    }
    sessionStatsMap.get(r.session_id)![r.status as keyof StatusMap]++
  }

  const sessionRows: SessionRow[] = (allSessions ?? []).map(s => {
    const stats = sessionStatsMap.get(s.id)
    return {
      id:           s.id,
      session_date: s.session_date,
      day_of_week:  s.day_of_week,
      present:      stats?.present  ?? 0,
      late:         stats?.late     ?? 0,
      absent:       stats?.absent   ?? 0,
      isPast:       !isAfter(parseISO(s.session_date), today),
    }
  })

  const atRiskCount = students.filter(
    s => pastSessions.length > 0 && s.attendanceRate < 80
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {format(parseISO(selectedTerm.start_date), 'd MMM')} – {format(parseISO(selectedTerm.end_date), 'd MMM yyyy')}
          · {pastSessions.length} of {allSessions?.length ?? 0} sessions completed
        </p>
      </div>

      {/* Term tabs */}
      {allTerms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allTerms.map(t => (
            <Link
              key={t.id}
              href={`/admin/attendance?term=${t.id}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                t.id === selectedTerm.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t.name}
              {t.is_active && t.id !== selectedTerm.id && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 inline-block align-middle" />
              )}
            </Link>
          ))}
        </div>
      )}

      <AttendanceTabs
        students={students}
        sessions={sessionRows}
        totalStudents={students.length}
        pastSessionCount={pastSessions.length}
        atRiskCount={atRiskCount}
      />
    </div>
  )
}
