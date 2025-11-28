'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, X, Loader2, Check, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void
  currentImage?: string
}

export default function ImageUpload({ onUploadSuccess, currentImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(currentImage || '')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.'
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB.'
    }

    return null
  }

  const handleUpload = async (file: File) => {
    setError('')
    setUploadSuccess(false)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        onUploadSuccess(result.url)
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)
      } else {
        setError(result.error || 'Erro ao fazer upload')
        setPreview('')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor')
      setPreview('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleRemove = () => {
    setPreview('')
    setError('')
    setUploadSuccess(false)
    onUploadSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      {!preview ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Fazendo upload...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP ou GIF até 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border-2 border-green-200 overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>
          {uploadSuccess && (
            <div className="absolute bottom-2 right-2 px-3 py-1 bg-green-500 text-white rounded-full flex items-center gap-1 shadow-lg">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Upload concluído!</span>
            </div>
          )}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
