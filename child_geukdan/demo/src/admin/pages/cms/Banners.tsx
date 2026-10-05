import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '../../../components/Modal'
import Poster from '../../../components/Poster'
import { useStore } from '../../../store'
import type { Banner } from '../../../data/types'
import { cx, fmtRange } from '../../../lib/format'
import { Card, Field, Note, Status, Toggle, ask, errMsg } from '../../ui'
import { usePerfMap } from '../../lib'
import { uid } from './cmsStore'

const FALLBACK: [string, string, string] = ['#2647c4', '#ffc933', '#ff8a73']

export default function Banners() {
  const banners = useStore(s => s.banners)
  const perfs = useStore(s => s.performances)
  const upsert = useStore(s => s.upsertBanner)
  const toast = useStore(s => s.toast)
  const perfMap = usePerfMap()
  const [edit, setEdit] = useState<Banner | null>(null)

  const sorted = useMemo(() => [...banners].sort((a, b) => a.order - b.order), [banners])
  const live = sorted.filter(b => b.active)

  const move = (i: number, d: -1 | 1) => {
    const a = sorted[i], b = sorted[i + d]
    if (!a || !b) return
    upsert({ ...a, order: b.order })
    upsert({ ...b, order: a.order })
    toast(`'${a.title}' 배너 순서를 ${d < 0 ? '위로' : '아래로'} 이동했습니다.`)
  }
  const toggle = (b: Banner, v: boolean) => {
    upsert({ ...b, active: v })
    toast(`'${b.title}' 배너 ${v ? '노출' : '숨김'} 처리 – 홈페이지에 즉시 반영`)
  }
  const remove = async (b: Banner) => {
    const r = await ask({ title: '배너 삭제', tone: 'danger', confirmText: '삭제', message: <>메인 배너 <b>「{b.title}」</b>를 삭제합니다. 삭제 후에는 복구할 수 없습니다.</> })
    if (r === null) return
    const st = useStore.getState()
    st.set({ banners: st.banners.filter(x => x.id !== b.id) })
    st.log('메인배너 삭제', b.title)
    st.toast('배너를 삭제했습니다.')
  }
  const addNew = () => setEdit({ id: uid('b'), title: '', copy: '', active: true, order: Math.max(0, ...banners.map(b => b.order)) + 1 })

  return (
    <div className="space-y-4">
      <Card title="홈페이지 메인 배너 미리보기" sub={`현재 노출 ${live.length}개 · 5.5초 간격 자동 롤링 · 순서대로 표시`}
        actions={<a href="#/site" target="_blank" rel="noreferrer" className="btn-outline btn-sm"><ExternalLink size={14} />홈페이지에서 확인</a>}>
        {live.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-line py-10 text-sm text-muted"><ImageOff className="mb-2" />노출 중인 배너가 없습니다. 홈페이지 메인 영역이 숨겨집니다.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {live.map((b, i) => {
              const p = b.perfId ? perfMap.get(b.perfId) : undefined
              const pal = p?.palette ?? FALLBACK
              return (
                <div key={b.id} className="relative flex w-[300px] shrink-0 items-center gap-3 overflow-hidden rounded-xl p-3 text-white" style={{ background: pal[0] }}>
                  <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 85% 15%, ${pal[1]}, transparent 50%)` }} />
                  <span className="absolute left-2 top-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold">{i + 1}</span>
                  <div className="relative min-w-0 flex-1 pl-1 pt-4">
                    <p className="truncate text-base font-black leading-tight">{b.title || '(제목 없음)'}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-semibold" style={{ color: pal[1] }}>{b.copy}</p>
                    <span className="mt-2 inline-block rounded bg-white px-2 py-0.5 text-[10px] font-bold text-ink">예매하기</span>
                  </div>
                  {p && <div className="relative w-20 shrink-0 rotate-2 overflow-hidden rounded-lg shadow-lg ring-2 ring-white/30">
                    <Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="aspect-[5/7] w-full" />
                  </div>}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="배너 목록" sub="↑↓ 버튼으로 노출 순서를 변경합니다. 변경 사항은 저장 즉시 홈페이지에 반영되며 변경이력에 기록됩니다."
        actions={<button className="btn-primary btn-sm" onClick={addNew}><Plus size={14} />배너 등록</button>} bodyClass="p-0">
        <ul className="divide-y divide-line">
          {sorted.map((b, i) => {
            const p = b.perfId ? perfMap.get(b.perfId) : undefined
            return (
              <li key={b.id} className={cx('flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap', !b.active && 'bg-paper/60')}>
                <div className="flex flex-col gap-0.5">
                  <button className="btn-ghost p-1" disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로"><ArrowUp size={14} /></button>
                  <button className="btn-ghost p-1" disabled={i === sorted.length - 1} onClick={() => move(i, 1)} aria-label="아래로"><ArrowDown size={14} /></button>
                </div>
                <span className="w-6 text-center text-sm font-bold tabular-nums text-muted">{i + 1}</span>
                <div className="w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-line">
                  {p ? <Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="aspect-[5/7] w-full" />
                    : <div className="grid aspect-[5/7] place-items-center bg-brand-600 text-[9px] font-bold text-white">TEXT</div>}
                </div>
                <div className={cx('min-w-0 flex-1', !b.active && 'opacity-60')}>
                  <div className="flex items-center gap-2"><p className="truncate font-bold">{b.title}</p><Status s={b.active ? '노출' : '숨김'} /></div>
                  <p className="truncate text-xs text-muted">{b.copy || '-'}</p>
                  <p className="mt-0.5 text-[11px] text-muted">연결 공연: {p ? <>{p.title} · {fmtRange(p.start, p.end)} · <Status s={p.status} className="!px-1.5 !py-0 !text-[10px]" /></> : '없음'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">노출</span>
                  <Toggle checked={b.active} onChange={v => toggle(b, v)} label={`${b.title} 노출`} />
                  <button className="btn-outline btn-sm" onClick={() => setEdit(b)}><Pencil size={13} />수정</button>
                  <button className="btn-ghost btn-sm text-coral-500" onClick={() => remove(b)} aria-label="삭제"><Trash2 size={14} /></button>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
      {edit && <BannerModal key={edit.id} banner={edit} perfs={perfs} exists={banners.some(b => b.id === edit.id)} onClose={() => setEdit(null)} />}
    </div>
  )
}

function BannerModal({ banner, perfs, exists, onClose }: { banner: Banner; perfs: ReturnType<typeof useStore.getState>['performances']; exists: boolean; onClose: () => void }) {
  const [f, setF] = useState(banner)
  const [err, setErr] = useState<Record<string, string>>({})
  const upsert = useStore(s => s.upsertBanner)
  const toast = useStore(s => s.toast)
  const p = perfs.find(x => x.id === f.perfId)
  const pickPerf = (id: string) => {
    const np = perfs.find(x => x.id === id)
    setF(v => ({ ...v, perfId: id || undefined, title: v.title || np?.title || '', copy: v.copy || (np ? `${fmtRange(np.start, np.end)}` : '') }))
  }
  const save = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = errMsg('E-CM-101', '배너 제목은 필수 입력입니다')
    else if (f.title.length > 30) e.title = errMsg('E-CM-102', '제목은 30자 이내로 입력해 주세요')
    if (f.copy.length > 60) e.copy = errMsg('E-CM-103', '홍보 문구는 60자 이내로 입력해 주세요')
    setErr(e)
    if (Object.keys(e).length) return
    upsert({ ...f, title: f.title.trim(), copy: f.copy.trim() })
    toast(exists ? '배너를 수정했습니다. 홈페이지에 즉시 반영됩니다.' : '새 배너를 등록했습니다.')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={exists ? '메인 배너 수정' : '메인 배너 등록'} size="lg"
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={save}>저장</button></>}>
      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
        <div className="space-y-3">
          <Field label="연결 공연" hint="공연을 선택하면 포스터·색상·예매 버튼이 자동 연결됩니다.">
            <select className="input" value={f.perfId ?? ''} onChange={e => pickPerf(e.target.value)}>
              <option value="">연결 안 함 (텍스트 배너)</option>
              {perfs.map(x => <option key={x.id} value={x.id}>{x.title} ({x.status})</option>)}
            </select>
          </Field>
          <Field label="배너 제목" required error={err.title}>
            <input className="input" value={f.title} maxLength={40} aria-invalid={!!err.title} onChange={e => setF({ ...f, title: e.target.value })} />
          </Field>
          <Field label="홍보 문구" error={err.copy} hint={`${f.copy.length}/60자 · 예: 10.16 – 11.8 백성희장민호극장`}>
            <input className="input" value={f.copy} aria-invalid={!!err.copy} onChange={e => setF({ ...f, copy: e.target.value })} />
          </Field>
          <div className="flex items-center gap-2 text-sm"><Toggle checked={f.active} onChange={v => setF({ ...f, active: v })} label="노출" /> 홈페이지 노출</div>
          {p && (p.status === '임시저장' || p.status === '판매중지') && <Note tone="warn">연결 공연이 「{p.status}」 상태여서 홈페이지에는 표시되지 않습니다.</Note>}
        </div>
        <div>
          <p className="label text-[13px]">미리보기</p>
          <div className="overflow-hidden rounded-xl p-3 text-white" style={{ background: (p?.palette ?? FALLBACK)[0] }}>
            {p && <div className="mx-auto mb-2 w-24 rotate-2 overflow-hidden rounded-lg shadow-lg"><Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="aspect-[5/7] w-full" /></div>}
            <p className="text-sm font-black">{f.title || '배너 제목'}</p>
            <p className="mt-1 text-[11px] font-semibold" style={{ color: (p?.palette ?? FALLBACK)[1] }}>{f.copy || '홍보 문구'}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
