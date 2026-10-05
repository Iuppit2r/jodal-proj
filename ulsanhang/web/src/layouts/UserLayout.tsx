import { Globe2, LogIn, LogOut, MessagesSquare, FileScan, ShieldCheck, Ship, User } from 'lucide-react'
import AppShell from '../components/AppShell'
import { useI18n } from '../i18n'
import { useAccess, useViaParam } from '../access'

/**
 * 이용자 앱. 진입 경로에 따라 이용 범위가 달라진다.
 *  대표홈페이지 챗봇 버튼 → 비로그인, AI 상담(공개 자료)만
 *  PortWise 메뉴 → 통합로그인(SSO), 스케줄 예측 · 서식 어시스턴트까지
 */
export default function UserLayout() {
  const { t } = useI18n()
  const { via, setVia } = useAccess()
  useViaParam()
  const sso = via === 'portwise'

  return (
    <AppShell
      product="울산항 AI"
      showLang
      fullBleed={['/chat']}
      groups={[
        {
          label: 'AI 서비스',
          items: [
            { to: '/chat', label: t('nav.chat'), icon: MessagesSquare },
            { to: '/schedule', label: t('nav.schedule'), icon: Ship, locked: !sso },
            { to: '/forms', label: t('nav.forms'), icon: FileScan, locked: !sso },
          ],
        },
      ]}
      access={
        <div className="access-card">
          <span className="access-from">
            {sso ? <ShieldCheck size={14} /> : <Globe2 size={14} />}
            {sso ? 'PortWise에서 진입' : '대표홈페이지에서 진입'}
          </span>
          {sso ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setVia('home')}><LogOut size={13} />로그아웃</button>
          ) : (
            <button className="btn btn-sm" onClick={() => setVia('portwise')}><LogIn size={13} />PortWise 로그인</button>
          )}
        </div>
      }
      user={
        sso
          ? { initial: '김', name: '김항만 · 한울해운', meta: <><ShieldCheck size={12} />PortWise SSO</> }
          : { initial: <User size={15} />, name: '비로그인 이용자', meta: '공개 자료 기반 상담' }
      }
    />
  )
}
