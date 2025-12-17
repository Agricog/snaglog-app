import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../lib/api'

interface Report {
  id: string
  propertyAddress: string
  propertyType: string | null
  inspectionDate: string
  status: string
  paymentStatus: string
  pdfUrl: string | null
  snagCount: number
  severityCounts: {
    minor: number
    moderate: number
    major: number
  }
  createdAt: string
}

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const res = await api.get('/api/report')
      setReports(res.data.reports)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string, paymentStatus: string) {
    if (paymentStatus === 'PAID' && status === 'COMPLETE') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Complete</span>
    }
    if (status === 'REVIEW') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Review</span>
    }
    if (status === 'ANALYZING') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Analyzing</span>
    }
    return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Draft</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Your Reports</h1>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No reports yet</h2>
          <p className="text-slate-500 mb-6">Create your first snagging report to get started</p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Report
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Link
              key={report.id}
              to={report.status === 'COMPLETE' ? `/report/${report.id}/success` : `/report/${report.id}/review`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-800">{report.propertyAddress}</h3>
                    {getStatusBadge(report.status, report.paymentStatus)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(report.inspectionDate).toLocaleDateString('en-GB')}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {report.snagCount} snags
                    </span>
                  </div>

                  {report.snagCount > 0 && (
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
                        {report.severityCounts.minor} Minor
                      </span>
                      <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded">
                        {report.severityCounts.moderate} Moderate
                      </span>
                      <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">
                        {report.severityCounts.major} Major
                      </span>
                    </div>
                  )}
                </div>

                {report.pdfUrl && (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
