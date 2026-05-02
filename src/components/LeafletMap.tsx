'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Image from 'next/image'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet-icons/marker-icon-2x.png',
  iconUrl: '/leaflet-icons/marker-icon.png',
  shadowUrl: '/leaflet-icons/marker-shadow.png',
})

export interface MapMarker {
  id: string
  title: string
  imageUrl?: string
  category?: string
  description?: string
  coordinates: { lat: number; lng: number }
  mapsUrl?: string
  detailsUrl?: string
}

interface LeafletMapProps {
  markers: MapMarker[]
  zoom?: number
}

export default function LeafletMap({ markers, zoom = 13 }: LeafletMapProps) {
  const t = useTranslations('discover')
  const fallbackCenter: [number, number] = [36.4621, 7.4247]
  const center: [number, number] = markers[0]
    ? [markers[0].coordinates.lat, markers[0].coordinates.lng]
    : fallbackCenter

  return (
    <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%', minHeight: '260px' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.coordinates.lat, marker.coordinates.lng]}>
          <Popup>
            <article className="w-52 overflow-hidden rounded-xl border border-emerald-100 bg-white">
              {marker.imageUrl ? (
                <div className="relative h-24 w-full">
                  <Image
                    src={marker.imageUrl}
                    alt={marker.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}
              <div className="space-y-1 p-2.5 rtl:text-right">
                {marker.category ? (
                  <p className="inline-flex rounded-full bg-[#eaf6ef] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2E7D32]">
                    {marker.category}
                  </p>
                ) : null}
                <h3 className="text-sm font-semibold text-slate-900">{marker.title}</h3>
                {marker.description ? (
                  <p className="text-xs text-slate-600">{marker.description}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-xs rtl:flex-row-reverse">
                  {marker.mapsUrl ? (
                    <a href={marker.mapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 px-2 py-1 hover:border-[#4FC3F7]">
                      {t('map')}
                    </a>
                  ) : null}
                  {marker.detailsUrl ? (
                    <Link href={marker.detailsUrl as string} className="rounded-lg bg-[#2E7D32] px-2 py-1 text-white">
                      {t('view_details_short') || t('view_details').replace(' →', '')}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
