import { StatsSkeleton, ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="w-24 h-6 bg-slate-200 rounded animate-pulse" />
      <StatsSkeleton count={3} />
      <ListSkeleton rows={8} />
    </div>
  )
}
