import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, CreditCard, Loader2, RefreshCw, Trash2, ChevronDown } from 'lucide-react'
import api from '../lib/api'

interface Snag {
  id: string
  photoUrl: string
  room: string | null
  defectType: string | null
  description: string | null
  severity: 'MINOR' | 'MODERATE' | 'MAJOR'
  suggestedTrade: string | null
  remedialAction: string | null
  aiConfidence: number | null
  userEdited: boolean
}

interface Report {
  id: string
  propertyAddress: string
  propertyType: string | null
  developerName: string | null
  inspectionDate: string
  status: string
  paymentStatus: string
  snags: Snag[]
}

const ROOMS = [
  'Kitchen', 'Living Room', 'Dining Room', 'Master Bedroom', 'Bedroom 2', 
  'Bedroom 3', 'Bedroom 4', 'Bathroom', 'En-Suite', 'WC', 'Hallway', 
  'Stairs', 'Landing', 'Utility Room', 'Garage', 'Garden', 'External', 'Other'
]

const TRADES = [
  'Decorator', 'Joiner', 'Plumber', 'Electrician', 'Tiler', 
  'Plasterer', 'Builder', 'Roofer', 'Glazier', 'Other'
]

export default function ReportReview() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [expandedSnag, setExpandedSnag] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [reportId])

  async function fetchReport() {
    try {
      const res = await api.get(`/api/report/${reportId}`)
      setReport(res.data.report)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSnag(snagId: string, updates: Partial<Snag>) {
    if (!report) return

    // Optimistic update
    setReport({
      ...report,
      snags: report.snags.map((s) =>
        s.id === snagId ? { ...s, ...updates } : s
      ),
    })

    try {
      await api.patch(`/api/report/${reportId}/snag/${snagId}`, updates)
    } catch (error) {
      console.error('Failed to update snag:', error)
      fetchReport() // Revert on error
    }
  }

  async function deleteSnag(snagId: string) {
    if (!report || !confirm('Delete this snag?')) return

    setReport({
      ...report,
      snags: report.snags.filter((s) => s.id !== snagId),
    })

    try {
      await api.delete(`/api/report/${reportId}/snag/${snagId}`)
    } catch (error) {
      console.error('Failed to delete snag:', error)
      fetchReport()
    }
  }

  async function reanalyzeSnag(snagId: string) {
    try {
      setSaving(true)
      await api.post(`/api/analyze/${reportId}/snag/${snagId}`)
      await fetchReport()
    } catch (error) {
      console.error('Failed to re-analyze:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res = await api.post(`/api/payment/checkout/${reportId}`)
      window.location.href = res.data.url
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckingOut(false)
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'MINOR': return 'bg-green-100 text-green-700'
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700'
      case 'MAJOR': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Report not found</p>
      </div>
    )
  }

  const severityCounts = {
    minor: report.snags.filter((s) => s.severity === 'MINOR').length,
    moderate: report.snags.filter((s) => s.severity === 'MODERATE').length,
    major: report.snags.filter((s) => s.severity === 'MAJOR').length,
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-slate-800 mb-1">{report.propertyAddress}</h1>
        <p className="text-slate-500 text-sm mb-4">
          {report.propertyType} {report.developerName && `• ${report.developerName}`}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-800">{report.snags.length}</span>
            <span className="text-slate-500">snags</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('MINOR')}`}>
              {severityCounts.minor} Minor
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('MODERATE')}`}>
              {severityCounts.moderate} Moderate
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('MAJOR')}`}>
              {severityCounts.major} Major
            </span>
          </div>
        </div>
      </div>

      {/* Snags List */}
      <div className="space-y-4 mb-6">
        {report.snags.map((snag, index) => (
          <div
            key={snag.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Snag Header */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedSnag(expandedSnag === snag.id ? null : snag.id)}
            >
              <img
                src={snag.photoUrl}
                alt={`Snag ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">
                    #{String(index + 1).padStart(3, '0')}
                  </span>
                  <span className="text-slate-600 truncate">
                    {snag.defectType || 'Unidentified defect'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(snag.severity)}`}>
                    {snag.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {snag.room || 'No room assigned'} • {snag.suggestedTrade || 'No trade'}
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  expandedSnag === snag.id ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* Expanded Edit Form */}
            {expandedSnag === snag.id && (
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
                    <select
                      value={snag.room || ''}
                      onChange={(e) => updateSnag(snag.id, { room: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select room</option>
                      {ROOMS.map((room) => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                    <select
                      value={snag.severity}
                      onChange={(e) => updateSnag(snag.id, { severity: e.target.value as Snag['severity'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="MINOR">Minor</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="MAJOR">Major</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Defect Type</label>
                  <input
                    type="text"
                    value={snag.defectType || ''}
                    onChange={(e) => updateSnag(snag.id, { defectType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={snag.description || ''}
                    onChange={(e) => updateSnag(snag.id, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trade</label>
                    <select
                      value={snag.suggestedTrade || ''}
                      onChange={(e) => updateSnag(snag.id, { suggestedTrade: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select trade</option>
                      {TRADES.map((trade) => (
                        <option key={trade} value={trade}>{trade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Remedial Action</label>
                    <input
                      type="text"
                      value={snag.remedialAction || ''}
                      onChange={(e) => updateSnag(snag.id, { remedialAction: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reanalyzeSnag(snag.id)}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-orange-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Re-analyze
                    </button>
                    <button
                      onClick={() => deleteSnag(snag.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                  {snag.aiConfidence !== null && (
                    <span className="text-xs text-slate-400">
                      AI confidence: {Math.round(snag.aiConfidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Checkout Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">Ready to generate your report?</h3>
            <p className="text-sm text-slate-500">Review complete. Download your professional PDF.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-800">£19.99</div>
            <div className="text-xs text-slate-500">one-time payment</div>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={checkingOut || report.snags.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {checkingOut ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay & Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  )
}
