import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import EditParentPhone from './EditParentPhone'

export default async function UsersPage() {
  await requireRole('admin')
  const supabase = await createClient()
  const admin    = createAdminClient()

  // Teachers + students (with parent_phone) in parallel
  const [{ data: teachers }, { data: students }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .eq('role', 'teacher')
      .order('full_name'),
    admin
      .from('students')
      .select('id, student_type, is_active, enrollment_date, parent_phone, profile:profile_id(full_name, phone, created_at), teacher:teacher_id(full_name)')
      .order('enrollment_date', { ascending: false }),
  ])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage teachers and students</p>
        </div>
        <Link href="/admin/users/new" className={buttonVariants({ size: 'sm', className: 'bg-teal-600 hover:bg-teal-700' })}>
          <Plus size={15} className="mr-1.5" />
          Add user
        </Link>
      </div>

      {/* Teachers */}
      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-3">
          Teachers <span className="text-slate-400 font-normal">({teachers?.length ?? 0})</span>
        </h2>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers?.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{t.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.created_at)}</td>
                </tr>
              ))}
              {(!teachers || teachers.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">
                    No teachers yet.{' '}
                    <Link href="/admin/users/new" className="text-teal-600 hover:underline">
                      Add the first one.
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Students */}
      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-3">
          Students <span className="text-slate-400 font-normal">({students?.length ?? 0})</span>
        </h2>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Teacher</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Parent WhatsApp</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students?.map(s => {
                const profile = (Array.isArray(s.profile) ? s.profile[0] : s.profile) as { full_name: string; phone: string | null; created_at: string } | null
                const teacher = (Array.isArray(s.teacher) ? s.teacher[0] : s.teacher) as { full_name: string } | null
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{profile?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.student_type === 'quran' ? 'default' : 'secondary'} className="capitalize text-xs">
                        {s.student_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{teacher?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <EditParentPhone studentId={s.id} currentPhone={s.parent_phone ?? null} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.enrollment_date)}</td>
                  </tr>
                )
              })}
              {(!students || students.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">
                    No students yet.{' '}
                    <Link href="/admin/users/new?role=student" className="text-teal-600 hover:underline">
                      Enrol the first one.
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
