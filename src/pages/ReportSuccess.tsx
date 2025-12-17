import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Download, FileText, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import api from '../lib/api'

export default function ReportSuccess() {
  const { reportId } = useParams()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [status, setStatus] = useState<'verifying' | 'generating' | 'complete' | 'error'>('verifying')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      checkReportStatus()
    }
  }, [sessionId, reportId])

  async function verifyPayment() {
    try {
      setStatus('verifying')
      const res = await api.post(`/api/payment/verify/${reportId}`, { sessionId })
      
      if (res.data.pdfUrl) {
        setPdfUrl(res.data.pdfUrl)
        setStatus('complete')
      } else {
        setStatus('generating')
        pollForPdf()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment verification failed')
      setStatus('error')
    }
  }

  async function checkReportStatus() {
    try {
      const res = await api.get(`/api/payment/status/${reportId}`)
      if (res.data.report.pdfUrl) {
        setPdfUrl(res.data.report.pdfUrl)
        setStatus('complete')
      } else if (res.data.report.paymentStatus === 'PAID') {
        setStatus('generating')
        pollForPdf()
      } else {
        setError('Payment not completed')
        setStatus('error')
      }
    } catch (err) {
      setError('Failed to check report status')
      setStatus('error')
    }
  }

  async function pollForPdf() {
    let attempts = 0
    const maxAttempts = 30
    
    const poll = async () => {
      attempts++
      try {
        const res = await api.get(`/api/payment/status/${reportId}`)
        if (res.data.report.pdfUrl) {
          setPdfUrl(res.data.report.pdfUrl)
          setStatus('complete')
          return
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
      
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000)
      } else {
        setError('PDF generation timed out. Please contact support.')
        setStatus('error')
      }
    }
    
    setTimeout(poll, 2000)
  }

  if (status === 'verifying') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Verifying Payment</h1>
          <p className="text-slate-500">Please wait while we confirm your payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'generating') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Generating Your Report</h1>
          <p className="text-slate-500 mb-6">This usually takes 30-60 seconds...</p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            <span className="text-sm text-slate-500">Creating professional PDF</span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'complete' && pdfUrl) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Report Ready!</h1>
          <p className="text-slate-500 mb-8">Your snagging report has been generated successfully.</p>
          
          
            href={pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all mb-6"
          >
            <Download className="w-5 h-5" />
            Download PDF Report
          </a>

          <p className="text-sm text-slate-500 mb-8">
            Your report is also saved in your dashboard for future access.
          </p>

          <Link to="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Something Went Wrong</h1>
        <p className="text-slate-500 mb-6">{error}</p>
        
        <Link
          to={`/report/${reportId}/review`}
          className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all mb-4"
        >
          Back to Review
        </Link>
        <p className="text-sm text-slate-500">
          Need help? Contact us at{' '}
          <a href="mailto:hello@snaglog.co.uk" className="text-orange-600 hover:underline">
            hello@snaglog.co.uk
          </a>
        </p>
      </div>
    </div>
  )
}
