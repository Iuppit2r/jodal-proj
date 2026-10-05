import { Globe, Smartphone } from 'lucide-react'
import { useAdminLocal } from '../../adminStore'
import type { PerfStatus, Round } from '../../../data/types'
import { cx } from '../../../lib/format'
import { Card, Field, Note, Status } from '../../ui'
import { TODAY, roundLabel } from '../../lib'
import { STATUSES, fromLocalInput, toLocalInput, type TabProps } from './shared'

const STATUS_DESC: Record<PerfStatus, string> = {
  임시저장: '관리자만 조회 · 홈페이지 미노출',
  오픈예정: '홈페이지 노출 · 오픈일시 안내',
  선예매중: '유료 멤버십 회원만 예매 가능',
  판매중: '전체 회원 예매 가능',
  매진: '예매 버튼 비활성 (매진 표기)',
  판매종료: '공연 종료 · 예매 불가',
  판매중지: '긴급 판매 중지 · 예매 불가',
}

export function OpenTab({ p, set, errors }: TabProps) {
  const now = `${TODAY} ${new Date().toTimeString().slice(0, 5)}`
  const auto = now >= p.openAt ? '예매하기 (일반 판매)' : p.presaleAt && now >= p.presaleAt ? '멤버십 선예매' : `${p.openAt.slice(5, 10).replace('-', '.')} ${p.openAt.slice(11)} 오픈 예정`
  return (
    <div className="space-y-4">
      <Card title="티켓 오픈 정보" sub="SFR-TC-008 판매일시 기준 예매 버튼 자동 노출">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="티켓오픈 일시" required error={errors.openAt} hint="일반 회원 예매 시작 일시">
            <input type="datetime-local" className="input" value={toLocalInput(p.openAt)} aria-invalid={errors.openAt ? true : undefined}
              onChange={e => set({ openAt: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label="유료회원 선예매 시작일시" error={errors.presaleAt} hint="비워두면 선예매 없이 일반 오픈">
            <div className="flex gap-2">
              <input type="datetime-local" className="input" value={toLocalInput(p.presaleAt)} aria-invalid={errors.presaleAt ? true : undefined}
                onChange={e => set({ presaleAt: e.target.value ? fromLocalInput(e.target.value) : undefined })} />
              {p.presaleAt && <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => set({ presaleAt: undefined })}>해제</button>}
            </div>
          </Field>
        </div>
        <Note className="mt-4">
          홈페이지 예매 버튼은 판매상태와 오픈일시에 따라 <b>자동 노출</b>됩니다. 현재 시각 기준 노출 상태: <b>{p.status === '임시저장' ? '미노출 (임시저장)' : auto}</b>
        </Note>
      </Card>

      <Card title="판매상태">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map(s => (
            <button key={s} type="button" onClick={() => set({ status: s })}
              className={cx('rounded-lg border p-3 text-left transition', p.status === s ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-brand-500')}>
              <Status s={s} />
              <div className="mt-1.5 text-[11px] leading-snug text-muted">{STATUS_DESC[s]}</div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">※ 임시저장 상태에서 [저장]하면 오픈일시 기준으로 오픈예정/선예매중/판매중 상태가 자동 지정됩니다.</p>
      </Card>
    </div>
  )
}

export function PresaleTab({ p, set, ex, setEx, rounds }: TabProps & { rounds: Round[] }) {
  const tiers = useAdminLocal(s => s.tiers)
  const ps = ex.presale
  const put = (patch: Partial<typeof ps>) => setEx({ presale: { ...ps, ...patch } })
  const tog = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  const active = rounds.filter(r => r.active)

  return (
    <div className="space-y-4">
      {!p.presaleAt && <Note tone="warn">선예매 시작일시가 설정되지 않았습니다. 아래에서 기간을 지정하면 선예매가 활성화됩니다.</Note>}
      <Card title="선예매 기간 · 대상" sub="SFR-PM-004 유료 멤버십 회원 선예매">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="선예매 기간" hint="종료 시점은 티켓오픈 일시와 동일합니다">
            <div className="flex items-center gap-2">
              <input type="datetime-local" className="input" value={toLocalInput(p.presaleAt)} aria-label="선예매 시작"
                onChange={e => set({ presaleAt: e.target.value ? fromLocalInput(e.target.value) : undefined })} />
              <span className="text-muted">~</span>
              <input type="datetime-local" className="input bg-paper" value={toLocalInput(p.openAt)} readOnly aria-label="선예매 종료(티켓오픈)" />
            </div>
          </Field>
          <Field label="1인 예매 매수 제한">
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={10} className="input w-28" value={ps.limit} onChange={e => put({ limit: Math.max(1, Number(e.target.value)) })} />
              <span className="text-sm text-muted">매 / 회차</span>
            </div>
          </Field>
          <Field label="대상 멤버십 등급">
            <div className="flex flex-wrap gap-2">
              {tiers.map(t => (
                <label key={t.id} className={cx('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm', ps.tiers.includes(t.id) ? 'border-brand-600 bg-brand-50' : 'border-line')}>
                  <input type="checkbox" checked={ps.tiers.includes(t.id)} onChange={() => put({ tiers: tog(ps.tiers, t.id) })} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  <b>{t.name}</b><span className="text-xs text-muted">{t.price.toLocaleString()}원/년</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="판매 채널">
            <div className="flex flex-wrap gap-2">
              {[{ v: '홈페이지', i: <Globe size={14} /> }, { v: '모바일', i: <Smartphone size={14} /> }].map(c => (
                <label key={c.v} className={cx('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm', ps.channels.includes(c.v) ? 'border-brand-600 bg-brand-50' : 'border-line')}>
                  <input type="checkbox" checked={ps.channels.includes(c.v)} onChange={() => put({ channels: tog(ps.channels, c.v) })} />
                  {c.i}{c.v}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="대상 회차">
        <div className="mb-3 flex gap-4 text-sm">
          <label className="flex items-center gap-1.5"><input type="radio" checked={ps.roundMode === 'all'} onChange={() => put({ roundMode: 'all' })} />전체 회차 ({active.length})</label>
          <label className="flex items-center gap-1.5"><input type="radio" checked={ps.roundMode === 'selected'} onChange={() => put({ roundMode: 'selected' })} />선택 회차 ({ps.roundIds.length})</label>
        </div>
        {ps.roundMode === 'selected' && (
          active.length ? (
            <div className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-2 lg:grid-cols-3">
              {active.map(r => (
                <label key={r.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-paper">
                  <input type="checkbox" checked={ps.roundIds.includes(r.id)} onChange={() => put({ roundIds: tog(ps.roundIds, r.id) })} />
                  <span className="tabular-nums">{roundLabel(r)}</span>{r.note && <span className="chip bg-violet-50 text-[10px] text-violet-700">{r.note}</span>}
                </label>
              ))}
            </div>
          ) : <Note tone="warn">회차 탭에서 회차를 먼저 생성하세요.</Note>
        )}
      </Card>

      <Card title="멤버십 인증 버튼" sub="선예매 기간 동안 상세 페이지 예매 버튼 대신 노출됩니다.">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <Field label="버튼 타이틀">
            <input className="input" value={ps.buttonTitle} maxLength={24} onChange={e => put({ buttonTitle: e.target.value })} />
          </Field>
          <div>
            <div className="label text-[13px]">미리보기</div>
            <div className="rounded-lg bg-paper p-3">
              <button type="button" className="btn-accent w-full">{ps.buttonTitle || '선예매'}</button>
              <p className="mt-1.5 text-center text-[11px] text-muted">{ps.tiers.map(id => tiers.find(t => t.id === id)?.name).join('·') || '대상 없음'} 회원 · 1인 {ps.limit}매</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
