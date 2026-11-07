'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveFileMetadataAction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'admin') return { error: 'Not authorised.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only.' }

  const title       = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const file_url    = formData.get('file_url') as string
  const file_type   = formData.get('file_type') as 'pdf' | 'audio' | 'image'
  const file_size   = parseInt(formData.get('file_size') as string) || null

  if (!title)    return { error: 'Title is required.' }
  if (!file_url) return { error: 'No file URL. Please try uploading again.' }

  const { error } = await supabase.from('library_files').insert({
    teacher_id: user.id,
    title,
    description,
    file_url,
    file_type,
    file_size,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/library')
  return { success: true }
}

export async function deleteFileAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'admin') return

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return

  const fileId  = formData.get('file_id') as string
  const fileUrl = formData.get('file_url') as string

  // Delete from storage (extract path from URL)
  const urlParts = fileUrl.split('/storage/v1/object/public/library/')
  if (urlParts[1]) {
    await supabase.storage.from('library').remove([decodeURIComponent(urlParts[1])])
  }

  await supabase.from('library_files').delete().eq('id', fileId)
  revalidatePath('/admin/library')
}
