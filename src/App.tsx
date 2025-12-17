import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewReport from './pages/NewReport'
import ReportReview from './pages/ReportReview'
import ReportSuccess from './pages/ReportSuccess'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="new" element={
          <ProtectedRoute>
            <NewReport />
          </ProtectedRoute>
        } />
        <Route path="report/:reportId/review" element={
          <ProtectedRoute>
            <ReportReview />
          </ProtectedRoute>
        } />
        <Route path="report/:reportId/success" element={
          <ProtectedRoute>
            <ReportSuccess />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
