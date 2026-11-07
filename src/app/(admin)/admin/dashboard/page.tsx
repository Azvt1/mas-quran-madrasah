import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Users, GraduationCap, UserCheck, ArrowRightCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { format } from 'date-fns'

export default async function AdminDashboard() {
  await requireRole('admin')
  const supabase = await createClient()

  // Counts + students flagged for advancement (with names) in one round trip
  const adminClient = createAdminClient()
  const [{ count: teacherCount }, { count: studentCount }, { data: advanceRows }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    adminClient
      .from('students')
      .select('id, student_type, advance_note, advance_requested_at, profiles:profile_id(full_name)')
      .eq('ready_to_advance', true)
      .order('advance_requested_at'),
  ])

  const pendingStudents = (advanceRows ?? []).map(s => ({
    id:           s.id as string,
    name:         ((s.profiles as any)?.full_name ?? '—') as string,
    student_type: s.student_type as string,
    note:         s.advance_note as string | null,
    requestedAt:  s.advance_requested_at as string | null,
  }))

  const stats = [
    { label: 'Teachers',    value: teacherCount ?? 0,                          icon: UserCheck,    color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Students',    value: studentCount ?? 0,                          icon: GraduationCap,color: 'text-teal-600',   bg: 'bg-teal-50' },
    { label: 'Total Users', value: (teacherCount ?? 0) + (studentCount ?? 0),  icon: Users,        color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your madrasa</p>
        </div>
        <Link href="/admin/users/new" className={buttonVariants({ size: 'sm', className: 'bg-teal-600 hover:bg-teal-700' })}>
          Add user
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <Icon size={18} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending transfers */}
      {pendingStudents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightCircle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Pending transfers
              <span className="ml-2 text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {pendingStudents.length}
              </span>
            </h2>
          </div>
          <div className="bg-white border border-amber-200 rounded-lg overflow-hidden divide-y divide-amber-50">
            {pendingStudents.map(s => (
              <Link
                key={s.id}
                href={`/admin/users/${s.id}/reassign`}
                className="flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <span className="text-xs text-slate-400 capitalize">{s.student_type}</span>
                  </div>
                  {s.note && (
                    <p className="text-xs text-slate-500 mt-0.5 italic">"{s.note}"</p>
                  )}
                  {s.requestedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested {format(new Date(s.requestedAt), 'd MMM yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Reassign
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/users/new"
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
          >
            <UserCheck size={18} className="text-teal-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Add a teacher</p>
              <p className="text-xs text-slate-500">Create a new teacher account</p>
            </div>
          </Link>
          <Link
            href="/admin/users/new?role=student"
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
          >
            <GraduationCap size={18} className="text-teal-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Enrol a student</p>
              <p className="text-xs text-slate-500">Create a new student account</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
