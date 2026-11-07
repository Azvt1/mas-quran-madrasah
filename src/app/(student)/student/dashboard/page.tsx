import { createClient, requireRole } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, CalendarCheck, TrendingUp, ChevronRight, Clock } from 'lucide-react'
import { parseISO, startOfDay, format } from 'date-fns'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function StudentDashboard() {
  const supabase = await createClient()
  const user = await requireRole('student')

  // One round trip. The student's own profile comes from requireRole(); every
  // other query is RLS-scoped to this student's own rows.
  const profile = user
  const [
    { data: student },
    { data: pendingRows },
    { data: term },
    { data: iqraRow },
    { data: quranRow },
    { data: termAtt },
  ] = await Promise.all([
    supabase.from('students')
      .select('id, student_type, profile_id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .single(),
    // pending = no teacher feedback yet (see CLAUDE.md homework logic)
    supabase.from('homework_assignments')
      .select('id, homework:homework_id(title, due_date)')
      .eq('is_completed', false)
      .is('behavior_satisfactory', null),
    supabase.from('terms').select('id, name, class_sessions(id, session_date)').eq('is_active', true).single(),
    supabase.from('iqra_progress').select('current_book, current_page').maybeSingle(),
    supabase.from('quran_progress').select('current_surah, current_juz, current_page').maybeSingle(),
    supabase.from('attendance_records')
      .select('session_id, status, class_sessions!inner(terms!inner(is_active))')
      .eq('class_sessions.terms.is_active', true),
  ])

  if (!student) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">{greeting()}, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500">Your student account isn't set up yet. Ask your admin.</p>
      </div>
    )
  }

  const today = startOfDay(new Date())

  const sessions = ((term as any)?.class_sessions ?? []) as { id: string; session_date: string }[]
  const pastSessionIds = sessions
    .filter(s => startOfDay(parseISO(s.session_date)) <= today)
    .map(s => s.id)
  const pastSessionSet = new Set(pastSessionIds)
  const attRecords = (termAtt ?? []).filter(r => pastSessionSet.has(r.session_id))

  // Pending homework, soonest due first (no due date last)
  const pendingHw = (pendingRows ?? [])
    .map(r => ({ id: r.id, ...(r.homework as any as { title: string; due_date: string | null }) }))
    .sort((x, y) => (x.due_date ?? '9999').localeCompare(y.due_date ?? '9999'))

  const attended = (attRecords ?? []).filter(r => r.status === 'present' || r.status === 'late').length
  const attRate  = pastSessionIds.length > 0 ? Math.round((attended / pastSessionIds.length) * 100) : null

  // Derived values
  const pendingCount  = pendingHw?.length ?? 0
  const nextDue       = pendingHw?.[0]

  const progressLabel = student.student_type === 'iqra'
    ? (iqraRow ? `Book ${iqraRow.current_book}, P.${iqraRow.current_page}` : 'Not set')
    : (quranRow ? `Surah ${quranRow.current_surah} · Juz ${quranRow.current_juz}` : 'Not set')

  const stats = [
    {
      label: 'Homework due',
      value: pendingCount,
      sub:   nextDue?.due_date ? `Next: ${format(parseISO(nextDue.due_date), 'd MMM')}` : pendingCount === 0 ? 'All done!' : undefined,
      color: pendingCount > 0 ? 'text-amber-600' : 'text-teal-600',
      href:  '/student/homework',
    },
    {
      label: 'Attendance',
      value: attRate !== null ? `${attRate}%` : '—',
      sub:   pastSessionIds.length > 0 ? `${attended}/${pastSessionIds.length} sessions` : 'No sessions yet',
      color: attRate === null ? 'text-slate-400' : attRate < 80 ? 'text-red-500' : 'text-teal-600',
      href:  '/student/attendance',
    },
    {
      label: student.student_type === 'iqra' ? 'Current book' : 'Current position',
      value: progressLabel,
      sub:   student.student_type === 'iqra' ? 'Iqra' : 'Quran',
      color: 'text-blue-600',
      href:  '/student/progress',
    },
  ]

  const quickLinks = [
    { href: '/student/homework',  icon: BookOpen,      label: 'Homework',   desc: `${pendingCount} pending` },
    { href: '/student/progress',  icon: TrendingUp,    label: 'Progress',   desc: progressLabel },
    { href: '/student/attendance',icon: CalendarCheck, label: 'Attendance', desc: attRate !== null ? `${attRate}% this term` : 'View sessions' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {greeting()}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {student.student_type === 'iqra' ? 'Iqra student' : 'Quran student'}
          {term ? ` · ${term.name}` : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-slate-200 rounded-lg px-4 py-4 hover:border-teal-200 hover:bg-teal-50/30 transition-colors"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
          </Link>
        ))}
      </div>

      {/* Next homework */}
      {nextDue && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Next due</h2>
          <Link
            href="/student/homework"
            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 hover:bg-amber-100/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Clock size={15} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">{nextDue.title}</p>
                {nextDue.due_date && (
                  <p className="text-xs text-amber-600 mt-0.5">Due {format(parseISO(nextDue.due_date), 'EEE, d MMM')}</p>
                )}
              </div>
            </div>
            <ChevronRight size={15} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick access</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
          {quickLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
