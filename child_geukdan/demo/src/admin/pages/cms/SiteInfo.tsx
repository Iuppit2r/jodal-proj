import { useState } from 'react'
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useStore } from '../../../store'
import { useAdminLocal } from '../../adminStore'
import { Card, Field, Note, Toggle, ask, errMsg } from '../../ui'
import { uid, useCmsLocal } from './cmsStore'

type Info = ReturnType<typeof useAdminLocal.getState>['siteInfo']
type Sns = ReturnType<typeof useCmsLocal.getState>['sns']

export default function SiteInfo() {
  const saved = useAdminLocal(s => s.siteInfo)
  const setAdmin = useAdminLocal(s => s.set)
  const savedSns = useCmsLocal(s => s.sns)
  const setCms = useCmsLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [f, setF] = useState<Info>({ ...saved })
  const [sns, setSns] = useState<Sns>(() => savedSns.map(x => ({ ...x })))
  const [err, setErr] = useState<Record<string, string>>({})
  const dirty = JSON.stringify(f) !== JSON.stringify(saved) || JSON.stringify(sns) !== JSON.stringify(savedSns)

  const save = () => {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = errMsg('E-CM-701', '기관명은 필수 입력입니다')
    if (!/^(\d{2,4}-\d{3,4}-\d{4}|1\d{3}-\d{4})$/.test(f.tel)) e.tel = errMsg('E-CM-702', '전화번호 형식이 올바르지 않습니다 (예: 1600-6261, 02-123-4567)')
    if (!/^\d{3}-\d{2}-\d{5}$/.test(f.bizNo)) e.bizNo = errMsg('E-CM-703', '사업자등록번호 형식이 올바르지 않습니다 (000-00-00000)')
    if (!f.addr.trim()) e.addr = errMsg('E-CM-704', '주소를 입력해 주세요')
    sns.forEach(s => { if (s.url && !/^https?:\/\/.+/.test(s.url)) e['sns-' + s.id] = errMsg('E-CM-705', 'URL은 http(s):// 로 시작해야 합니다') })
    setErr(e)
    if (Object.keys(e).length) { toast(errMsg('E-CM-700', '입력값을 확인해 주세요'), 'err'); return }
    const changed = (Object.keys(f) as (keyof Info)[]).filter(k => f[k] !== saved[k])
    setAdmin({ siteInfo: { ...f } })
    setCms({ sns: sns.map(x => ({ ...x })) })
    log('사이트 기본정보 저장', changed.length ? `변경 항목: ${changed.join(', ')}` : 'SNS 링크')
    toast('사이트 기본정보를 저장했습니다.')
  }
  const delSns = async (id: string, name: string) => {
    const r = await ask({ title: 'SNS 링크 삭제', tone: 'danger', confirmText: '삭제', message: <>「{name}」 링크를 삭제합니다.</> })
    if (r !== null) setSns(s => s.filter(x => x.id !== id))
  }
  const input = (k: keyof Info, label: string, hint?: string, req = true) => (
    <Field label={label} required={req} error={err[k]} hint={hint}>
      <input className="input" value={f[k]} aria-invalid={!!err[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
    </Field>
  )

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <Card title="기관 기본정보" sub="홈페이지 하단(Footer)·메타정보·티켓 출력물에 사용됩니다."
          actions={<>
            {dirty && <span className="text-xs font-semibold text-amber-600">저장되지 않은 변경사항</span>}
            <button className="btn-outline btn-sm" disabled={!dirty} onClick={() => { setF({ ...saved }); setSns(savedSns.map(x => ({ ...x }))); setErr({}) }}><RotateCcw size={13} />되돌리기</button>
            <button className="btn-primary btn-sm" onClick={save}><Save size={13} />저장</button>
          </>}>
          <div className="grid gap-3 md:grid-cols-2">
            {input('name', '기관명')}
            {input('ceo', '대표자', undefined, false)}
            {input('tel', '대표전화', '예: 1600-6261')}
            {input('bizNo', '사업자등록번호', '000-00-00000')}
            <div className="md:col-span-2">{input('addr', '주소')}</div>
            <div className="md:col-span-2">{input('copyright', '카피라이트', undefined, false)}</div>
          </div>
        </Card>
        <Card title="SNS 링크" actions={<button className="btn-outline btn-sm" onClick={() => setSns(s => [...s, { id: uid('sns'), name: '새 채널', url: 'https://', on: true }])}><Plus size={13} />추가</button>}>
          <div className="space-y-2">
            {sns.map(s => (
              <div key={s.id} className="grid items-start gap-2 sm:grid-cols-[150px_1fr_auto]">
                <input className="input py-2" value={s.name} onChange={e => setSns(l => l.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))} aria-label="채널명" />
                <div>
                  <input className="input py-2 font-mono text-xs" value={s.url} aria-invalid={!!err['sns-' + s.id]} onChange={e => setSns(l => l.map(x => x.id === s.id ? { ...x, url: e.target.value } : x))} aria-label="URL" />
                  {err['sns-' + s.id] && <p className="mt-1 text-xs text-coral-500">{err['sns-' + s.id]}</p>}
                </div>
                <div className="flex h-[38px] items-center gap-2">
                  <Toggle checked={s.on} onChange={v => setSns(l => l.map(x => x.id === s.id ? { ...x, on: v } : x))} label="노출" />
                  <button className="btn-ghost p-1.5 text-coral-500" onClick={() => delSns(s.id, s.name)} aria-label="삭제"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Footer 미리보기" className="h-fit">
        <div className="rounded-xl bg-ink p-5 text-white/70">
          <p className="text-base font-extrabold text-white">{f.name || '기관명'}</p>
          <div className="mt-3 space-y-1 text-xs leading-relaxed">
            <p>{f.addr}</p>
            <p>대표전화 {f.tel} · 대표자 {f.ceo} · 사업자등록번호 {f.bizNo}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sns.filter(s => s.on).map(s => <span key={s.id} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">{s.name}</span>)}
          </div>
          <p className="mt-4 border-t border-white/10 pt-3 text-[11px]">{f.copyright}</p>
        </div>
        <Note className="mt-3">저장 시 변경이력에 기록되며, 홈페이지 하단 정보에 반영됩니다.</Note>
      </Card>
    </div>
  )
}
