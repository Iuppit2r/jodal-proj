import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import Frame from './Frame.tsx'
import Admin from './admin/Admin.tsx'
import Laptop from './admin/Laptop.tsx'
import { useApp } from './store'
import { useAdmin } from './admin/store'

// 캡처 스크립트에서 상태를 직접 지정할 수 있도록 노출
Object.assign(window, { __app: useApp, __admin: useAdmin })

const q = new URLSearchParams(location.search)
const isAdmin = q.get('view') === 'admin'
const bare = q.get('bare') === '1'
if (q.get('capture') === '1') document.documentElement.classList.add('capture')
if (isAdmin) document.title = '김천 100산 · 완등 인증 관리'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? window.innerWidth >= 1100 && !bare ? <Laptop /> : <Admin /> : <Frame />}
  </StrictMode>,
)
