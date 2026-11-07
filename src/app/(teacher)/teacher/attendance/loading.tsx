import { ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-36 h-6 bg-slate-200 rounded animate-pulse" />
        <div className="w-56 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      {['August 2026', 'September 2026'].map(m => (
        <div key={m} className="space-y-2">
          <div className="w-28 h-3 bg-slate-200 rounded animate-pulse" />
          <ListSkeleton rows={4} />
        </div>
      ))}
    </div>
  )
}
