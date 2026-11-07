import { StatsSkeleton, ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-60 h-7 bg-slate-200 rounded animate-pulse" />
        <div className="w-40 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      <StatsSkeleton count={3} />
      <ListSkeleton rows={4} />
    </div>
  )
}
