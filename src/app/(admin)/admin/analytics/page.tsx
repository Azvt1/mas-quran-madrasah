import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, parseISO, startOfDay } from 'date-fns'
import { Users, CheckCircle2, AlertTriangle, BookOpen, TrendingUp } from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function AttendanceBar({ rate, atRisk }: { rate: number; atRisk: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atRisk ? 'bg-red-400' : 'bg-teal-500'}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-9 text-right ${atRisk ? 'text-red-500' : 'text-slate-700'}`}>
        {rate}%
      </span>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const supabase   = await createClient()
  const adminClient = createAdminClient()
  await requireRole('admin')

  const today = startOfDay(new Date())

  // One round trip: active term with sessions, students with student/teacher
  // names, homework, progress, and active-term attendance
  const [
    { data: term },
    { data: students },
    { data: allHwAssignments },
    { data: iqraProgress },
    { data: quranProgress },
    { data: termAtt },
  ] = await Promise.all([
    supabase.from('terms')
      .select('id, name, start_date, end_date, class_sessions(id, session_date)')
      .eq('is_active', true)
      .order('session_date', { referencedTable: 'class_sessions' })
      .single(),
    adminClient.from('students')
      .select('id, student_type, profile_id, teacher_id, profiles:profile_id(full_name), teacher:teacher_id(full_name)')
      .eq('is_active', true),
    supabase.from('homework_assignments').select('student_id, is_completed'),
    supabase.from('iqra_progress').select('student_id, current_book, current_page, updated_at'),
    supabase.from('quran_progress').select('student_id, current_surah, current_juz, current_page, updated_at'),
    supabase.from('attendance_records')
      .select('student_id, session_id, status, class_sessions!inner(terms!inner(is_active))')
      .eq('class_sessions.terms.is_active', true),
  ])

  if (!students || students.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">No active students yet.</p>
      </div>
    )
  }

  const profileMap = new Map<string, { full_name: string }>()
  students.forEach(s => {
    profileMap.set(s.profile_id, { full_name: (s.profiles as any)?.full_name })
    if (s.teacher_id) profileMap.set(s.teacher_id, { full_name: (s.teacher as any)?.full_name })
  })
  const activeIds     = new Set(students.map(s => s.id))
  const hwAssignments = (allHwAssignments ?? []).filter(a => activeIds.has(a.student_id))
  const iqraMap    = new Map((iqraProgress  ?? []).map(r => [r.student_id, r]))
  const quranMap   = new Map((quranProgress ?? []).map(r => [r.student_id, r]))

  const sessions       = ((term as any)?.class_sessions ?? []) as { id: string; session_date: string }[]
  const pastSessions   = sessions.filter(s => startOfDay(parseISO(s.session_date)) <= today)
  const pastSessionIds = pastSessions.map(s => s.id)
  const pastSessionSet = new Set(pastSessionIds)
  const attendanceRecords = (termAtt ?? []).filter(r => pastSessionSet.has(r.session_id))

  // Per-student attendance
  const attendanceMap = new Map<string, { present: number; late: number; total: number }>()
  students.forEach(s => attendanceMap.set(s.id, { present: 0, late: 0, total: pastSessions.length }))
  attendanceRecords?.forEach(r => {
    const a = attendanceMap.get(r.student_id)
    if (!a) return
    if (r.status === 'present') a.present++
    if (r.status === 'late')    a.late++
  })

  const hwMap = new Map<string, { total: number; completed: number }>()
  students.forEach(s => hwMap.set(s.id, { total: 0, completed: 0 }))
  hwAssignments?.forEach(a => {
    const h = hwMap.get(a.student_id)
    if (!h) return
    h.total++
    if (a.is_completed) h.completed++
  })

  const totalHw        = hwAssignments?.length ?? 0
  const completedHw    = hwAssignments?.filter(a => a.is_completed).length ?? 0
  const completionRate = totalHw > 0 ? Math.round((completedHw / totalHw) * 100) : 0

  // Per-teacher map
  const teacherMap = new Map<string, { name: string; studentIds: string[] }>()
  students.forEach(s => {
    if (!s.teacher_id) return
    if (!teacherMap.has(s.teacher_id)) {
      teacherMap.set(s.teacher_id, {
        name:       profileMap.get(s.teacher_id)?.full_name ?? '—',
        studentIds: [],
      })
    }
    teacherMap.get(s.teacher_id)!.studentIds.push(s.id)
  })

  // Build student rows
  const studentRows = students.map(s => {
    const att    = attendanceMap.get(s.id)!
    const hw     = hwMap.get(s.id)!
    const rate   = att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : 100
    const atRisk = att.total > 0 && rate < 80
    return {
      id:           s.id,
      name:         profileMap.get(s.profile_id)?.full_name ?? '—',
      student_type: s.student_type,
      teacher_id:   s.teacher_id,
      teacher_name: s.teacher_id ? (profileMap.get(s.teacher_id)?.full_name ?? '—') : '—',
      rate,
      atRisk,
      attended:     att.present + att.late,
      total:        att.total,
      hwTotal:      hw.total,
      hwDone:       hw.completed,
    }
  }).sort((a, b) => a.rate - b.rate)

  const atRiskCount = studentRows.filter(s => s.atRisk).length
  const avgRate     = studentRows.length > 0
    ? Math.round(studentRows.reduce((sum, s) => sum + s.rate, 0) / studentRows.length)
    : 0

  // Iqra book distribution
  const bookDist = [1, 2, 3, 4, 5, 6].map(book => ({
    book,
    count: students.filter(s => s.student_type === 'iqra' && iqraMap.get(s.id)?.current_book === book).length,
  }))
  const maxBookCount = Math.max(...bookDist.map(b => b.count), 1)

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {term ? `${term.name} · ${format(parseISO(term.start_date), 'd MMM')} – ${format(parseISO(term.end_date), 'd MMM yyyy')}` : 'Current term'}
        </p>
      </div>

      {/* ── 1. Top stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Avg attendance"     value={`${avgRate}%`}     color={avgRate < 80 ? 'text-red-500' : 'text-teal-600'} />
        <StatCard label="At-risk students"   value={atRiskCount}       color={atRiskCount > 0 ? 'text-red-500' : 'text-teal-600'} sub="below 80%" />
        <StatCard label="Homework assigned"  value={totalHw}           color="text-slate-800" />
        <StatCard label="Completion rate"    value={`${completionRate}%`} color={completionRate >= 80 ? 'text-teal-600' : 'text-amber-500'} sub={`${completedHw}/${totalHw}`} />
      </div>

      {/* ── 2. Attendance per student ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Attendance — all students</h2>
          <span className="text-xs text-slate-400">({pastSessions.length} sessions held)</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
          {studentRows.map(s => (
            <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${s.atRisk ? 'bg-red-50/50' : ''}`}>
              <div className="w-36 shrink-0">
                <p className="text-xs font-medium text-slate-900 truncate">{s.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{s.student_type} · {s.teacher_name}</p>
              </div>
              <AttendanceBar rate={s.rate} atRisk={s.atRisk} />
              <span className="text-[10px] text-slate-400 shrink-0 w-14 text-right">
                {s.attended}/{s.total}
              </span>
              {s.atRisk && <AlertTriangle size={13} className="text-red-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Homework per student ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Homework completion</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
          {studentRows.filter(s => s.hwTotal > 0).length === 0 ? (
            <p className="text-sm text-slate-400 px-4 py-6 text-center">No homework assigned yet.</p>
          ) : (
            studentRows
              .filter(s => s.hwTotal > 0)
              .sort((a, b) => (a.hwDone / a.hwTotal) - (b.hwDone / b.hwTotal))
              .map(s => {
                const rate      = Math.round((s.hwDone / s.hwTotal) * 100)
                const hwAtRisk  = s.hwTotal >= 3 && rate < 80
                return (
                  <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${hwAtRisk ? 'bg-red-50/40' : ''}`}>
                    <div className="w-36 shrink-0">
                      <p className={`text-xs font-medium truncate ${hwAtRisk ? 'text-red-700' : 'text-slate-900'}`}>{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.hwDone}/{s.hwTotal} completed</p>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${hwAtRisk ? 'bg-red-400' : rate >= 80 ? 'bg-teal-500' : 'bg-amber-400'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold tabular-nums w-9 text-right ${hwAtRisk ? 'text-red-600' : 'text-slate-700'}`}>{rate}%</span>
                    </div>
                    {hwAtRisk && <AlertTriangle size={13} className="text-red-400 shrink-0" />}
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* ── 4. Student progress ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Iqra book distribution */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Iqra — book distribution</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {bookDist.map(({ book, count }) => (
              <div key={book} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs font-semibold text-slate-500 w-14 shrink-0">Book {book}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: count > 0 ? `${Math.round((count / maxBookCount) * 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
              </div>
            ))}
            <div className="px-4 py-2.5 flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 w-14 shrink-0">Not set</span>
              <span className="text-xs text-slate-400">
                {students.filter(s => s.student_type === 'iqra' && !iqraMap.get(s.id)).length} students
              </span>
            </div>
          </div>
        </div>

        {/* Quran students */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Quran — current position</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {students.filter(s => s.student_type === 'quran').length === 0 ? (
              <p className="text-sm text-slate-400 px-4 py-6 text-center">No Quran students yet.</p>
            ) : (
              students.filter(s => s.student_type === 'quran').map(s => {
                const progress = quranMap.get(s.id)
                return (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-xs font-medium text-slate-900">{profileMap.get(s.profile_id)?.full_name ?? '—'}</p>
                      <p className="text-[10px] text-slate-400">{profileMap.get(s.teacher_id ?? '')?.full_name ?? '—'}</p>
                    </div>
                    {progress ? (
                      <div className="text-right">
                        <p className="text-xs font-medium text-indigo-700">
                          Surah {progress.current_surah} · Juz {progress.current_juz}
                        </p>
                        <p className="text-[10px] text-slate-400">Page {progress.current_page}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">Not set</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Per-teacher summary ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Per-teacher summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from(teacherMap.entries()).map(([teacherId, teacher]) => {
            const tStudents = teacher.studentIds
            const tRates    = tStudents.map(id => {
              const att = attendanceMap.get(id)!
              return att.total > 0 ? (att.present + att.late) / att.total : 1
            })
            const avgAtt    = tRates.length > 0 ? Math.round((tRates.reduce((a, b) => a + b, 0) / tRates.length) * 100) : 0
            const tHwTotal  = tStudents.reduce((sum, id) => sum + (hwMap.get(id)?.total ?? 0), 0)
            const tHwDone   = tStudents.reduce((sum, id) => sum + (hwMap.get(id)?.completed ?? 0), 0)
            const hwRate    = tHwTotal > 0 ? Math.round((tHwDone / tHwTotal) * 100) : 0
            const tAtRisk   = tStudents.filter(id => {
              const att = attendanceMap.get(id)!
              const r   = att.total > 0 ? (att.present + att.late) / att.total : 1
              return att.total > 0 && r < 0.8
            }).length

            return (
              <div key={teacherId} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{teacher.name}</p>
                  <p className="text-xs text-slate-400">{tStudents.length} student{tStudents.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Avg attendance</span>
                    <span className={`font-semibold ${avgAtt < 80 ? 'text-red-500' : 'text-teal-600'}`}>{avgAtt}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Homework done</span>
                    <span className="font-semibold text-slate-700">{hwRate}% <span className="font-normal text-slate-400">({tHwDone}/{tHwTotal})</span></span>
                  </div>
                  {tAtRisk > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertTriangle size={11} />
                      {tAtRisk} student{tAtRisk !== 1 ? 's' : ''} at risk
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
