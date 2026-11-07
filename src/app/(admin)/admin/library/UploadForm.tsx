'use client'

import { useActionState, useRef, useState } from 'react'
import { saveFileMetadataAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Music, Image, X, CheckCircle2 } from 'lucide-react'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function detectType(file: File): 'pdf' | 'audio' | 'image' {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image'
}

export default function UploadForm() {
  const [state, action, isPending] = useActionState(saveFileMetadataAction, {})
  const [file, setFile]         = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const supabase = createClient()

  function handleFile(f: File) {
    setFile(f)
    setUploadedUrl(null)
    setUploadError(null)
  }

  async function uploadToStorage() {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('library').upload(path, file, { upsert: false })
    setUploading(false)
    if (error) { setUploadError(error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('library').getPublicUrl(data.path)
    setUploadedUrl(publicUrl)
  }

  const fileType = file ? detectType(file) : null
  const TypeIcon = fileType === 'pdf' ? FileText : fileType === 'audio' ? Music : Image

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className={`border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors ${
          dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <TypeIcon size={20} className="text-teal-600 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900 truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button type="button" onClick={() => { setFile(null); setUploadedUrl(null) }} className="ml-2 text-slate-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <Upload size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Drag & drop or <span className="text-teal-600 font-medium">browse</span></p>
            <p className="text-xs text-slate-400 mt-1">PDF, MP3, images</p>
            <input type="file" accept=".pdf,audio/*,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
        )}
      </div>

      {/* Upload to storage button */}
      {file && !uploadedUrl && (
        <div className="space-y-1">
          <Button type="button" variant="outline" onClick={uploadToStorage} disabled={uploading} className="w-full">
            {uploading ? 'Uploading to storage…' : 'Upload file to storage'}
          </Button>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>
      )}

      {uploadedUrl && (
        <p className="text-xs text-teal-600 flex items-center gap-1.5">
          <CheckCircle2 size={13} /> File uploaded — now fill in the details below and save.
        </p>
      )}

      {/* Metadata form — shown after upload */}
      {uploadedUrl && (
        <form ref={formRef} action={action} className="space-y-4">
          <input type="hidden" name="file_url"   value={uploadedUrl} />
          <input type="hidden" name="file_type"  value={fileType ?? 'pdf'} />
          <input type="hidden" name="file_size"  value={file?.size ?? 0} />

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Iqra Book 3" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input id="description" name="description" placeholder="e.g. Pages 1–32, full colour" />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">{state.error}</p>
          )}

          {state?.success && (
            <p className="text-sm text-teal-700 bg-teal-50 border border-teal-100 px-3 py-2 rounded-md flex items-center gap-2">
              <CheckCircle2 size={14} /> File saved to library.
            </p>
          )}

          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 w-full" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save to library'}
          </Button>
        </form>
      )}
    </div>
  )
}
