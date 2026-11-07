import { createClient, requireRole } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { FileText, Music, Image, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UploadForm from './UploadForm'
import { deleteFileAction } from './actions'

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TYPE_CONFIG = {
  pdf:   { icon: FileText, label: 'PDF',   color: 'text-red-500',  bg: 'bg-red-50' },
  audio: { icon: Music,    label: 'Audio', color: 'text-violet-500', bg: 'bg-violet-50' },
  image: { icon: Image,    label: 'Image', color: 'text-blue-500', bg: 'bg-blue-50' },
}

export default async function AdminLibraryPage() {
  const supabase = await createClient()
  await requireRole('admin')

  const { data: files } = await supabase
    .from('library_files')
    .select('id, title, description, file_url, file_type, file_size, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Library</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload books and resources for students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upload panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Upload file</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadForm />
          </CardContent>
        </Card>

        {/* File list */}
        <div className="lg:col-span-2 space-y-3">
          {!files || files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-lg">
              <FileText size={28} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No files yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload your first file using the panel.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {files.map(file => {
                const cfg = TYPE_CONFIG[file.file_type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.pdf
                const Icon = cfg.icon
                return (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-slate-900 hover:text-teal-700 truncate block"
                      >
                        {file.title}
                      </a>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{formatBytes(file.file_size)}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{format(new Date(file.created_at), 'd MMM yyyy')}</span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{file.description}</p>
                      )}
                    </div>
                    <form action={deleteFileAction} className="shrink-0">
                      <input type="hidden" name="file_id"  value={file.id} />
                      <input type="hidden" name="file_url" value={file.file_url} />
                      <button
                        type="submit"
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
