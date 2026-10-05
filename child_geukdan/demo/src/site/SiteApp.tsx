import { Route, Routes } from 'react-router-dom'
import SiteLayout from './SiteLayout'
// ── 공연·예매·회원 (pages/) ──
import Home from './pages/Home'
import PerfList from './pages/PerfList'
import PerfDetail from './pages/PerfDetail'
import Booking from './pages/Booking'
import BookingComplete from './pages/BookingComplete'
import PackagePage from './pages/PackagePage'
import Membership from './pages/Membership'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyPage from './pages/MyPage'
// ── 극단소개·소식·지원·정보공개 (content/) ──
import Schedule from './content/Schedule'
import About from './content/About'
import Notices from './content/Notices'
import NoticeDetail from './content/NoticeDetail'
import Webzine from './content/Webzine'
import WebzineDetail from './content/WebzineDetail'
import Archive from './content/Archive'
import Audition from './content/Audition'
import Faq from './content/Faq'
import Inquiry from './content/Inquiry'
import Guide from './content/Guide'
import InfoOpen from './content/InfoOpen'
import Sitemap from './content/Sitemap'
// ── 영문 ──
import EnApp from './en/EnApp'

export default function SiteApp() {
  return (
    <Routes>
      <Route path="en/*" element={<EnApp />} />
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="performances" element={<PerfList />} />
        <Route path="performances/:id" element={<PerfDetail />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="book/:perfId" element={<Booking />} />
        <Route path="book/complete/:bookingId" element={<BookingComplete />} />
        <Route path="package" element={<PackagePage />} />
        <Route path="membership" element={<Membership />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="mypage/*" element={<MyPage />} />
        <Route path="about/*" element={<About />} />
        <Route path="news/notice" element={<Notices />} />
        <Route path="news/notice/:id" element={<NoticeDetail />} />
        <Route path="news/webzine" element={<Webzine />} />
        <Route path="news/webzine/:id" element={<WebzineDetail />} />
        <Route path="news/archive" element={<Archive />} />
        <Route path="news/audition" element={<Audition />} />
        <Route path="support/faq" element={<Faq />} />
        <Route path="support/inquiry" element={<Inquiry />} />
        <Route path="support/guide" element={<Guide />} />
        <Route path="info/*" element={<InfoOpen />} />
        <Route path="sitemap" element={<Sitemap />} />
      </Route>
    </Routes>
  )
}
