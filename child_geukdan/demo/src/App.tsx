import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import DemoBar from './components/DemoBar'
import Toaster from './components/Toaster'
import SmsPhone from './components/SmsPhone'
import Launcher from './Launcher'
import SiteApp from './site/SiteApp'
import AdminApp from './admin/AdminApp'
import PosApp from './pos/PosApp'

function A11ySync() {
  const fontScale = useStore(s => s.fontScale)
  const contrast = useStore(s => s.contrast)
  const lang = useStore(s => s.lang)
  useEffect(() => {
    const el = document.documentElement
    el.dataset.fs = fontScale
    el.dataset.contrast = contrast
    el.lang = lang
  }, [fontScale, contrast, lang])
  return null
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <A11ySync />
      <ScrollTop />
      <DemoBar />
      <Toaster />
      <SmsPhone />
      <Routes>
        <Route path="/" element={<Launcher />} />
        <Route path="/site/*" element={<SiteApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/pos/*" element={<PosApp />} />
      </Routes>
    </HashRouter>
  )
}
