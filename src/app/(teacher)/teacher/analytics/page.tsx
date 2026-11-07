import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseISO, startOfDay } from 'date-fns'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function TeacherAnalyticsPage() {
  const supabase = await createClient()
  const user = await requireRole('teacher')

  // One round trip. Names via the admin client (filtered to this teacher);
  // everything else is RLS-scoped to this teacher's students and filtered to
  // the active term.
  const admin = createAdminClient()
  const [
    { data: studentRows },
    { data: term },
    { data: allHwAssignments },
    { data: iqraRows },
    { data: quranRows },
    { data: termAtt },
  ] = await Promise.all([
    admin
      .from('students')
      .select('id, student_type, profile_id, profiles:profile_id(full_name)')
      .eq('teacher_id', user.id)
      .eq('is_active', true)
      .order('enrollment_date'),
    supabase.from('terms').select('id, name, class_sessions(id, session_date)').eq('is_active', true).single(),
    supabase.from('homework_assignments').select('student_id, is_completed'),
    supabase.from('iqra_progress').select('student_id, current_book, current_page'),
    supabase.from('quran_progress').select('student_id, current_surah, current_juz, current_page'),
    supabase.from('attendance_records')
      .select('student_id, session_id, status, class_sessions!inner(terms!inner(is_active))')
      .eq('class_sessions.terms.is_active', true),
  ])

  if (!studentRows || studentRows.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">No active students yet.</p>
      </div>
    )
  }

  const studentIds = studentRows.map(s => s.id)
  const today      = startOfDay(new Date())
  const profileMap = new Map(studentRows.map(s => [s.profile_id, (s.profiles as any)?.full_name as string]))
  const studentIdSet  = new Set(studentIds)
  const hwAssignments = (allHwAssignments ?? []).filter(a => studentIdSet.has(a.student_id))
  const iqraMap    = new Map((iqraRows    ?? []).map(r => [r.student_id, r]))
  const quranMap   = new Map((quranRows   ?? []).map(r => [r.student_id, r]))

  const sessions        = ((term as any)?.class_sessions ?? []) as { id: string; session_date: string }[]
  const pastSessions    = sessions.filter(s => startOfDay(parseISO(s.session_date)) <= today)
  const pastSessionIds  = pastSessions.map(s => s.id)
  const pastSessionSet  = new Set(pastSessionIds)
  const attRecords      = (termAtt ?? []).filter(r => pastSessionSet.has(r.session_id))

  const attMap = new Map<string, { present: number; late: number }>()
  studentIds.forEach(id => attMap.set(id, { present: 0, late: 0 }))
  attRecords?.forEach(r => {
    const a = attMap.get(r.student_id)
    if (!a) return
    if (r.status === 'present') a.present++
    if (r.status === 'late')    a.late++
  })

  const hwMap = new Map<string, { total: number; done: number }>()
  studentIds.forEach(id => hwMap.set(id, { total: 0, done: 0 }))
  hwAssignments?.forEach(a => {
    const h = hwMap.get(a.student_id)
    if (!h) return
    h.total++
    if (a.is_completed) h.done++
  })

  // Build enriched rows
  const students = studentRows.map(s => {
    const att      = attMap.get(s.id)!
    const attended = att.present + att.late
    const rate     = pastSessions.length > 0 ? Math.round((attended / pastSessions.length) * 100) : 100
    const atRisk   = pastSessions.length > 0 && rate < 80
    const hw       = hwMap.get(s.id)!
    const hwRate   = hw.total > 0 ? Math.round((hw.done / hw.total) * 100) : null
    return {
      id:   s.id,
      name: profileMap.get(s.profile_id) ?? '—',
      type: s.student_type as 'iqra' | 'quran',
      rate, atRisk, attended,
      hwTotal: hw.total, hwDone: hw.done, hwRate,
    }
  }).sort((a, b) => a.rate - b.rate)

  const totalStudents  = students.length
  const atRiskCount    = students.filter(s => s.atRisk).length
  const avgRate        = Math.round(students.reduce((s, r) => s + r.rate, 0) / totalStudents)
  const totalHw        = hwAssignments?.length ?? 0
  const completedHw    = hwAssignments?.filter(a => a.is_completed).length ?? 0
  const hwCompletionRate = totalHw > 0 ? Math.round((completedHw / totalHw) * 100) : 0

  const iqraStudents  = studentRows.filter(s => s.student_type === 'iqra')
  const quranStudents = studentRows.filter(s => s.student_type === 'quran')
  const bookDist = [1,2,3,4,5,6].map(book => ({
    book,
    count: iqraStudents.filter(s => iqraMap.get(s.id)?.current_book === book).length,
  }))
  const maxBookCount = Math.max(...bookDist.map(b => b.count), 1)

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {term?.name ?? 'Current term'} · your students
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Students"        value={totalStudents}          color="text-slate-800" />
        <StatCard label="Avg attendance"  value={`${avgRate}%`}          color={avgRate < 80 ? 'text-red-500' : 'text-teal-600'} sub={`${pastSessions.length} sessions held`} />
        <StatCard label="At risk"         value={atRiskCount}            color={atRiskCount > 0 ? 'text-red-500' : 'text-teal-600'} sub="below 80%" />
        <StatCard label="Homework done"   value={`${hwCompletionRate}%`} color={hwCompletionRate >= 80 ? 'text-teal-600' : 'text-amber-500'} sub={`${completedHw}/${totalHw}`} />
      </div>

      {/* Attendance per student */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Attendance — {pastSessions.length} session{pastSessions.length !== 1 ? 's' : ''} held
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
          {students.map(s => (
            <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${s.atRisk ? 'bg-red-50/40' : ''}`}>
              <div className="w-32 shrink-0">
                <p className="text-xs font-medium text-slate-900 truncate">{s.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{s.type}</p>
              </div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.atRisk ? 'bg-red-400' : 'bg-teal-500'}`}
                  style={{ width: `${s.rate}%` }}
                />
              </div>
              <span className={`text-xs font-semibold tabular-nums w-9 text-right ${s.atRisk ? 'text-red-500' : 'text-slate-700'}`}>
                {s.rate}%
              </span>
              <span className="text-[10px] text-slate-400 w-12 text-right shrink-0">
                {s.attended}/{pastSessions.length}
              </span>
              {s.atRisk
                ? <AlertTriangle size={13} className="text-red-400 shrink-0" />
                : <div className="w-[13px]" />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Homework per student */}
      {totalHw > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Homework completion</h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {students
              .filter(s => s.hwTotal > 0)
              .sort((a, b) => (b.hwRate ?? 0) - (a.hwRate ?? 0))
              .map(s => {
                const rate = s.hwRate ?? 0
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-32 shrink-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.hwDone}/{s.hwTotal} completed</p>
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${rate >= 80 ? 'bg-teal-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-9 text-right text-slate-700">{rate}%</span>
                    <div className="w-[13px]" />
                  </div>
                )
              })}
            {students.filter(s => s.hwTotal === 0).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-32 shrink-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400">No homework assigned</p>
                </div>
                <div className="flex-1" />
                <CheckCircle2 size={13} className="text-slate-300" />
                <div className="w-[13px]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Iqra */}
        {iqraStudents.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Iqra — book positions</h2>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {bookDist.map(({ book, count }) => (
                <div key={book} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-500 w-14 shrink-0">Book {book}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: count > 0 ? `${Math.round((count / maxBookCount) * 100)}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                </div>
              ))}
              {iqraStudents.filter(s => !iqraMap.get(s.id)).length > 0 && (
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Not set</span>
                  <span className="text-xs text-slate-400">{iqraStudents.filter(s => !iqraMap.get(s.id)).length}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quran */}
        {quranStudents.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quran — current positions</h2>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {quranStudents.map(s => {
                const p = quranMap.get(s.id)
                return (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-xs font-medium text-slate-900">{profileMap.get(s.profile_id) ?? '—'}</p>
                    {p ? (
                      <div className="text-right">
                        <p className="text-xs font-medium text-indigo-700">Surah {p.current_surah} · Juz {p.current_juz}</p>
                        <p className="text-[10px] text-slate-400">Page {p.current_page}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">Not set</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
