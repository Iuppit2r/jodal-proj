import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { Grade } from '../../../data/types'
import { cx } from '../../../lib/format'
import { useAdminLocal } from '../../adminStore'
import { Card, Field, Note, Toggle } from '../../ui'
import { ACCESS_OPTIONS, AGE_LIMITS, GENRES, GRADES, TARGETS, nextCode, type TabProps } from './shared'
import { ChipInput } from './widgets'

export function BasicTab({ p, set, errors }: TabProps) {
  const perfs = useStore(s => s.performances)
  const admins = useAdminLocal(s => s.adminUsers)
  const managers = admins.filter(a => a.active && a.role !== '티켓매니저')
  const regen = () => set({ code: nextCode(perfs.filter(x => x.id !== p.id), (p.start || '2026').slice(0, 4)) })
  const inv = (k: string) => (errors[k] ? true : undefined)

  return (
    <div className="space-y-4">
      <Card title="공연 기본정보" sub="* 표시는 필수 입력 항목입니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="공연명" required error={errors.title} className="md:col-span-2">
            <input className="input" value={p.title} aria-invalid={inv('title')} maxLength={60} placeholder="예) 달을 삼킨 고양이"
              onChange={e => set({ title: e.target.value })} />
          </Field>
          <Field label="영문명">
            <input className="input" value={p.titleEn} placeholder="English title" onChange={e => set({ titleEn: e.target.value })} />
          </Field>
          <Field label="부제">
            <input className="input" value={p.subtitle} placeholder="예) 2026 어린이극 신작" onChange={e => set({ subtitle: e.target.value })} />
          </Field>
          <Field label="공연코드" required error={errors.code} hint="NTCY-연도-일련번호 자동 채번 (통합전산망 전송 키)">
            <div className="flex gap-2">
              <input className="input font-mono" value={p.code} aria-invalid={inv('code')} onChange={e => set({ code: e.target.value.toUpperCase() })} />
              <button type="button" className="btn-outline btn-sm shrink-0" onClick={regen} title="공연 시작연도 기준 재채번"><RefreshCw size={13} />재채번</button>
            </div>
          </Field>
          <Field label="기획사" required error={errors.producer}>
            <input className="input" value={p.producer} aria-invalid={inv('producer')} onChange={e => set({ producer: e.target.value })} />
          </Field>
          <Field label="장르" required>
            <select className="input" value={p.genre} onChange={e => set({ genre: e.target.value as typeof p.genre })}>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="관람 대상" required>
            <div className="flex gap-1.5">
              {TARGETS.map(t => (
                <button key={t} type="button" onClick={() => set({ target: t })}
                  className={cx('flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition', p.target === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-muted hover:border-brand-500')}>{t}</button>
              ))}
            </div>
          </Field>
          <Field label="관람등급" required error={errors.ageLimit}>
            <select className="input" value={p.ageLimit} aria-invalid={inv('ageLimit')} onChange={e => set({ ageLimit: e.target.value })}>
              <option value="">선택</option>
              {[...new Set([...AGE_LIMITS, p.ageLimit].filter(Boolean))].map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="관람시간(분)" required error={errors.runtime} hint="인터미션 포함">
            <input type="number" min={10} max={300} className="input" value={p.runtime || ''} aria-invalid={inv('runtime')}
              onChange={e => set({ runtime: Number(e.target.value) })} />
          </Field>
          <Field label="공연장" required error={errors.venueId}>
            <select className="input" value={p.venueId} aria-invalid={inv('venueId')} onChange={e => set({ venueId: e.target.value })}>
              {M.venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.rows.length * v.cols}석)</option>)}
            </select>
          </Field>
          <Field label="담당자" required error={errors.manager}>
            <select className="input" value={p.manager} aria-invalid={inv('manager')} onChange={e => set({ manager: e.target.value })}>
              <option value="">선택</option>
              {[...new Set([...managers.map(a => a.name), p.manager].filter(Boolean))].map(n => <option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="공연기간" required error={errors.start || errors.end} className="md:col-span-2">
            <div className="flex items-center gap-2">
              <input type="date" className="input" value={p.start} aria-invalid={inv('start')} aria-label="공연 시작일" onChange={e => set({ start: e.target.value })} />
              <span className="text-muted">~</span>
              <input type="date" className="input" value={p.end} min={p.start} aria-invalid={inv('end')} aria-label="공연 종료일" onChange={e => set({ end: e.target.value })} />
            </div>
          </Field>
        </div>
      </Card>

      <Card title="운영 구분">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">대관 공연</div>
                <div className="text-xs text-muted">대관 공연은 정산 수수료를 공제 후 기획사에 지급합니다</div>
              </div>
              <Toggle checked={p.isRental} label="대관 공연" onChange={v => set({ isRental: v, feeRate: v ? (p.feeRate || 10) : 0 })} />
            </div>
            <Field label="정산 수수료(%)" required={p.isRental} error={errors.feeRate} className="mt-3">
              <input type="number" min={0} max={50} step={0.5} className="input" disabled={!p.isRental} value={p.feeRate}
                aria-invalid={inv('feeRate')} onChange={e => set({ feeRate: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border border-line p-3">
            <label className="flex items-center justify-between gap-3">
              <span><span className="block text-sm font-semibold">문화비 소득공제</span><span className="text-xs text-muted">결제 시 소득공제 대상 표기·국세청 신고</span></span>
              <Toggle checked={p.incomeDeduction} label="소득공제" onChange={v => set({ incomeDeduction: v })} />
            </label>
            <label className="flex items-center justify-between gap-3 border-t border-line pt-3">
              <span><span className="block text-sm font-semibold">패키지 대상</span><span className="text-xs text-muted">시즌·자유 패키지 상품 구성 시 선택 가능</span></span>
              <Toggle checked={p.packageEligible} label="패키지 대상" onChange={v => set({ packageEligible: v })} />
            </label>
          </div>
        </div>
      </Card>

      <Card title="태그 · 접근성 서비스" sub="홈페이지 공연 목록 필터 및 상세 페이지에 노출됩니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="태그" hint="Enter 또는 쉼표로 추가">
            <ChipInput value={p.tags} onChange={v => set({ tags: v })} placeholder="예) 가족관람" suggestions={['가족관람', '창작초연', '라이브연주', '비언어극', '겨울방학']} />
          </Field>
          <Field label="접근성 서비스" hint="회차 정보 포함 입력 가능 – 예) 수어통역(10/25 14:00)">
            <ChipInput value={p.accessibility} onChange={v => set({ accessibility: v })} placeholder="서비스 입력" suggestions={ACCESS_OPTIONS} />
          </Field>
        </div>
      </Card>
    </div>
  )
}

export function PriceTab({ p, set, errors, ex, setEx }: TabProps) {
  const venue = M.venues.find(v => v.id === p.venueId)!
  const gradeOverrides = useStore(s => s.gradeOverrides)
  const counts = useMemo(() => {
    const c: Record<Grade, number> = { R: 0, S: 0, A: 0, W: 0 }
    const ov = gradeOverrides[p.id] ?? {}
    for (const id of M.seatIds(venue)) c[ov[id] ?? M.defaultGrade(venue, id)]++
    return c
  }, [venue, gradeOverrides, p.id])
  const enabled = GRADES.filter(g => p.prices[g] != null)

  const setPrice = (g: Grade, v: number | undefined) => {
    const prices = { ...p.prices }
    if (v == null) delete prices[g]
    else prices[g] = v
    set({ prices })
  }

  return (
    <div className="space-y-4">
      <Card title="등급별 가격" sub={`${venue.name} 기본 좌석 배치 기준 (좌석 등급 배정은 좌석관리 메뉴에서 변경)`}>
        {errors.prices && <Note tone="err" className="mb-3">{errors.prices}</Note>}
        <div className="tbl-wrap overflow-x-auto rounded-lg border border-line">
          <table className="tbl">
            <thead><tr><th className="w-14">사용</th><th>등급</th><th className="text-right">좌석 수</th><th>판매가(원)</th><th className="text-right">최대 매출</th></tr></thead>
            <tbody>
              {GRADES.map(g => {
                const on = p.prices[g] != null
                return (
                  <tr key={g} className={cx(!on && 'opacity-50')}>
                    <td><input type="checkbox" checked={on} aria-label={`${M.gradeLabel[g]} 사용`} onChange={() => setPrice(g, on ? undefined : g === 'R' ? 30000 : g === 'S' ? 25000 : 20000)} /></td>
                    <td><span className="inline-flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-sm" style={{ background: M.gradeColor[g] }} />{M.gradeLabel[g]}</span></td>
                    <td className="text-right tabular-nums">{counts[g]}석</td>
                    <td>
                      <input type="number" step={1000} min={0} className="input w-36 py-1.5 text-right tabular-nums" disabled={!on} aria-invalid={errors.prices ? true : undefined}
                        value={p.prices[g] ?? ''} aria-label={`${M.gradeLabel[g]} 가격`} onChange={e => setPrice(g, Math.max(0, Number(e.target.value)))} />
                    </td>
                    <td className="text-right tabular-nums text-muted">{on ? ((p.prices[g] ?? 0) * counts[g]).toLocaleString() + '원' : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {enabled.some(g => !counts[g]) && <Note tone="warn" className="mt-3">배정된 좌석이 없는 등급이 있습니다. 좌석관리에서 등급을 배정하세요.</Note>}
      </Card>

      <Card title="사용 권종 · 할인" sub="선택한 권종만 예매 화면·현장판매에 노출됩니다. 할인율은 티켓관리 > 권종 설정 기준입니다.">
        {errors.ticketTypes && <Note tone="err" className="mb-3">{errors.ticketTypes}</Note>}
        <div className="mb-2 flex gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => setEx({ ticketTypes: M.ticketTypes.map(t => t.id) })}>전체 선택</button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setEx({ ticketTypes: [] })}>전체 해제</button>
        </div>
        <div className="tbl-wrap overflow-x-auto rounded-lg border border-line">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-14">사용</th><th>권종</th><th>조건</th><th className="text-right">할인율</th>
                {enabled.map(g => <th key={g} className="text-right">{M.gradeLabel[g]}</th>)}
              </tr>
            </thead>
            <tbody>
              {M.ticketTypes.map(t => {
                const on = ex.ticketTypes.includes(t.id)
                return (
                  <tr key={t.id} className={cx(!on && 'opacity-50')}>
                    <td><input type="checkbox" checked={on} aria-label={`${t.name} 사용`}
                      onChange={() => setEx({ ticketTypes: on ? ex.ticketTypes.filter(x => x !== t.id) : [...ex.ticketTypes, t.id] })} /></td>
                    <td className="font-semibold">
                      {t.name}
                      {t.needsProof && <span className="chip ml-1.5 bg-amber-50 text-[10px] text-amber-700">증빙</span>}
                      {t.memberOnly && <span className="chip ml-1.5 bg-brand-50 text-[10px] text-brand-700">멤버십</span>}
                    </td>
                    <td className="max-w-[220px] truncate text-xs text-muted">{t.desc}</td>
                    <td className="text-right tabular-nums">{Math.round(t.discountRate * 100)}%</td>
                    {enabled.map(g => (
                      <td key={g} className="text-right tabular-nums">{Math.round((p.prices[g] ?? 0) * (1 - t.discountRate)).toLocaleString()}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
