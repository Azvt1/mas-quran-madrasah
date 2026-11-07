import { StatsSkeleton, ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-64 h-7 bg-slate-200 rounded animate-pulse" />
        <div className="w-40 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      <StatsSkeleton count={4} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            <div className="w-24 h-3.5 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <ListSkeleton rows={4} />
    </div>
  )
}
