import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { BookOpen, ChevronRight, AlertTriangle } from 'lucide-react'

function CompletionBar({ rate, atRisk }: { rate: number; atRisk: boolean }) {
  const color     = atRisk ? 'bg-red-400' : rate >= 80 ? 'bg-teal-500' : 'bg-amber-400'
  const textColor = atRisk ? 'text-red-600' : rate >= 80 ? 'text-teal-600' : 'text-amber-600'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{rate}%</span>
      {atRisk && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
    </div>
  )
}

export default async function TeacherHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>
}) {
  const supabase = await createClient()
  const user = await requireRole('teacher')

  const { term: termParam } = await searchParams

  // One round trip. Names come via the admin client (profiles RLS hides
  // them from teachers); assignments are RLS-scoped to this teacher's homework.
  const admin = createAdminClient()
  const [{ data: studentRows }, { data: allTerms }, { data: allAssignments }] = await Promise.all([
    admin.from('students').select('id, student_type, profile_id, profiles:profile_id(full_name)')
      .eq('teacher_id', user.id).eq('is_active', true).order('enrollment_date'),
    supabase.from('terms').select('id, name, is_active').order('start_date', { ascending: false }),
    supabase.from('homework_assignments')
      .select('student_id, is_completed, behavior_satisfactory, homework:homework_id(term_id)'),
  ])

  if (!studentRows || studentRows.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Homework</h1>
        <p className="text-sm text-slate-500">No active students yet.</p>
      </div>
    )
  }

  const activeTerm   = allTerms?.find(t => t.is_active)
  const selectedTerm = termParam
    ? allTerms?.find(t => t.id === termParam) ?? activeTerm
    : activeTerm

  const studentIds = studentRows.map(s => s.id)
  const profileMap = new Map(studentRows.map(s => [s.profile_id, (s.profiles as any)?.full_name as string]))

  // Only count assignments for the selected term
  const termAssignments = (allAssignments ?? []).filter(
    a => (a.homework as any)?.term_id === selectedTerm?.id
  )

  const statsMap = new Map<string, { total: number; completed: number; pending: number }>()
  studentIds.forEach(id => statsMap.set(id, { total: 0, completed: 0, pending: 0 }))
  termAssignments.forEach(a => {
    const s = statsMap.get(a.student_id)
    if (!s) return
    s.total++
    if (a.is_completed) s.completed++
    // pending = no feedback given yet
    else if (a.behavior_satisfactory === null) s.pending++
  })

  const students = studentRows.map(s => {
    const stats        = statsMap.get(s.id) ?? { total: 0, completed: 0, pending: 0 }
    const notCompleted = stats.total - stats.completed - stats.pending
    const assessed     = stats.completed + notCompleted
    const rate         = assessed > 0 ? Math.round((stats.completed / assessed) * 100) : null
    const atRisk       = rate !== null && assessed >= 3 && rate < 80
    return {
      id:           s.id,
      full_name:    profileMap.get(s.profile_id) ?? '—',
      student_type: s.student_type as string,
      pending: stats.pending, total: stats.total, completed: stats.completed, rate, atRisk,
    }
  })

  const atRiskCount = students.filter(s => s.atRisk).length
  const iqra  = students.filter(s => s.student_type === 'iqra')
  const quran = students.filter(s => s.student_type === 'quran')

  const StudentList = ({ items }: { items: typeof students }) => (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
      {items.map(s => (
        <Link
          key={s.id}
          href={`/teacher/homework/student/${s.id}${selectedTerm ? `?term=${selectedTerm.id}` : ''}`}
          className={`flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group ${
            s.atRisk ? 'bg-red-50/40 hover:bg-red-50/60' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              s.atRisk ? 'bg-red-50' : 'bg-teal-50'
            }`}>
              <BookOpen size={14} className={s.atRisk ? 'text-red-500' : 'text-teal-600'} />
            </div>
            <div>
              <p className={`text-sm font-medium ${s.atRisk ? 'text-red-700' : 'text-slate-900'}`}>
                {s.full_name}
              </p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{s.student_type}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {s.rate !== null && <CompletionBar rate={s.rate} atRisk={s.atRisk} />}
            {s.pending > 0 && (
              <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                {s.pending} pending
              </span>
            )}
            {s.total === 0 && (
              <span className="text-xs text-slate-300">No homework yet</span>
            )}
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Homework</h1>
          <p className="text-sm text-slate-400 mt-0.5 text-sm">{selectedTerm?.name ?? 'All terms'}</p>
        </div>
        {atRiskCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg">
            <AlertTriangle size={13} />
            {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} below 80%
          </div>
        )}
      </div>

      {/* Term tabs */}
      {allTerms && allTerms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allTerms.map(t => (
            <Link
              key={t.id}
              href={`/teacher/homework?term=${t.id}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                t.id === selectedTerm?.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t.name}
              {t.is_active && t.id !== selectedTerm?.id && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 inline-block align-middle" />
              )}
            </Link>
          ))}
        </div>
      )}

      {iqra.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Iqra</p>
          <StudentList items={iqra} />
        </div>
      )}

      {quran.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quran</p>
          <StudentList items={quran} />
        </div>
      )}
    </div>
  )
}
