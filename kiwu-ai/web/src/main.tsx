import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import HostDemo from './pages/HostDemo'
import ChatPage from './pages/ChatPage'
import MobileDemo from './pages/MobileDemo'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Knowledge from './pages/admin/Knowledge'
import Updates from './pages/admin/Updates'
import Conversations from './pages/admin/Conversations'
import Safety from './pages/admin/Safety'
import Settings from './pages/admin/Settings'
import Login from './pages/admin/Login'
import PdfTest from './pages/PdfTest'
import PdfTest2 from './pages/PdfTest2'

const router = createBrowserRouter([
  { path: '/', element: <HostDemo /> },
  { path: '/chat', element: <ChatPage /> },
  { path: '/mobile', element: <MobileDemo /> },
  { path: '/pdf-test', element: <PdfTest /> },
  { path: '/pdf-test-2', element: <PdfTest2 /> },
  { path: '/admin/login', element: <Login /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'updates', element: <Updates /> },
      { path: 'conversations', element: <Conversations /> },
      { path: 'safety', element: <Safety /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
