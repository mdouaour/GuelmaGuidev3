'use client'

export default function PlaceSkeleton() {
  return (
    <div className="tour-card overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
        <div className="h-4 w-1/4 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200 mt-3" />
      </div>
    </div>
  )
}
