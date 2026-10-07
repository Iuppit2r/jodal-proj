import { Camera, Home as HomeIcon, Mountain as MountainIcon, BookOpen, MapPinned } from 'lucide-react'
import { useApp, type Route, type Tab } from '../store'
import { Toast } from '../components/ui'
import Home from './Home'
import Mountains from './Mountains'
import MountainDetail from './MountainDetail'
import Certify from './Certify'
import Result from './Result'
import CardMaker from './CardMaker'
import Passport from './Passport'
import Missions, { MissionDetail } from './Missions'
import PlaceDetail from './PlaceDetail'
import My from './My'
import Auth from './Auth'
import { Guestbook, GuestPostView, GuestWrite, Inbox, Photos, PhotoView, PushBanner, Terms, Withdraw } from './More'
import { Faq, NoticeDetail, NoticeList, RewardApply, Settings } from './MyMenus'

function RouteView({ r }: { r: Route }) {
  switch (r.name) {
    case 'mountain':
      return <MountainDetail id={r.id} />
    case 'certify':
      return <Certify id={r.id} />
    case 'result':
      return <Result r={r} />
    case 'card':
      return <CardMaker id={r.id} />
    case 'place':
      return <PlaceDetail id={r.id} />
    case 'mission':
      return <MissionDetail id={r.id} />
    case 'my':
      return <My />
    case 'badges':
      return <Passport asPage initial="badges" />
    case 'reward':
      return <RewardApply />
    case 'notices':
      return <NoticeList />
    case 'notice':
      return <NoticeDetail id={r.id} />
    case 'faq':
      return <Faq />
    case 'settings':
      return <Settings />
    case 'guestbook':
      return <Guestbook mountainId={r.mountainId} />
    case 'guestPost':
      return <GuestPostView id={r.id} />
    case 'guestWrite':
      return <GuestWrite mountainId={r.mountainId} />
    case 'inbox':
      return <Inbox />
    case 'photos':
      return <Photos />
    case 'photo':
      return <PhotoView id={r.id} />
    case 'terms':
      return <Terms tab={r.tab} />
    case 'withdraw':
      return <Withdraw />
  }
}

const TABS: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: '홈', icon: HomeIcon },
  { id: 'mountains', label: '김천 100산', icon: MountainIcon },
  { id: 'passport', label: '산행여권', icon: BookOpen },
  { id: 'missions', label: '관광미션', icon: MapPinned },
]

function TabBar() {
  const { tab, setTab, push } = useApp()
  const btn = (t: (typeof TABS)[number]) => {
    const on = tab === t.id
    const Icon = t.icon
    return (
      <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-1 flex-col items-center gap-1 pt-2.5 ${on ? 'text-brand' : 'text-mute'}`}>
        <Icon size={24} strokeWidth={on ? 2.4 : 1.8} />
        <span className="text-[13px] font-bold">{t.label}</span>
      </button>
    )
  }
  return (
    <nav className="relative z-20 flex h-[96px] shrink-0 items-start border-t border-line bg-white pb-[34px]">
      {TABS.slice(0, 2).map(btn)}
      <div className="flex w-[84px] justify-center">
        <button
          onClick={() => push({ name: 'certify' })}
          className="bg-accent -mt-6 grid size-[66px] place-items-center rounded-full text-white shadow-[0_8px_20px_rgba(198,0,35,.35)] ring-[5px] ring-white active:scale-95"
          aria-label="정상 인증"
        >
          <Camera size={30} strokeWidth={2.2} />
        </button>
      </div>
      {TABS.slice(2).map(btn)}
    </nav>
  )
}

export default function App() {
  const { tab, stack, authed } = useApp()
  if (!authed) return <Auth />
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-bg text-[15px]">
      <div className="relative isolate min-h-0 flex-1">
        {tab === 'home' && <Home />}
        {tab === 'mountains' && <Mountains />}
        {tab === 'passport' && <Passport />}
        {tab === 'missions' && <Missions />}
      </div>
      <TabBar />
      {stack.map((r, i) => (
        <RouteView key={i + r.name + ('id' in r ? r.id : '') + ('mountainId' in r ? r.mountainId : '')} r={r} />
      ))}
      <PushBanner />
      <Toast />
    </div>
  )
}
