import { Activity, BrainCircuit, Database, Gauge, KeyRound, MessageSquareHeart } from 'lucide-react'
import AppShell from '../components/AppShell'

/** 공사 담당자 전용 운영 콘솔: 내부망 · 관리자 인증 */
export default function AdminLayout() {
  return (
    <AppShell
      product="울산항 AI 콘솔"
      variant="console"
      groups={[
        {
          label: '운영',
          items: [
            { to: '/admin', label: '모니터링', icon: Activity, end: true },
            { to: '/admin/feedback', label: '사용자 피드백', icon: MessageSquareHeart, count: '14' },
          ],
        },
        { label: 'AI 품질', items: [{ to: '/admin/rag', label: 'RAG 성능 평가', icon: Gauge }, { to: '/admin/models', label: 'AI 모델 관리', icon: BrainCircuit }] },
        { label: '데이터', items: [{ to: '/admin/data', label: '데이터·지식 관리', icon: Database }] },
      ]}
      user={{ initial: '관', name: 'AI정보실 관리자', meta: <><KeyRound size={12} />관리자 권한 · 내부망</> }}
    />
  )
}
