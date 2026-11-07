import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Users, CalendarCheck, BookOpen, TrendingUp, BarChart2, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const user = await requireRole('teacher')

  const now   = new Date()
  const month = now.toISOString().slice(0, 7) // "2026-08"

  // One round trip. The teacher's own profile comes from requireRole();
  // student names via the admin client (filtered to this teacher); homework
  // assignments are RLS-scoped to this teacher's homework.
  const profile = user
  const admin = createAdminClient()
  const [
    { data: students },
    { data: sessions },
    { data: allHw },
  ] = await Promise.all([
    admin.from('students').select('id, profile_id, profiles:profile_id(full_name)').eq('teacher_id', user.id).eq('is_active', true),
    supabase.from('class_sessions')
      .select('id, session_date')
      .eq('teacher_id', user.id)
      .gte('session_date', `${month}-01`)
      .lte('session_date', `${month}-31`),
    supabase.from('homework_assignments').select('student_id, is_completed'),
  ])

  const studentIds    = new Set((students ?? []).map(s => s.id))
  const sessionCount  = sessions?.length ?? 0
  const activeHw      = (allHw ?? []).filter(h => studentIds.has(h.student_id))
  const profileMap    = new Map((students ?? []).map(s => [s.profile_id, (s.profiles as any)?.full_name as string]))
  const pendingCount  = (activeHw ?? []).filter(h => !h.is_completed).length
  const doneCount     = (activeHw ?? []).filter(h => h.is_completed).length

  // Per-student pending homework counts
  const pendingByStudent = new Map<string, number>()
  ;(activeHw ?? []).filter(h => !h.is_completed).forEach(h => {
    pendingByStudent.set(h.student_id, (pendingByStudent.get(h.student_id) ?? 0) + 1)
  })

  const greeting = (() => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const quickActions = [
    { href: '/teacher/attendance', icon: CalendarCheck, label: 'Mark Attendance',  color: 'bg-blue-50 text-blue-600' },
    { href: '/teacher/homework',   icon: BookOpen,      label: 'Assign Homework',   color: 'bg-amber-50 text-amber-600' },
    { href: '/teacher/progress',   icon: TrendingUp,    label: 'Update Progress',   color: 'bg-teal-50 text-teal-600' },
    { href: '/teacher/analytics',  icon: BarChart2,     label: 'View Analytics',    color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {greeting}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening in your classes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-50">
                <Users size={18} className="text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{students?.length ?? 0}</p>
                <p className="text-sm text-slate-500">Active students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <CalendarCheck size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{sessionCount}</p>
                <p className="text-sm text-slate-500">Sessions this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <BookOpen size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                <p className="text-sm text-slate-500">Pending homework</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-sm transition-all group"
            >
              <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Students homework snapshot */}
      {students && students.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Students — homework status</h2>
            <Link href="/teacher/homework" className="text-xs text-teal-600 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
            {students.map(s => {
              const pending = pendingByStudent.get(s.id) ?? 0
              return (
                <Link
                  key={s.id}
                  href={`/teacher/homework/student/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {profileMap.get(s.profile_id) ?? '—'}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    pending > 0
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-teal-50 text-teal-700 border border-teal-100'
                  }`}>
                    {pending > 0
                      ? <><Clock size={11} />{pending} pending</>
                      : <><CheckCircle2 size={11} />All done</>
                    }
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
