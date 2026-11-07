export function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-slate-200 rounded animate-pulse`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 animate-pulse">
      <SkeletonLine w="w-1/3" h="h-4" />
      <SkeletonLine w="w-2/3" h="h-3" />
      <SkeletonLine w="w-1/2" h="h-3" />
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3.5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 bg-slate-200 rounded" />
              <div className="w-20 h-2.5 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-16 h-3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
          <div className="w-12 h-6 bg-slate-200 rounded" />
          <div className="w-20 h-3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function PageSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-40 h-6 bg-slate-200 rounded animate-pulse" />
        <div className="w-56 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      <StatsSkeleton />
      <ListSkeleton />
    </div>
  )
}
