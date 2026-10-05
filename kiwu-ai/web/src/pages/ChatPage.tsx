import { ChatPanel } from '../widget/ChatPanel'

/** 전체 화면 챗봇 — 모바일 바로가기, QR, 향후 외부 채널(웹뷰) 연결용 (IR-003, IR-004) */
export default function ChatPage() {
  return (
    <div className="h-dvh bg-canvas sm:py-6">
      <div className="mx-auto h-full max-w-2xl sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:shadow-xl">
        <ChatPanel variant="page" />
      </div>
    </div>
  )
}
