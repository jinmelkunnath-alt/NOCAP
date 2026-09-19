import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Button } from './components/ui/Button'
import { ErrorState } from './components/ui/ErrorState'
import { SocialProvider } from './context/SocialProvider'
import { ClaimDetailPage } from './pages/ClaimDetail'
import { CourtroomPage } from './pages/Courtroom'
import { DashboardPage } from './pages/Dashboard'
import { DecisionsPage } from './pages/Decisions'
import { ExplorePage } from './pages/Explore'
import { FeedPage } from './pages/Feed'
import { CheckerHomePage } from './pages/CheckerHome'
import { HomePage } from './pages/Home'
import { ProfilePage } from './pages/Profile'
import { IncidentReportPage } from './pages/IncidentReport'
import { ModerationPage } from './pages/Moderation'
import { ReportingPage } from './pages/Reporting'
import { ReviewPage } from './pages/Review'
import { SavedPage } from './pages/Saved'
import { SubmitPage } from './pages/Submit'

function NotFoundPage() {
  return (
    <ErrorState
      title="Page not found"
      message="That path is not part of no cap."
      action={
        <Button variant="secondary" size="sm" onClick={() => history.back()}>
          Go back
        </Button>
      }
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SocialProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CheckerHomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/trending" element={<HomePage tab="trending" />} />
            <Route path="/latest" element={<HomePage tab="latest" />} />
            <Route path="/uploads/user" element={<HomePage tab="user" />} />
            <Route path="/uploads/ai" element={<HomePage tab="ai" />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/claim/:id" element={<ClaimDetailPage />} />
            <Route path="/courtroom/:claimId" element={<CourtroomPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/reporting" element={<ReportingPage />} />
            <Route path="/reporting/:incidentId" element={<IncidentReportPage />} />
            <Route path="/moderation" element={<ModerationPage />} />
            <Route path="/claim" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </SocialProvider>
    </BrowserRouter>
  )
}
