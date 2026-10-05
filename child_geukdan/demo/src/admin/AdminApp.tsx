import { Route, Routes } from 'react-router-dom'
import { useStore } from '../store'
import Login from './Login'
import Layout from './Layout'
import { DialogHost } from './ui'
import Dashboard from './pages/Dashboard'
import PerfList from './pages/performances/PerfList'
import PerfEdit from './pages/performances/PerfEdit'
import Seats from './pages/Seats'
import Bookings from './pages/bookings/Bookings'
import Tickets from './pages/Tickets'
import Settlement from './pages/Settlement'
import Reports from './pages/Reports'
import Kopis from './pages/Kopis'
import Packages from './pages/Packages'
import Membership from './pages/Membership'
import Crm from './pages/crm/Crm'
import Cms from './pages/cms/Cms'
import Stats from './pages/Stats'
import System from './pages/System'

/** 관리자 인쇄용 CSS: 사이드바·헤더 제외, 테이블 스크롤 해제, .print-target 단독 인쇄 */
const PRINT_CSS = `
@media print {
  @page { margin: 12mm; }
  .lg\\:pl-60 { padding-left: 0 !important; }
  .tbl-wrap { max-height: none !important; overflow: visible !important; }
  .card { break-inside: avoid; }
  html.print-only body * { visibility: hidden !important; }
  html.print-only .print-target, html.print-only .print-target * { visibility: visible !important; }
  html.print-only .print-target { position: absolute !important; left: 0; top: 0; width: 100%; box-shadow: none !important; }
}`

export default function AdminApp() {
  const adminId = useStore(s => s.adminId)
  return (
    <>
      <style>{PRINT_CSS}</style>
      <DialogHost />
      {!adminId ? <Login /> : (
        <Layout>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="performances" element={<PerfList />} />
            <Route path="performances/:id" element={<PerfEdit />} />
            <Route path="seats" element={<Seats />} />
            <Route path="bookings/*" element={<Bookings />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="settlement" element={<Settlement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="kopis" element={<Kopis />} />
            <Route path="packages" element={<Packages />} />
            <Route path="membership" element={<Membership />} />
            <Route path="crm/*" element={<Crm />} />
            <Route path="cms/*" element={<Cms />} />
            <Route path="stats" element={<Stats />} />
            <Route path="system" element={<System />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}
