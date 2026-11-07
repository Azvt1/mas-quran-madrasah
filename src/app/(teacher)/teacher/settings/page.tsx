import { requireRole } from '@/lib/supabase/server'
import AccountSettings from '@/components/shared/AccountSettings'

export default async function TeacherSettingsPage() {
  await requireRole('teacher')

  return <AccountSettings />
}
