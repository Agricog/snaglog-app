import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, Loader2 } from 'lucide-react'
import api from '../lib/api'
import heic2any from 'heic2any'

export default function NewReport() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [developerName, setDeveloperName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const processFile = async (file: File): Promise<{ file: File; preview: string }> => {
    const isHeic = file.type === 'image/heic' || 
                   file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif')

    if (isHeic) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85
        }) as Blob
        
        const convertedFile = new File(
          [convertedBlob], 
          file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
          { type: 'image/jpeg' }
        )
        
        return {
          file: convertedFile,
          preview: URL.createObjectURL(convertedBlob)
        }
      } catch (err) {
        console.error('HEIC conversion failed:', err)
        return {
          file,
          preview: URL.createObjectURL(file)
        }
      }
    }
    
    return {
      file,
      preview: URL.createObjectURL(file)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const { file: processedFile, preview } = await processFile(file)
      setFiles(prev => [...prev, processedFile])
      setPreviews(prev => [...prev, preview])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'] 
    },
    maxSize: 10 * 1024 * 1024,
  })

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!propertyAddress.trim()) {
      setError('Property address is required')
      return
    }

    if (files.length === 0) {
      setError('Please upload at least one photo')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('propertyAddress', propertyAddress)
      if (propertyType) formData.append('propertyType', propertyType)
      if (developerName) formData.append('developerName', developerName)
      
      files.forEach(file => {
        formData.append('photos', file)
      })

      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await api.post(`/api/analyze/${res.data.report.id}`)

      navigate(`/report/${res.data.report.id}/review`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Create New Report</h1>
      <p className="text-slate-500 mb-8">Upload photos of defects and we'll analyze them with AI</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Property Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Property Address *
              </label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                placeholder="e.g., 47 Meadow View, Bristol, BS16 4QT"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">Select type</option>
                  <option value="Detached House">Detached House</option>
                  <option value="Semi-Detached House">Semi-Detached House</option>
                  <option value="Terraced House">Terraced House</option>
                  <option value="Flat/Apartment">Flat/Apartment</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Developer Name
                </label>
                <input
                  type="text"
                  value={developerName}
                  onChange={e => setDeveloperName(e.target.value)}
                  placeholder="e.g., Persimmon Homes"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Photos ({files.length})
          </h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-orange-500 bg-orange-50'
                : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-1">
              {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
            </p>
            <p className="text-sm text-slate-400">or click to browse (max 10MB per photo)</p>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading & Analyzing...
            </>
          ) : (
            <>
              <Image className="w-5 h-5" />
              Analyze {files.length} Photo{files.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
