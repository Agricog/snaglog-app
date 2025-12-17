import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Image, Loader2, Camera, FolderOpen } from 'lucide-react'
import api from '../lib/api'

export default function NewReport() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [developerName, setDeveloperName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    Array.from(newFiles).forEach(file => {
      setFiles(prev => [...prev, file])
      setPreviews(prev => [...prev, URL.createObjectURL(file)])
    })
  }

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
      setError('Please add at least one photo')
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
      console.error('Submit error:', err)
      setError(err.response?.data?.error || 'Failed to create report. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Create New Report</h1>
      <p className="text-slate-500 mb-6">Take photos of defects and we'll analyze them with AI</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-base bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-base bg-white"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-base bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Photos ({files.length})
          </h2>

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full mb-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 active:opacity-90"
          >
            <Camera className="w-6 h-6" />
            Take Photo
          </button>
          
          {/* Hidden camera input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => { addFiles(e.target.files); e.target.value = '' }}
            className="hidden"
          />

          {/* Choose from library button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-slate-300 rounded-xl p-4 text-center hover:border-orange-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3"
          >
            <FolderOpen className="w-6 h-6 text-slate-400" />
            <span className="text-slate-600">Choose from Library</span>
          </button>
          
          {/* Hidden file input for library */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => { addFiles(e.target.files); e.target.value = '' }}
            className="hidden"
          />

          {/* Photo previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || files.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
