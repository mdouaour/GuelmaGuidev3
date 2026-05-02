'use client'

import PlaceSkeleton from './PlaceSkeleton'

export default function PageSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...Array(6)].map((_, i) => (
        <PlaceSkeleton key={i} />
      ))}
    </div>
  )
}
