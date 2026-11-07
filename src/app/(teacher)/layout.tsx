import { redirect } from 'next/navigation'
import { getProfile, dashboardFor } from '@/lib/supabase/server'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  if (!profile) redirect('/login')
  if (profile.role !== 'teacher') redirect(dashboardFor(profile.role))

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <TeacherSidebar profile={profile} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
