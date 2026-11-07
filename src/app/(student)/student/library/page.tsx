import { createClient, requireRole } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { FileText, Music, Image, ExternalLink } from 'lucide-react'

const TYPE_CONFIG = {
  pdf:   { icon: FileText, label: 'PDF',   color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-100' },
  audio: { icon: Music,    label: 'Audio', color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
  image: { icon: Image,    label: 'Image', color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100' },
}

export default async function StudentLibraryPage() {
  const supabase = await createClient()
  await requireRole('student')

  const { data: files } = await supabase
    .from('library_files')
    .select('id, title, description, file_url, file_type, file_size, created_at')
    .order('created_at', { ascending: false })

  const pdfs   = (files ?? []).filter(f => f.file_type === 'pdf')
  const audios = (files ?? []).filter(f => f.file_type === 'audio')
  const images = (files ?? []).filter(f => f.file_type === 'image')

  function formatBytes(bytes: number | null) {
    if (!bytes) return null
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  type LibraryFile = NonNullable<typeof files>[number]
  function FileCard({ file }: { file: LibraryFile }) {
    const cfg = TYPE_CONFIG[file.file_type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.pdf
    const Icon = cfg.icon
    const size = formatBytes(file.file_size)

    return (
      <div className={`bg-white border rounded-lg p-4 flex flex-col gap-3 ${cfg.border}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
            <Icon size={18} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{file.title}</p>
            {file.description && (
              <p className="text-xs text-slate-500 mt-0.5">{file.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              {size && <><span className="text-xs text-slate-300">·</span><span className="text-xs text-slate-400">{size}</span></>}
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">{format(new Date(file.created_at), 'd MMM yyyy')}</span>
            </div>
          </div>
        </div>

        {file.file_type === 'audio' ? (
          <audio controls className="w-full h-9" src={file.file_url} />
        ) : (
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${cfg.color} ${cfg.bg} ${cfg.border} hover:opacity-80`}
          >
            <ExternalLink size={12} />
            {file.file_type === 'pdf' ? 'Open PDF' : 'View'}
          </a>
        )}
      </div>
    )
  }

  if (!files || files.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">Books and resources from your madrasa.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={28} className="text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No files yet</p>
          <p className="text-xs text-slate-400 mt-1">Your admin will upload books and resources here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Library</h1>
        <p className="text-sm text-slate-500 mt-0.5">Books and resources from your madrasa.</p>
      </div>

      {pdfs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Books & Worksheets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pdfs.map(f => <FileCard key={f.id} file={f} />)}
          </div>
        </div>
      )}

      {audios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Audio Recitations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {audios.map(f => <FileCard key={f.id} file={f} />)}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map(f => <FileCard key={f.id} file={f} />)}
          </div>
        </div>
      )}
    </div>
  )
}
