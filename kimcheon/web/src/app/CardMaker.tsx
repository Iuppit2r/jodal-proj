import { useRef, useState } from 'react'
import { Download, ImagePlus, Link2, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { byId, user } from '../data'
import { orderOf, useApp } from '../store'
import { Page, PrimaryButton, Scroll, TopBar } from '../components/ui'
import { CardImage } from '../components/CardImage'
import { cardStyles, dataUrlToFile } from '../lib/card'

const SHARE_TARGETS = [
  { id: 'kakao', name: '카카오톡', bg: '#FEE500', fg: '#191919', icon: MessageCircle },
  { id: 'insta', name: '인스타 스토리', bg: 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)', fg: '#fff', icon: Send },
  { id: 'band', name: '밴드', bg: '#06C755', fg: '#fff', icon: MessageCircle },
  { id: 'link', name: '링크 복사', bg: '#EEEDE7', fg: '#1C201D', icon: Link2 },
  { id: 'save', name: '이미지 저장', bg: '#EEEDE7', fg: '#1C201D', icon: Download },
  { id: 'more', name: '더보기', bg: '#EEEDE7', fg: '#1C201D', icon: MoreHorizontal },
] as const

export default function CardMaker({ id }: { id: string }) {
  const m = byId(id)
  const { records, setPhoto, showToast } = useApp()
  const rec = records[id]
  const [style, setStyle] = useState(0)
  const [url, setUrl] = useState<string>()
  const [sheet, setSheet] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const order = orderOf(records, id)
  const input = { m, rec, order, count: order, style, nick: user.nick }

  const save = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `김천100산_${m.title}_완등카드.png`
    a.click()
  }

  const share = async (target: (typeof SHARE_TARGETS)[number]['id']) => {
    setSheet(false)
    if (target === 'save') return save()
    if (target === 'link') return showToast('공유 링크를 복사했어요')
    if (target === 'more' && url) {
      const file = await dataUrlToFile(url, `gimcheon100_${m.id}.png`)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${m.title} 완등!`, text: `김천 100산 ${order}번째 완등 #김천100산 #김천여행` }).catch(() => {})
        return
      }
      return save()
    }
    showToast(`${target === 'kakao' ? '카카오톡' : target === 'insta' ? '인스타그램' : '밴드'} 공유 화면으로 이동합니다`)
  }

  const onFile = (f?: File) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(id, reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <Page className="bg-[#161A17]">
      <TopBar title="완등 인증카드" dark />
      <Scroll className="px-5">
        <div className="mx-auto mt-1 w-full overflow-hidden rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,.5)]">
          <CardImage input={input} onReady={setUrl} />
        </div>
        <p className="mt-4 text-[15px] font-bold text-white/85">카드 디자인</p>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {cardStyles.map((s) => (
            <button key={s.id} onClick={() => setStyle(s.id)} className="text-left">
              <div className={`overflow-hidden rounded-xl ring-[3px] ${style === s.id ? 'ring-accent' : 'ring-transparent'}`}>
                <CardImage input={{ ...input, style: s.id }} />
              </div>
              <p className={`mt-1.5 truncate text-[14px] font-bold ${style === s.id ? 'text-gold' : 'text-white/80'}`}>{s.name}</p>
            </button>
          ))}
        </div>
        <button onClick={() => fileRef.current?.click()} className="mt-4 mb-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-[15px] font-bold text-white">
          <ImagePlus size={19} /> 인증사진 바꾸기
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </Scroll>
      <div className="shrink-0 px-5 pt-3 pb-[46px]">
        <PrimaryButton accent onClick={() => setSheet(true)} disabled={!url}>
          <Send size={20} /> 공유하기
        </PrimaryButton>
      </div>

      {sheet && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/50" onClick={() => setSheet(false)}>
          <div className="anim-rise rounded-t-3xl bg-white px-5 pt-5 pb-[46px] text-ink" onClick={(e) => e.stopPropagation()}>
            <p className="text-[18px] font-extrabold">인증카드 공유</p>
            <p className="mt-1 text-[15px] text-sub">#김천100산 #김천여행 해시태그가 함께 입력돼요</p>
            <div className="mt-5 grid grid-cols-3 gap-y-5">
              {SHARE_TARGETS.map((t) => (
                <button key={t.id} onClick={() => share(t.id)} className="flex flex-col items-center gap-2">
                  <span className="grid size-14 place-items-center rounded-2xl" style={{ background: t.bg, color: t.fg }}>
                    <t.icon size={24} />
                  </span>
                  <span className="text-[14px] font-semibold">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}
