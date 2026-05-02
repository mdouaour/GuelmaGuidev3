'use client'

import dynamic from 'next/dynamic'
import type { MapMarker } from '@/components/LeafletMap'

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false })

interface MapClientProps {
  markers: MapMarker[]
  zoom?: number
}

export default function MapClient({ markers, zoom }: MapClientProps) {
  return <LeafletMap markers={markers} zoom={zoom} />
}
