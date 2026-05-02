'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadPlaceImage, deletePlaceImage, type Place } from '@/lib/api'
import Image from 'next/image'

interface ImageUploadProps {
  place: Place
  onUpdate: (updatedPlace: Place) => void
}

export default function ImageUpload({ place, onUpdate }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const updatedPlace = await uploadPlaceImage(place.id, file)
      onUpdate(updatedPlace)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (imageUrl: string) => {
    setIsDeleting(imageUrl)
    try {
      const updatedPlace = await deletePlaceImage(place.id, imageUrl)
      onUpdate(updatedPlace)
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {place.images.map((url, index) => (
          <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <Image
              src={url}
              alt={`Place image ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => handleDelete(url)}
              disabled={!!isDeleting}
              className="absolute right-2 top-2 rounded-full bg-rose-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:bg-rose-300"
            >
              {isDeleting === url ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          </div>
        ))}

        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          disabled={isUploading}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-colors hover:border-[#2E7D32] hover:text-[#2E7D32] disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="text-xs font-medium">Upload Image</span>
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      
      <p className="text-[10px] text-slate-400">
        Accepted formats: JPG, PNG, WEBP. Max size: 5MB.
      </p>
    </div>
  )
}
