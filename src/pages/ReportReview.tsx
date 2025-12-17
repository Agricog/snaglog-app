import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard
} from 'lucide-react'
import api from '../lib/api'

interface Snag {
  id: string
  photoUrl: string
  room: string | null
  defectType: string | null
  description: string | null
  severity: string | null
  suggestedTrade: string | null
  remedialAction: string | null
  aiConfidence: number | null
  userEdited: boolean
  displayOrder: number
}

interface Report {
  id: string
  propertyAddress: string
  propertyType: string | null
  developerName: string | null
  inspectionDate: string
  status: string
  paymentStatus: string
  notes: string | null
  snags: Snag[]
}

export default function ReportReview() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSnag, setExpandedSnag] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [reanalyzing, setReanalyzing] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [reportId])

  async function fetchReport() {
    try {
      const res = await api.get(`/api/report/${reportId}`)
      setReport(res.data)
      setNotes(res.data.notes || '')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await api.patch(`/api/report/${reportId}`, { notes })
      setReport(prev => prev ? { ...prev, notes } : null)
    } catch (err) {
      console.error('Failed to save notes:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  async function updateSnag(snagId: string, data: Partial<Snag>) {
    try {
      await api.patch(`/api/report/${reportId}/snag/${snagId}`, data)
      setReport(prev => {
        if (!prev) return null
        return {
          ...prev,
          snags: (prev.snags || []).map(s => s.id === snagId ? { ...s, ...data, userEdited: true } : s)
        }
      })
    } catch (err) {
      console.error('Failed to update snag:', err)
    }
  }

  async function reanalyzeSnag(snagId: string) {
    setReanalyzing(snagId)
    try {
      await api.post(`/api/analyze/${reportId}/snag/${snagId}`)
      await fetchReport()
    } catch (err) {
      console.error('Failed to reanalyze:', err)
    } finally {
      setReanalyzing(null)
    }
  }

  async function deleteSnag(snagId: string) {
    if (!confirm('Delete this snag?')) return
    try {
      await api.delete(`/api/report/${reportId}/snag/${snagId}`)
      setReport(prev => {
        if (!prev) return null
        return { ...prev, snags: (prev.snags || []).filter(s => s.id !== snagId) }
      })
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true)
    try {
      if (notes !== report?.notes) {
        await api.patch(`/api/report/${reportId}`, { notes })
      }
      
      const res = await api.post(`/api/payment/checkout/${reportId}`)
      window.location.href = res.data.url
    } catch (err: any) {
      setError(err.response?.data?.error || 'Checkout failed')
      setCheckoutLoading(false)
    }
  }

  function getSeverityColor(severity: string | null) {
    switch (severity) {
      case 'MAJOR': return 'bg-red-100 text-red-700 border-red-200'
      case 'MODERATE': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'MINOR': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  function getSeverityIcon(severity: string | null) {
    switch (severity) {
      case 'MAJOR': return <AlertCircle className="w-4 h-4" />
      case 'MODERATE': return <AlertTriangle className="w-4 h-4" />
      case 'MINOR': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Report not found'}
        </div>
      </div>
    )
  }

  const snags = report.snags || []
  const severityCounts = {
    major: snags.filter(s => s.severity === 'MAJOR').length,
    moderate: snags.filter(s => s.severity === 'MODERATE').length,
    minor: snags.filter(s => s.severity === 'MINOR').length,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      {/* Header */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-slate-600 hover:text-slate-800 mb-4"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{report.propertyAddress}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
          {report.propertyType && <span>{report.propertyType}</span>}
          {report.developerName && <span>• {report.developerName}</span>}
          <span>• {new Date(report.inspectionDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{severityCounts.major}</div>
          <div className="text-sm text-red-600">Major</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{severityCounts.moderate}</div>
          <div className="text-sm text-orange-600">Moderate</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{severityCounts.minor}</div>
          <div className="text-sm text-green-600">Minor</div>
        </div>
      </div>

      {/* Snags List */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Defects ({snags.length})
      </h2>

      <div className="space-y-4 mb-6">
        {snags.map((snag, index) => (
          <div
            key={snag.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Snag Header */}
            <div
              className="flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedSnag(expandedSnag === snag.id ? null : snag.id)}
            >
              <img
                src={snag.photoUrl}
                alt={`Snag ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {snag.defectType || 'Analyzing...'}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {snag.description || 'Processing...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getSeverityColor(snag.severity)}`}>
                      {getSeverityIcon(snag.severity)}
                      {snag.severity || '...'}
                    </span>
                    {expandedSnag === snag.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-slate-400">
                  {snag.room && <span className="bg-slate-100 px-2 py-0.5 rounded">{snag.room}</span>}
                  {snag.suggestedTrade && <span className="bg-slate-100 px-2 py-0.5 rounded">{snag.suggestedTrade}</span>}
                </div>
              </div>
            </div>

            {/* Expanded Edit Form */}
            {expandedSnag === snag.id && (
              <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Room/Location</label>
                    <input
                      type="text"
                      value={snag.room || ''}
                      onChange={e => updateSnag(snag.id, { room: e.target.value })}
                      placeholder="e.g., Kitchen, Bedroom 1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                    <select
                      value={snag.severity || ''}
                      onChange={e => updateSnag(snag.id, { severity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="MINOR">Minor</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="MAJOR">Major</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Defect Type</label>
                  <input
                    type="text"
                    value={snag.defectType || ''}
                    onChange={e => updateSnag(snag.id, { defectType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={snag.description || ''}
                    onChange={e => updateSnag(snag.id, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suggested Trade</label>
                  <input
                    type="text"
                    value={snag.suggestedTrade || ''}
                    onChange={e => updateSnag(snag.id, { suggestedTrade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Remedial Action</label>
                  <textarea
                    value={snag.remedialAction || ''}
                    onChange={e => updateSnag(snag.id, { remedialAction: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => reanalyzeSnag(snag.id)}
                    disabled={reanalyzing === snag.id}
                    className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50"
                  >
                    {reanalyzing === snag.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Re-analyze with AI
                  </button>
                  <button
                    onClick={() => deleteSnag(snag.id)}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Additional Notes
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          Add any additional observations or notes for the developer
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={4}
          placeholder="e.g., General observations, areas of concern, recommendations..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
        />
        {savingNotes && (
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </p>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{snags.length} defects</span>
            <span className="mx-2">•</span>
            <span>Ready to generate</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || snags.length === 0}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay £19.99 & Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
