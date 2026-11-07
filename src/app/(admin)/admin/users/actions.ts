'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient, getProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface CreateUserResult {
  error?: string
}

export async function createUserAction(
  _prevState: CreateUserResult,
  formData: FormData
): Promise<CreateUserResult> {
  // Verify the caller is an admin
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'admin') return { error: 'Not authorised.' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') return { error: 'Forbidden.' }

  // Parse form fields
  const role       = formData.get('role') as 'teacher' | 'student'
  const fullName   = (formData.get('full_name') as string).trim()
  const email      = (formData.get('email') as string).trim()
  const phone      = (formData.get('phone') as string | null)?.trim() || null
  const password   = formData.get('password') as string

  if (!role || !fullName || !email || !password) {
    return { error: 'Name, email, role, and password are required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // Student-specific fields
  const teacherId   = formData.get('teacher_id') as string | null
  const studentType = formData.get('student_type') as 'iqra' | 'quran' | null
  const dob         = formData.get('date_of_birth') as string | null
  const parentPhone = (formData.get('parent_phone') as string | null)?.trim() || null

  if (role === 'student' && (!teacherId || !studentType)) {
    return { error: 'Teacher assignment and student type are required for students.' }
  }

  const admin = createAdminClient()

  // Step 1: Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    if (authError?.message.includes('already been registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: authError?.message ?? 'Failed to create account.' }
  }

  const userId = authData.user.id

  // Step 2: Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id:        userId,
    role,
    full_name: fullName,
    phone,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Failed to create profile. Please try again.' }
  }

  // Step 3: If student — create student record + initial progress record
  if (role === 'student') {
    const { data: studentRecord, error: studentError } = await admin
      .from('students')
      .insert({
        profile_id:    userId,
        teacher_id:    teacherId,
        student_type:  studentType,
        date_of_birth: dob || null,
        parent_phone:  parentPhone,
      })
      .select('id')
      .single()

    if (studentError || !studentRecord) {
      await admin.auth.admin.deleteUser(userId)
      return { error: 'Failed to create student record. Please try again.' }
    }

    // Create initial progress record (empty starting point)
    if (studentType === 'iqra') {
      await admin.from('iqra_progress').insert({ student_id: studentRecord.id })
    } else {
      await admin.from('quran_progress').insert({ student_id: studentRecord.id })
    }
  }

  // Step 4: Log invitation record
  await admin.from('invitations').insert({
    created_by: user.id,
    email,
    phone,
    role,
    teacher_id: role === 'student' ? teacherId : null,
    sent_via:   'manual',
  })

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function updateParentPhoneAction(formData: FormData) {
  const user = await getProfile()
  if (user?.role !== 'admin') return

  const admin       = createAdminClient()
  const studentId   = formData.get('student_id') as string
  const parentPhone = (formData.get('parent_phone') as string).trim() || null

  await admin.from('students').update({ parent_phone: parentPhone }).eq('id', studentId)
  revalidatePath('/admin/users')
}
