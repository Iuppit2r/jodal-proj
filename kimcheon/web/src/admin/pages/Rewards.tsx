import { useMemo, useState } from 'react'
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { userById, type AdminReward, type PayStatus } from '../data'
import { useAdmin } from '../store'
import { Badge, Btn, DownloadBtn, Field, inputCls, Modal, PageHead, Pager, Panel, Table, Toggle } from '../ui'

// ── 인증물품 관리 (SFR-012) ──────────────────────────────
export function Rewards() {
  const { rewards, applications, saveReward, deleteReward, flash } = useAdmin()
  const [q, setQ] = useState('')
  const [use, setUse] = useState<'' | 'y' | 'n'>('')
  const [edit, setEdit] = useState<AdminReward | null>(null)
  const list = rewards.filter((r) => (!q || r.name.includes(q)) && (!use || (use === 'y') === r.enabled))
  const applied = (id: string) => applications.filter((a) => a.rewardId === id).length

  return (
    <>
      <PageHead

        title="인증물품 관리"
        desc="지급할 물품을 등록·수정·삭제합니다. 「사용」으로 설정한 물품만 사용자 앱 신청서에 나타납니다."
        actions={
          <Btn kind="primary" onClick={() => setEdit({ id: `rw${Date.now()}`, name: '', desc: '', stock: 0, enabled: true, created: '2026-10-06' })}>
            <Plus size={16} /> 물품 등록
          </Btn>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <label className="relative">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="물품명 검색" className={`${inputCls} w-52 pl-9`} />
          </label>
          <select value={use} onChange={(e) => setUse(e.target.value as '' | 'y' | 'n')} className={`${inputCls} w-36`}>
            <option value="">사용여부 전체</option>
            <option value="y">사용</option>
            <option value="n">사용안함</option>
          </select>
        </div>
        <Table
          rows={list}
          rowKey={(r) => r.id}
          cols={[
            { h: '물품명', cell: (r) => <span className="font-bold">{r.name}</span> },
            { h: '설명', cell: (r) => <span className="text-sub">{r.desc}</span> },
            { h: '재고', align: 'right', cell: (r) => (r.stock === 999 ? '제한 없음' : r.stock === 0 ? <Badge tone="accent">소진</Badge> : `${r.stock}개`) },
            { h: '신청', align: 'right', cell: (r) => `${applied(r.id)}건` },
            { h: '등록일', cell: (r) => r.created.replaceAll('-', '.') },
            {
              h: '사용여부',
              align: 'center',
              cell: (r) => (
                <div className="flex items-center justify-center gap-2">
                  <Toggle
                    on={r.enabled}
                    onChange={() => {
                      saveReward({ ...r, enabled: !r.enabled })
                      flash(`${r.name}: ${r.enabled ? '사용안함 — 앱 신청서에서 숨김' : '사용 — 앱 신청서에 표시'}`)
                    }}
                  />
                  <span className={`w-14 text-left font-semibold ${r.enabled ? 'text-forest' : 'text-sub'}`}>{r.enabled ? '사용' : '사용안함'}</span>
                </div>
              ),
            },
            {
              h: '관리',
              align: 'center',
              cell: (r) => (
                <div className="flex justify-center gap-1">
                  <Btn kind="ghost" onClick={() => setEdit(r)}>
                    <Pencil size={15} /> 수정
                  </Btn>
                  <Btn
                    kind="ghost"
                    onClick={() => {
                      deleteReward(r.id)
                      flash('물품을 삭제했습니다')
                    }}
                  >
                    <Trash2 size={15} /> 삭제
                  </Btn>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      {edit && (
        <Modal
          title={rewards.some((r) => r.id === edit.id) ? '물품 수정' : '물품 등록'}
          onClose={() => setEdit(null)}
          footer={
            <>
              <Btn onClick={() => setEdit(null)}>취소</Btn>
              <Btn
                kind="primary"
                disabled={!edit.name}
                onClick={() => {
                  saveReward(edit)
                  setEdit(null)
                  flash('저장했습니다')
                }}
              >
                저장
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="물품명">
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={`${inputCls} w-full`} placeholder="예: 오삼이 등산 양말" />
            </Field>
            <Field label="설명">
              <input value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} className={`${inputCls} w-full`} />
            </Field>
            <Field label="재고 수량">
              <input value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) || 0 })} className={`${inputCls} w-full`} />
            </Field>
            <div className="flex items-center justify-between rounded-lg bg-bg p-3">
              <span className="text-[14px] font-bold">사용여부 (사용 시 앱 신청서에 표시)</span>
              <Toggle on={edit.enabled} onChange={() => setEdit({ ...edit, enabled: !edit.enabled })} />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── 물품 지급 현황 관리 (SFR-013) ────────────────────────
const STATUSES: PayStatus[] = ['신청완료', '지급준비', '수령완료']
const tone = (s: PayStatus) => (s === '수령완료' ? 'green' : s === '지급준비' ? 'gold' : 'brand')

export function Payments() {
  const { applications, rewards, setPayStatus, flash } = useAdmin()
  const [q, setQ] = useState('')
  const [st, setSt] = useState<PayStatus | ''>('')
  const [reward, setReward] = useState('')
  const [page, setPage] = useState(1)
  const [checked, setChecked] = useState<number[]>([])
  const list = useMemo(
    () => applications.filter((a) => (!q || userById(a.userId).name.includes(q)) && (!st || a.status === st) && (!reward || a.rewardId === reward)),
    [applications, q, st, reward],
  )
  const rname = (id: string) => rewards.find((r) => r.id === id)?.name ?? id
  const PER = 15
  const rows = list.slice((page - 1) * PER, page * PER)

  return (
    <>
      <PageHead

        title="물품 지급 현황"
        desc="사용자가 신청한 물품과 수령일을 확인하고 지급 상태(신청완료 → 지급준비 → 수령완료)를 관리합니다."
        actions={
          <DownloadBtn menu="물품 지급 현황" rows={list.length} label="발송 목록 내려받기" />
        }
      />
      {/* 물품별 신청자 현황 */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {rewards
          .filter((r) => r.id !== 'cert' && applications.some((a) => a.rewardId === r.id))
          .map((r) => {
            const a = applications.filter((x) => x.rewardId === r.id)
            return (
              <button key={r.id} onClick={() => setReward(reward === r.id ? '' : r.id)} className={`rounded-xl border bg-white px-4 py-3 text-left ${reward === r.id ? 'border-brand ring-2 ring-brand/20' : 'border-line'}`}>
                <p className="truncate text-[14px] font-bold">{r.name}</p>
                <p className="mt-0.5 text-[20px] font-black">{a.length}명</p>
                <p className="text-[13px] text-sub">
                  수령 {a.filter((x) => x.status === '수령완료').length} · 대기 {a.filter((x) => x.status !== '수령완료').length}
                </p>
              </button>
            )
          })}
      </div>
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <div className="flex rounded-lg bg-alt p-1">
            {(['', ...STATUSES] as const).map((s) => (
              <button
                key={s || 'all'}
                onClick={() => {
                  setSt(s)
                  setPage(1)
                }}
                className={`h-8 rounded-md px-3 text-[14px] font-bold ${st === s ? 'bg-white text-brand shadow-sm' : 'text-sub'}`}
              >
                {s || '전체'} {s ? applications.filter((a) => a.status === s).length : applications.length}
              </button>
            ))}
          </div>
          <span className="flex-1" />
          {checked.length > 0 && (
            <Btn
              kind="primary"
              onClick={() => {
                checked.forEach((no) => setPayStatus(no, '수령완료'))
                flash(`${checked.length}건을 수령완료로 변경했습니다`)
                setChecked([])
              }}
            >
              선택 {checked.length}건 수령완료 처리
            </Btn>
          )}
          <label className="relative">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="신청자명 검색"
              className={`${inputCls} w-48 pl-9`}
            />
          </label>
        </div>
        <Table
          rows={rows}
          rowKey={(a) => String(a.no)}
          offset={(page - 1) * PER}
          cols={[
            {
              h: '선택',
              align: 'center',
              w: '56px',
              cell: (a) => (
                <input
                  type="checkbox"
                  checked={checked.includes(a.no)}
                  onChange={() => setChecked((c) => (c.includes(a.no) ? c.filter((x) => x !== a.no) : [...c, a.no]))}
                  className="size-4 accent-[#1F4434]"
                />
              ),
            },
            { h: '신청자명', cell: (a) => <span className="font-bold">{userById(a.userId).masked}</span> },
            { h: '연락처', cell: (a) => userById(a.userId).phone },
            { h: '물품명', cell: (a) => `완등 인증서 + ${rname(a.rewardId)}` },
            { h: '수령 방법', align: 'center', cell: (a) => a.method },
            { h: '수령일', cell: (a) => a.receiveDate.replaceAll('-', '.') },
            { h: '신청일', cell: (a) => a.applied.replaceAll('-', '.') },
            {
              h: '지급 상태',
              align: 'center',
              cell: (a) => (
                <div className="flex items-center justify-center gap-2">
                  <Badge tone={tone(a.status)}>{a.status}</Badge>
                  <select
                    value={a.status}
                    onChange={(e) => {
                      setPayStatus(a.no, e.target.value as PayStatus)
                      flash(`${userById(a.userId).masked}: ${e.target.value}(으)로 변경 · 알림 발송`)
                    }}
                    className={`${inputCls} h-8 w-28`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ),
            },
          ]}
        />
        <Pager page={page} pages={Math.ceil(list.length / PER)} onPage={setPage} total={list.length} />
      </Panel>
    </>
  )
}
