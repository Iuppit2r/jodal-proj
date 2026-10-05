import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'
import ChatPage from './pages/Chat'
import SchedulePage from './pages/Schedule'
import FormAssistantPage from './pages/FormAssistant'
import MonitoringPage from './pages/admin/Monitoring'
import RagEvalPage from './pages/admin/RagEval'
import DataSourcesPage from './pages/admin/DataSources'
import FeedbackPage from './pages/admin/Feedback'
import ModelsPage from './pages/admin/Models'
import OverviewPage from './pages/Overview'
import EntryPage from './pages/Entry'
import { SsoGate } from './access'

/**
 * 두 개의 앱으로 구성한다.
 *  이용자 앱  /chat                 대표홈페이지 진입(비로그인) · PortWise 진입(SSO)
 *             /schedule · /forms     PortWise 통합로그인(SSO) 필요
 *  관리자 앱  /admin/*               공사 담당자 · 관리자 인증 · 업무망
 * 진입 경로 설명은 /entry
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/entry" element={<EntryPage />} />

      <Route element={<UserLayout />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/schedule" element={<SsoGate title="스케줄 예측"><SchedulePage /></SsoGate>} />
        <Route path="/forms" element={<SsoGate title="서식 어시스턴트"><FormAssistantPage /></SsoGate>} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<MonitoringPage />} />
        <Route path="rag" element={<RagEvalPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="data" element={<DataSourcesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
