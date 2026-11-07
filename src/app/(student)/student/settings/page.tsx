import { requireRole } from '@/lib/supabase/server'
import AccountSettings from '@/components/shared/AccountSettings'

export default async function StudentSettingsPage() {
  await requireRole('student')

  return <AccountSettings />
}
