import { createClient, requireRole } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  present: { label: 'Present', icon: CheckCircle2, color: 'text-teal-600',  bg: 'bg-teal-50',  border: 'border-teal-100' },
  late:    { label: 'Late',    icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  absent:  { label: 'Absent',  icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-100' },
}

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const user = await requireRole('student')

  // One round trip: student record, active term with its sessions, and this
  // student's marks for the active term (RLS only returns their own rows).
  const [{ data: student }, { data: termRow }, { data: records }] = await Promise.all([
    supabase.from('students').select('id').eq('profile_id', user.id).single(),
    supabase
      .from('terms')
      .select('id, name, start_date, end_date, class_sessions(id, session_date, day_of_week)')
      .eq('is_active', true)
      .order('session_date', { referencedTable: 'class_sessions' })
      .single(),
    supabase
      .from('attendance_records')
      .select('session_id, status, notes, class_sessions!inner(terms!inner(is_active))')
      .eq('class_sessions.terms.is_active', true),
  ])

  if (!student) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">No student record found. Contact your admin.</p>
      </div>
    )
  }

  const term = termRow
  const sessions = (termRow?.class_sessions ?? []) as { id: string; session_date: string; day_of_week: string }[]

  if (!term) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">No active term. Ask your admin.</p>
      </div>
    )
  }

  const recordMap = new Map((records ?? []).map(r => [r.session_id, r]))

  // Stats — only count records for past sessions (future pre-marked sessions must not skew the rate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pastSessions   = (sessions ?? []).filter(s => parseISO(s.session_date) <= today)
  const pastSessionSet = new Set(pastSessions.map(s => s.id))
  const pastRecords    = (records ?? []).filter(r => pastSessionSet.has(r.session_id))
  const present  = pastRecords.filter(r => r.status === 'present').length
  const late   = pastRecords.filter(r => r.status === 'late').length
  const absent = pastRecords.filter(r => r.status === 'absent').length
  const attended = present + late
  const rate     = pastSessions.length > 0 ? Math.round((attended / pastSessions.length) * 100) : 100
  const isAtRisk = pastSessions.length > 0 && rate < 80

  // Group sessions by month
  const grouped = new Map<string, typeof sessions>()
  sessions?.forEach(s => {
    const month = format(parseISO(s.session_date), 'MMMM yyyy')
    if (!grouped.has(month)) grouped.set(month, [])
    grouped.get(month)!.push(s)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {term.name} · {format(parseISO(term.start_date), 'd MMM')} – {format(parseISO(term.end_date), 'd MMM yyyy')}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present',  value: present,  color: 'text-teal-700',  bg: 'bg-teal-50' },
          { label: 'Late',   value: late,   color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Absent', value: absent, color: 'text-red-600',   bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-lg px-4 py-3`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className={`text-xs font-medium ${stat.color} opacity-70 mt-0.5`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance rate */}
      <div className={`rounded-lg border px-5 py-4 flex items-center justify-between ${
        isAtRisk ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-200'
      }`}>
        <div>
          <p className={`text-sm font-medium ${isAtRisk ? 'text-red-700' : 'text-teal-700'}`}>
            Attendance rate
          </p>
          <p className={`text-xs mt-0.5 ${isAtRisk ? 'text-red-500' : 'text-teal-500'}`}>
            {attended} of {pastSessions.length} sessions attended
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isAtRisk ? 'bg-red-400' : 'bg-teal-500'}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <p className={`text-2xl font-bold tabular-nums ${isAtRisk ? 'text-red-700' : 'text-teal-700'}`}>
            {rate}%
          </p>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-5">
        {Array.from(grouped.entries()).map(([month, monthSessions]) => (
          <div key={month}>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{month}</h2>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {monthSessions!.map(session => {
                const record = recordMap.get(session.id)
                const sessionDate = parseISO(session.session_date)
                const isPast = sessionDate <= today
                const cfg = record ? STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] : null
                const Icon = cfg?.icon

                return (
                  <div key={session.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {format(sessionDate, 'EEE, d MMM')}
                      </p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">
                        {session.day_of_week}
                        {record?.notes && <span className="ml-1">· {record.notes}</span>}
                      </p>
                    </div>

                    {cfg && Icon ? (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    ) : isPast ? (
                      <span className="text-xs text-slate-300">Not recorded</span>
                    ) : (
                      <span className="text-xs text-slate-300">Upcoming</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
