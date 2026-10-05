import { useRef, useState } from 'react'
import { CalendarClock, Send, Smartphone } from 'lucide-react'
import { cx } from '../../../lib/format'
import { Field, Note, Segmented, ask, errMsg } from '../../ui'
import { TODAY } from '../../lib'
import { byteLen, type CouponDraft } from './shared'
import type { Sms } from '../../../store'

/* ─────────────── 쿠폰 입력 필드 ─────────────── */
export function CouponFields({ value, onChange, errors = {} }: {
  value: CouponDraft; onChange: (v: CouponDraft) => void; errors?: Partial<Record<keyof CouponDraft, string>>
}) {
  const set = <K extends keyof CouponDraft>(k: K, v: CouponDraft[K]) => onChange({ ...value, [k]: v })
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="쿠폰명" required error={errors.name} className="sm:col-span-2">
        <input className="input" value={value.name} placeholder="예) 가을 시즌 재관람 5,000원 할인" maxLength={40}
          onChange={e => set('name', e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <Field label="쿠폰 종류" required>
        <Segmented size="sm" value={value.kind} onChange={v => set('kind', v)}
          options={[{ value: '할인쿠폰', label: '할인쿠폰' }, { value: '예매권', label: '예매권(1매 무료)' }]} />
      </Field>
      {value.kind === '할인쿠폰' ? (
        <Field label="할인 방식" required>
          <Segmented size="sm" value={value.mode} onChange={v => set('mode', v)}
            options={[{ value: 'amount', label: '정액(원)' }, { value: 'rate', label: '정률(%)' }]} />
        </Field>
      ) : <div className="hidden sm:block" />}
      {value.kind === '할인쿠폰' && (value.mode === 'amount' ? (
        <Field label="할인 금액(원)" required error={errors.amount}>
          <input type="number" className="input" min={0} step={500} value={value.amount || ''} onChange={e => set('amount', Number(e.target.value))} />
        </Field>
      ) : (
        <Field label="할인율(%)" required error={errors.rate}>
          <input type="number" className="input" min={1} max={100} value={value.rate || ''} onChange={e => set('rate', Number(e.target.value))} />
        </Field>
      ))}
      {value.kind === '할인쿠폰' && (
        <Field label="최소 결제금액(원)" hint="0 입력 시 제한 없음">
          <input type="number" className="input" min={0} step={1000} value={value.minPrice || ''} onChange={e => set('minPrice', Number(e.target.value))} />
        </Field>
      )}
      <Field label="유효기간(까지)" required error={errors.until}>
        <input type="date" className="input" value={value.until} min={TODAY} onChange={e => set('until', e.target.value)} />
      </Field>
    </div>
  )
}

/* ─────────────── 메시지 작성 (알림톡·문자·메일) ─────────────── */
export type MsgKind = '알림톡' | '문자' | '메일'
export const smsKind = (k: MsgKind): Sms['kind'] => (k === '문자' ? 'SMS' : k)

const AD_HEAD = '(광고)[국립어린이청소년극단]'
const AD_TAIL = '무료수신거부 080-863-6261'

export function renderVars(text: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((t, [k, v]) => t.split(k).join(v), text)
}

export function MessageComposer({
  count, variables = [], sample = {}, onSend, defaultKind = '알림톡', ad = true, templates = [], recipientLabel,
}: {
  count: number
  variables?: string[]
  sample?: Record<string, string>
  onSend: (p: { text: string; kind: MsgKind; scheduleAt?: string }) => void
  defaultKind?: MsgKind
  ad?: boolean
  templates?: { label: string; text: string }[]
  recipientLabel: string
}) {
  const [kind, setKind] = useState<MsgKind>(defaultKind)
  const [text, setText] = useState(templates[0]?.text ?? '')
  const [reserve, setReserve] = useState(false)
  const [at, setAt] = useState(`${TODAY}T18:00`)
  const [err, setErr] = useState('')
  const ta = useRef<HTMLTextAreaElement>(null)

  const full = ad ? `${AD_HEAD}\n${text}\n\n${AD_TAIL}` : text
  const bytes = byteLen(full)
  const chars = [...full].length
  const lms = kind === '문자' && bytes > 90
  const over = kind === '문자' ? bytes > 2000 : kind === '알림톡' ? chars > 1000 : false
  const preview = renderVars(full, sample)

  const insert = (v: string) => {
    const el = ta.current
    if (!el) { setText(t => t + v); return }
    const s = el.selectionStart ?? text.length, e = el.selectionEnd ?? text.length
    const next = text.slice(0, s) + v + text.slice(e)
    setText(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + v.length, s + v.length) })
  }

  const submit = async () => {
    if (!count) { setErr(errMsg('E-CM-302', '발송 대상이 없습니다. 조건을 확인해 주세요')); return }
    if (!text.trim()) { setErr(errMsg('E-CM-301', '메시지 내용을 입력해 주세요')); return }
    if (over) { setErr(errMsg('E-CM-303', kind === '문자' ? 'LMS 최대 2,000byte를 초과했습니다' : '알림톡 최대 1,000자를 초과했습니다')); return }
    const atStr = at.replace('T', ' ')
    if (reserve && atStr <= `${TODAY} ${new Date().toTimeString().slice(0, 5)}`) { setErr(errMsg('E-CM-304', '예약 일시는 현재 이후로 설정해 주세요')); return }
    setErr('')
    const ok = await ask({
      title: reserve ? '예약 발송 등록' : `${kind} 발송`, tone: 'warn', confirmText: reserve ? '예약 등록' : '발송',
      message: <>
        <b>{recipientLabel} {count.toLocaleString()}명</b>에게 {kind}{lms ? '(LMS)' : ''}을(를) {reserve ? <><b>{atStr}</b>에 예약 발송</> : '즉시 발송'}합니다.
        <br /><span className="text-xs text-muted">발송 비용은 건별 과금되며, 발송 후 취소할 수 없습니다.</span>
      </>,
    })
    if (ok === null) return
    onSend({ text: full, kind, scheduleAt: reserve ? atStr : undefined })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented size="sm" value={kind} onChange={setKind} options={(['알림톡', '문자', '메일'] as MsgKind[]).map(k => ({ value: k, label: k }))} />
          {templates.length > 0 && (
            <select className="input w-auto py-1.5 text-xs" defaultValue="" aria-label="템플릿 선택"
              onChange={e => { const t = templates.find(x => x.label === e.target.value); if (t) setText(t.text) }}>
              <option value="" disabled>템플릿 불러오기</option>
              {templates.map(t => <option key={t.label}>{t.label}</option>)}
            </select>
          )}
        </div>
        {variables.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-muted">치환변수</span>
            {variables.map(v => (
              <button key={v} type="button" onClick={() => insert(v)} className="rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-brand-700 hover:bg-brand-100">{v}</button>
            ))}
          </div>
        )}
        <div>
          <textarea ref={ta} className="input min-h-36 font-[inherit] leading-relaxed" value={text} onChange={e => { setText(e.target.value); setErr('') }}
            placeholder="메시지 내용을 입력하세요" aria-label="메시지 내용" />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-muted">{ad && '(광고) 표기·수신거부 안내 자동 삽입 · '}{kind === '메일' ? 'HTML 메일 템플릿 적용' : kind === '알림톡' ? '승인 템플릿 미일치 시 문자 대체발송'
              : lms ? 'LMS (90byte 초과)' : 'SMS (90byte 이하)'}</span>
            <span className={cx('font-semibold tabular-nums', over ? 'text-coral-500' : lms ? 'text-amber-600' : 'text-muted')}>
              {kind === '알림톡' ? `${chars.toLocaleString()} / 1,000자` : kind === '문자' ? `${bytes.toLocaleString()} / ${lms ? '2,000' : '90'} byte` : `${chars.toLocaleString()}자`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold">
            <input type="checkbox" checked={reserve} onChange={e => setReserve(e.target.checked)} /><CalendarClock size={14} />예약 발송
          </label>
          {reserve && <input type="datetime-local" className="input w-auto py-1.5" value={at} min={`${TODAY}T00:00`} onChange={e => setAt(e.target.value)} aria-label="예약 일시" />}
        </div>
        {err && <Note tone="err">{err}</Note>}
        <div className="flex justify-end">
          <button type="button" className="btn-primary btn-sm" onClick={submit}><Send size={14} />{count.toLocaleString()}명에게 {reserve ? '예약 등록' : '발송'}</button>
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted"><Smartphone size={13} />미리보기 (첫 번째 대상 기준)</div>
        <div className="rounded-2xl border-4 border-gray-800 bg-[#b2c7da] p-3">
          <div className={cx('max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl p-3 text-[12px] leading-relaxed shadow-sm',
            kind === '알림톡' ? 'bg-white' : kind === '문자' ? 'bg-[#fef01b]/90' : 'bg-white font-sans')}>
            {kind === '알림톡' && <div className="mb-1.5 rounded bg-[#fee500] px-2 py-1 text-[11px] font-bold">알림톡 도착</div>}
            {kind === '메일' && <div className="mb-1.5 border-b border-line pb-1 text-[11px] font-bold text-brand-600">noreply@ntcy.go.kr</div>}
            {preview || <span className="text-muted">내용을 입력하세요</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
