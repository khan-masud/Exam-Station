"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ImagePickerProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
}

export default function ImagePicker({ value, onChange, label = "Image" }: ImagePickerProps) {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      fetchImages()
    }
  }, [open])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/landing-config/images')
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
      toast.error('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/landing-config/images', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      toast.success('Image uploaded successfully')
      
      // Refresh images list
      await fetchImages()
      
      // Auto-select the uploaded image
      onChange(data.image.fileUrl)
      setOpen(false)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch(`/api/admin/landing-config/images?id=${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      toast.success('Image deleted successfully')
      await fetchImages()
      
      // Clear selection if deleted image was selected
      if (value === images.find(img => img.id === imageId)?.file_url) {
        onChange(null)
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete image')
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        <div className="flex-1">
          {value ? (
            <Card className="relative p-2">
              <img 
                src={value} 
                alt="Selected" 
                className="w-full h-32 object-cover rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 h-6 w-6"
                onClick={() => onChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ) : (
            <Card 
              className="p-4 border-2 border-dashed cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => setOpen(true)}
            >
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                <p className="text-sm">Click to select image</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <ImageIcon className="h-4 w-4 mr-2" />
        {value ? 'Change Image' : 'Select Image'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Image Library</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Section */}
            <Card className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Image
                  </>
                )}
              </Button>
            </Card>

            {/* Images Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No images uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image) => (
                  <Card
                    key={image.id}
                    className={`relative p-2 cursor-pointer hover:border-blue-500 transition-colors ${
                      value === image.file_url ? 'border-blue-500 ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => {
                      onChange(image.file_url)
                      setOpen(false)
                    }}
                  >
                    <img
                      src={image.file_url}
                      alt={image.alt_text || image.file_name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="mt-2 text-xs text-muted-foreground truncate">
                      {image.file_name}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 right-3 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(image.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
