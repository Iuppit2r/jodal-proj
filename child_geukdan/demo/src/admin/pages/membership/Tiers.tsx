import { useState } from 'react'
import { Pencil, Plus, Trash2, Check } from 'lucide-react'
import Modal from '../../../components/Modal'
import { useStore } from '../../../store'
import { won } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Field, Note, Toggle, ask, errMsg, type Col } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import type { MembershipTier } from '../../../data/types'
import { countByTier, usePaidMembers } from './util'

interface Draft { id?: string; name: string; price: number; discount: number; presale: boolean; benefits: string; color: string }
const EMPTY: Draft = { name: '', price: 100000, discount: 25, presale: true, benefits: '전 공연 25% 할인 (4매)\n유료회원 선예매 (일반 오픈 3일 전)\n가입 즉시 10,000원 할인쿠폰', color: '#7c5cff' }

export default function Tiers() {
  const tiers = useAdminLocal(s => s.tiers)
  const setAdmin = useAdminLocal(s => s.set)
  const { log, toast } = useStore.getState()
  const paid = usePaidMembers()
  const counts = countByTier(paid)
  const [edit, setEdit] = useState<Draft | null>(null)

  const remove = async (t: MembershipTier) => {
    const n = counts.get(t.id) ?? 0
    if (n > 0) { toast(errMsg('E-PM-120', '가입 회원이 있는 등급은 삭제할 수 없습니다') + ` (${t.name} ${n}명)`, 'err'); return }
    const r = await ask({ title: '등급 삭제', tone: 'danger', confirmText: '삭제', message: <>「<b>{t.name}</b>」 등급을 삭제하시겠습니까? 홈페이지 멤버십 안내에서도 즉시 제외됩니다.</> })
    if (r === null) return
    setAdmin({ tiers: tiers.filter(x => x.id !== t.id) })
    log('멤버십 등급 삭제', t.name)
    toast(`${t.name} 등급을 삭제했습니다`)
  }

  const save = (d: Draft) => {
    const tier: MembershipTier = {
      id: d.id ?? 'tier-' + Date.now().toString(36), name: d.name.trim(), price: d.price, discountRate: d.discount / 100, presale: d.presale,
      benefits: d.benefits.split('\n').map(s => s.trim()).filter(Boolean), color: d.color,
    }
    setAdmin({ tiers: d.id ? tiers.map(t => (t.id === d.id ? tier : t)) : [...tiers, tier] })
    log(d.id ? '멤버십 등급 수정' : '멤버십 등급 등록', `${tier.name} / 연회비 ${tier.price.toLocaleString()}원 / 할인 ${d.discount}%`)
    toast(d.id ? `${tier.name} 등급을 수정했습니다` : `${tier.name} 등급을 등록했습니다`)
    setEdit(null)
  }

  const cols: Col<MembershipTier>[] = [
    { key: 'name', header: '등급명', render: t => <span className="flex items-center gap-2 font-bold"><span className="h-3 w-3 rounded-full" style={{ background: t.color }} />{t.name}</span>, sort: t => t.name },
    { key: 'price', header: '연회비', align: 'right', render: t => won(t.price), sort: t => t.price },
    { key: 'rate', header: '할인율', align: 'right', render: t => `${Math.round(t.discountRate * 100)}%`, sort: t => t.discountRate },
    { key: 'presale', header: '선예매', align: 'center', render: t => t.presale ? <Check size={16} className="mx-auto text-mint-500" /> : <span className="text-muted">-</span> },
    { key: 'benefits', header: '혜택', render: t => <ul className="list-inside list-disc space-y-0.5 text-xs text-muted">{t.benefits.map(b => <li key={b}>{b}</li>)}</ul> },
    { key: 'color', header: '색상', render: t => <span className="inline-flex items-center gap-1.5 font-mono text-xs"><span className="h-5 w-8 rounded border border-line" style={{ background: t.color }} />{t.color}</span> },
    { key: 'cnt', header: '회원수', align: 'right', render: t => <b>{(counts.get(t.id) ?? 0).toLocaleString()}명</b>, sort: t => counts.get(t.id) ?? 0 },
    {
      key: 'act', header: '관리', align: 'right', render: t => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost btn-sm p-1.5" aria-label="수정" onClick={() => setEdit({ id: t.id, name: t.name, price: t.price, discount: Math.round(t.discountRate * 100), presale: t.presale, benefits: t.benefits.join('\n'), color: t.color })}><Pencil size={14} /></button>
          <button className="btn-ghost btn-sm p-1.5 hover:text-coral-500" aria-label="삭제" onClick={() => remove(t)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card title={`멤버십 등급 (${tiers.length})`} sub="등급별 연회비·할인율·선예매 권한·혜택을 설정합니다. 변경 내용은 변경이력에 기록됩니다."
        actions={<>
          <ExportButtons filename="멤버십등급" count={tiers.length} getRows={() => [['등급명', '연회비', '할인율', '선예매', '혜택', '색상', '회원수'], ...tiers.map(t => [t.name, t.price, `${Math.round(t.discountRate * 100)}%`, t.presale ? 'Y' : 'N', t.benefits.join(' / '), t.color, counts.get(t.id) ?? 0])]} />
          <button className="btn-primary btn-sm" onClick={() => setEdit({ ...EMPTY })}><Plus size={14} />등급 추가</button>
        </>}>
        <DataTable columns={cols} rows={tiers} rowKey={t => t.id} />
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map(t => (
          <div key={t.id} className="card overflow-hidden">
            <div className="px-4 py-3 text-white" style={{ background: t.color }}>
              <div className="text-xs font-semibold opacity-80">국립어린이청소년극단 멤버십</div>
              <div className="text-lg font-extrabold">{t.name}</div>
              <div className="text-sm font-bold">{won(t.price)} / 년</div>
            </div>
            <ul className="space-y-1 p-4 text-xs text-muted">{t.benefits.map(b => <li key={b} className="flex gap-1.5"><Check size={13} className="mt-0.5 shrink-0" style={{ color: t.color }} />{b}</li>)}</ul>
          </div>
        ))}
      </div>
      <Note>가입 회원이 있는 등급은 삭제할 수 없으며(E-PM-120), 등급 혜택 변경은 다음 갱신 시점부터 적용됩니다.</Note>
      {edit && <TierModal draft={edit} names={tiers.filter(t => t.id !== edit.id).map(t => t.name)} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  )
}

function TierModal({ draft, names, onClose, onSave }: { draft: Draft; names: string[]; onClose: () => void; onSave: (d: Draft) => void }) {
  const [d, setD] = useState(draft)
  const [e, setE] = useState<Partial<Record<keyof Draft, string>>>({})
  const submit = () => {
    const x: Partial<Record<keyof Draft, string>> = {}
    if (!d.name.trim()) x.name = errMsg('E-PM-101', '등급명을 입력해 주세요')
    else if (names.includes(d.name.trim())) x.name = errMsg('E-PM-102', '이미 존재하는 등급명입니다')
    if (!d.price || d.price < 1000 || d.price > 1000000) x.price = errMsg('E-PM-103', '연회비는 1,000원 ~ 1,000,000원 범위로 입력해 주세요')
    if (d.discount < 0 || d.discount > 50) x.discount = errMsg('E-PM-104', '할인율은 0~50% 범위로 입력해 주세요')
    if (!d.benefits.trim()) x.benefits = errMsg('E-PM-105', '혜택을 1개 이상 입력해 주세요')
    if (!/^#[0-9a-f]{6}$/i.test(d.color)) x.color = errMsg('E-PM-106', '색상 코드 형식이 올바르지 않습니다')
    setE(x)
    if (!Object.keys(x).length) onSave(d)
  }
  return (
    <Modal open onClose={onClose} title={draft.id ? '멤버십 등급 수정' : '멤버십 등급 추가'}
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={submit}>저장</button></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="등급명" required error={e.name}><input className="input" value={d.name} maxLength={10} onChange={ev => setD({ ...d, name: ev.target.value })} placeholder="예) 숲" /></Field>
        <Field label="연회비(원)" required error={e.price}><input type="number" className="input" step={1000} value={d.price || ''} onChange={ev => setD({ ...d, price: Number(ev.target.value) })} /></Field>
        <Field label="할인율(%)" required error={e.discount}><input type="number" className="input" value={d.discount} onChange={ev => setD({ ...d, discount: Number(ev.target.value) })} /></Field>
        <Field label="색상" error={e.color}>
          <div className="flex items-center gap-2">
            <input type="color" className="h-10 w-12 cursor-pointer rounded border border-line" value={d.color} onChange={ev => setD({ ...d, color: ev.target.value })} aria-label="색상 선택" />
            <input className="input font-mono" value={d.color} onChange={ev => setD({ ...d, color: ev.target.value })} />
          </div>
        </Field>
        <Field label="선예매 권한" className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm"><Toggle checked={d.presale} onChange={v => setD({ ...d, presale: v })} label="선예매" />유료회원 선예매 (일반 오픈 전 예매 가능)</label>
        </Field>
        <Field label="혜택 (줄바꿈으로 구분)" required error={e.benefits} hint="'예매권' 또는 'N원 할인쿠폰' 문구가 있으면 가입 시 자동 지급됩니다." className="sm:col-span-2">
          <textarea className="input min-h-28" value={d.benefits} onChange={ev => setD({ ...d, benefits: ev.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
