'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Locate, Layers, Navigation } from 'lucide-react'

interface MapMarker {
  id: number
  latitude: number
  longitude: number
  name: string
  category: string
}

interface MapLibreViewProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
  className?: string
  showControls?: boolean
  selectedMarkerId?: number | null
}

export default function MapLibreView({
  markers,
  center = [36.45, 7.433],
  zoom = 13,
  onMarkerClick,
  className = '',
  showControls = true,
  selectedMarkerId,
}: MapLibreViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    // Fallback: if maplibre not installed, show a placeholder with marker list
    setIsLoaded(true)
  }, [])

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          // Ignored — fallback to default
        }
      )
    }
  }

  const categoryColors: Record<string, string> = {
    culture: '#8B5CF6',
    nature: '#10B981',
    forest: '#059669',
    thermal_baths: '#F59E0B',
    sports: '#EF4444',
    relaxation: '#EC4899',
  }

  // If MapLibre GL is not installed, render a beautiful static map placeholder
  // This provides the UI while the dependency can be installed separately
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className}`}>
      {/* Map background with CSS */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 30%, #34d399 60%, #10b981 100%)
          `,
        }}
      >
        {/* Grid pattern to simulate map tiles */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Water bodies */}
        <div className="absolute right-[20%] top-[60%] h-24 w-32 rounded-full bg-blue-300/40 blur-sm" />
        <div className="absolute left-[10%] top-[30%] h-16 w-48 rounded-full bg-blue-200/30 blur-sm" />

        {/* Roads */}
        <div className="absolute left-[30%] top-[20%] h-[2px] w-[40%] -rotate-12 bg-white/40" />
        <div className="absolute left-[40%] top-[50%] h-[2px] w-[30%] rotate-6 bg-white/30" />
        <div className="absolute left-[20%] top-[70%] h-[2px] w-[50%] -rotate-3 bg-white/35" />
      </div>

      {/* Markers */}
      {markers.map((marker) => {
        const color = categoryColors[marker.category] || '#6366F1'
        const isSelected = selectedMarkerId === marker.id
        // Distribute markers visually on the map area
        const positions = getMarkerPosition(marker)
        return (
          <button
            key={marker.id}
            onClick={() => onMarkerClick?.(marker)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-full transition-transform ${
              isSelected ? 'scale-125 z-20' : 'hover:scale-110'
            }`}
            style={{ left: `${positions.x}%`, top: `${positions.y}%` }}
          >
            <div className="relative">
              <div
                className={`h-8 w-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold ${
                  isSelected ? 'ring-4 ring-emerald-400/50' : ''
                }`}
                style={{ backgroundColor: color }}
              >
                <MapPin className="h-4 w-4" />
              </div>
              <div
                className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-white"
                style={{ backgroundColor: color }}
              />
              {isSelected && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-medium shadow-lg">
                  {marker.name}
                </div>
              )}
            </div>
          </button>
        )
      })}

      {/* User location */}
      {userLocation && (
        <div
          className="absolute z-10 h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg"
          style={{
            left: `${30 + (userLocation[0] - center[0]) * 500}%`,
            top: `${30 - (userLocation[1] - center[1]) * 500}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75" />
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleLocate}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition hover:bg-gray-50"
          >
            <Locate className="h-5 w-5 text-gray-700" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition hover:bg-gray-50">
            <Layers className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      )}

      {/* Category legend */}
      {showControls && (
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5 rounded-xl bg-white/90 p-2 shadow-lg backdrop-blur-sm">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <span
              key={cat}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-700"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* "Powered by" / copyright */}
      <div className="absolute bottom-3 right-3 z-10 rounded-md bg-white/80 px-2 py-0.5 text-[10px] text-gray-500 backdrop-blur-sm">
        GuelmaGuide ·(c) 2026
      </div>

      {!isLoaded && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

function getMarkerPosition(marker: MapMarker): { x: number; y: number } {
  // Simple projection: distribute based on lat/lon relative to Guelma center
  const baseLat = 36.45
  const baseLon = 7.433
  const scale = 200 // multiplier for visual spread

  const x = 50 + (marker.longitude - baseLon) * scale * Math.cos(baseLat * Math.PI / 180)
  const y = 50 - (marker.latitude - baseLat) * scale

  // Clamp to reasonable bounds
  return {
    x: Math.max(10, Math.min(90, x)),
    y: Math.max(10, Math.min(85, y)),
  }
}
