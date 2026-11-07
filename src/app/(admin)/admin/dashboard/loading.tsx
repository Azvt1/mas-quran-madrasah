import { StatsSkeleton, ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-48 h-7 bg-slate-200 rounded animate-pulse" />
        <div className="w-36 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      <StatsSkeleton count={4} />
      <ListSkeleton rows={5} />
    </div>
  )
}
