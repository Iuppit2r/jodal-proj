import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { byId, fmtDate, mountains, TOTAL, zoneById, zones } from '../../data'
import { MountainArt } from '../../components/art'
import { peakCounts, records, roundStats, users, userById, type AdminRecord } from '../data'
import { useAdmin } from '../store'
import { Badge, Btn, DownloadBtn, Field, HBars, inputCls, Modal, PageHead, Pager, Panel, Table, VBars } from '../ui'
import { MiniStat } from './Rounds'

const PER = 15

// ── 인증현황 관리 (SFR-011) ──────────────────────────────
export function Certs() {
  const { roundId, rounds, flash, rejected, reject } = useAdmin()
  const [rejecting, setRejecting] = useState(false)
  const [why, setWhy] = useState('정상석이 사진에 보이지 않음')
  const [msg, setMsg] = useState('')
  const rd = rounds.find((r) => r.id === roundId)!
  const [view, setView] = useState<'records' | 'users'>('records')
  const [q, setQ] = useState('')
  const [peak, setPeak] = useState('')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<AdminRecord | null>(null)
  const live = roundId === 'r2026'

  const list = useMemo(
    () => (live ? records.filter((r) => (!q || userById(r.userId).name.includes(q)) && (!peak || r.mountainId === peak)) : []),
    [q, peak, live],
  )
  const userList = useMemo(() => users.filter((u) => !q || u.name.includes(q)).sort((a, b) => b.count - a.count), [q])
  const pages = Math.ceil((view === 'records' ? list.length : userList.length) / PER)
  const slice = <T,>(a: T[]) => a.slice((page - 1) * PER, page * PER)

  return (
    <>
      <PageHead

        title="인증현황 관리"
        desc={`${rd.name} · 회차명, 사용자명, 산 이름, 인증 일시, 인증사진을 확인합니다.`}
        actions={
          <DownloadBtn menu="인증현황 관리" rows={view === 'records' ? list.length : userList.length} />
        }
      />
      {!live ? (
        <Panel>
          <p className="p-10 text-center text-[15px] text-sub">
            {rd.name}은(는) 밴드 인증으로 운영되어 앱 인증 기록이 없습니다. 회차 집계: 참여 {roundStats[roundId]?.participants.toLocaleString()}명 · 완등 {roundStats[roundId]?.completers.toLocaleString()}명
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat k="인증 건수" v={`${records.length.toLocaleString()}건`} />
            <MiniStat k="참여자" v={`${users.length.toLocaleString()}명`} />
            <MiniStat k="완등자" v={`${users.filter((u) => u.count >= TOTAL).length}명`} />
            <MiniStat k="평균 인증 수" v={`${Math.round(records.length / users.length)}산`} />
          </div>
          <Panel>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
              <div className="flex rounded-lg bg-alt p-1">
                {(
                  [
                    ['records', '인증 기록'],
                    ['users', '사용자별 현황'],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => {
                      setView(k)
                      setPage(1)
                    }}
                    className={`h-8 rounded-md px-3 text-[14px] font-bold ${view === k ? 'bg-white text-brand shadow-sm' : 'text-sub'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <span className="flex-1" />
              {view === 'records' && (
                <select
                  value={peak}
                  onChange={(e) => {
                    setPeak(e.target.value)
                    setPage(1)
                  }}
                  className={`${inputCls} w-44`}
                >
                  <option value="">전체 산</option>
                  {mountains.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              )}
              <label className="relative">
                <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
                  placeholder="사용자명 검색"
                  className={`${inputCls} w-48 pl-9`}
                />
              </label>
            </div>
            {view === 'records' ? (
              <Table
                rows={slice(list)}
                rowKey={(r) => String(r.no)}
                onRow={setSel}
                startNo={list.length - (page - 1) * PER}
                cols={[
                  { h: '회차', cell: () => '2026년' },
                  { h: '사용자명', cell: (r) => <span className="font-bold">{userById(r.userId).masked}</span> },
                  { h: '산 이름', cell: (r) => byId(r.mountainId).title },
                  { h: '인증 일시', cell: (r) => `${fmtDate(r.at)} ${r.at.slice(11)}` },
                  { h: '정상석 거리', align: 'right', cell: (r) => `${r.distM}m` },
                  { h: '상태', align: 'center', cell: (r) => (rejected[r.no] ? <Badge tone="accent">반려</Badge> : <Badge tone="green">인증</Badge>) },
                  {
                    h: '인증사진',
                    align: 'center',
                    cell: (r) => (
                      <span className="inline-block h-9 w-12 overflow-hidden rounded-md align-middle">
                        <MountainArt m={byId(r.mountainId)} className="size-full" />
                      </span>
                    ),
                  },
                ]}
              />
            ) : (
              <Table
                rows={slice(userList)}
                rowKey={(u) => u.id}
                offset={(page - 1) * PER}
                cols={[
                  { h: '사용자명', cell: (u) => <span className="font-bold">{u.masked}</span> },
                  { h: '생년월일', cell: (u) => u.birth },
                  { h: '연락처', cell: (u) => u.phone },
                  { h: '본인인증', align: 'center', cell: (u) => <Badge>{u.via}</Badge> },
                  { h: '가입일', cell: (u) => u.joined.replaceAll('-', '.') },
                  {
                    h: '인증 진행',
                    cell: (u) => (
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-28 overflow-hidden rounded-full bg-alt">
                          <span className="block h-full rounded-full bg-brand" style={{ width: `${(u.count / TOTAL) * 100}%` }} />
                        </span>
                        <span className="font-semibold">
                          {u.count}/{TOTAL}
                        </span>
                      </div>
                    ),
                  },
                  { h: '완등', align: 'center', cell: (u) => (u.count >= TOTAL ? <Badge tone="green">완등</Badge> : <Badge>진행중</Badge>) },
                ]}
              />
            )}
            <Pager page={page} pages={pages} onPage={setPage} total={view === 'records' ? list.length : userList.length} />
          </Panel>
        </>
      )}

      {sel && (
        <Modal
          wide
          title="인증 상세"
          onClose={() => setSel(null)}
          footer={
            <>
              {rejected[sel.no] ? (
                <Badge tone="accent">반려됨 · {rejected[sel.no]}</Badge>
              ) : (
                <Btn kind="danger" onClick={() => setRejecting(true)}>
                  인증 반려
                </Btn>
              )}
              <Btn kind="primary" onClick={() => setSel(null)}>
                확인
              </Btn>
            </>
          }
        >
          <div className="grid gap-5 md:grid-cols-[300px_1fr]">
            <div className="aspect-[3/4] overflow-hidden rounded-xl">
              <MountainArt m={byId(sel.mountainId)} className="size-full" />
            </div>
            <dl className="space-y-3 text-[15px]">
              {[
                ['회차', '2026년 김천 100산 완등 인증'],
                ['사용자명', `${userById(sel.userId).masked} (${userById(sel.userId).birth})`],
                ['산 이름', `${byId(sel.mountainId).title} · ${byId(sel.mountainId).summit} ${byId(sel.mountainId).height}m`],
                ['인증 일시', `${fmtDate(sel.at)} ${sel.at.slice(11)}`],
                ['촬영 위치', byId(sel.mountainId).lat ? `${byId(sel.mountainId).lat!.toFixed(5)}, ${byId(sel.mountainId).lng!.toFixed(5)}` : '-'],
                ['정상석 거리', `${sel.distM}m (반경 50m 이내)`],
                ['위치 검증', '통과 · 앱 카메라 촬영 원본'],
                ['누적 인증', `${userById(sel.userId).count}/${TOTAL}산`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 border-b border-line pb-3">
                  <dt className="w-24 shrink-0 font-semibold text-sub">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
      {sel && rejecting && (
        <Modal
          title="인증 반려"
          onClose={() => setRejecting(false)}
          footer={
            <>
              <Btn onClick={() => setRejecting(false)}>취소</Btn>
              <Btn
                kind="danger"
                onClick={() => {
                  reject(sel.no, why)
                  setRejecting(false)
                  flash(`반려했습니다 · ${userById(sel.userId).masked}님에게 알림을 보냈습니다`)
                }}
              >
                반려하고 알림 보내기
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="반려 사유">
              <select value={why} onChange={(e) => setWhy(e.target.value)} className={`${inputCls} w-full`}>
                {['정상석이 사진에 보이지 않음', '다른 사람이 찍은 사진으로 의심됨', '위치 정보 조작 의심', '사진이 흐리거나 어두움', '기타'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="사용자에게 보낼 안내" hint="앱 알림으로 전달되며, 사용자는 해당 산을 다시 인증할 수 있습니다.">
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="예: 정상석이 함께 나오도록 다시 촬영해 주세요." className={`${inputCls} h-auto w-full py-2`} />
            </Field>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── 인증지점별 통계 (SFR-014) ────────────────────────────
export function Stats() {
  const { roundId, rounds, flash } = useAdmin()
  const rd = rounds.find((r) => r.id === roundId)!
  const counts = peakCounts(roundId)
  const prevId = { r2026: 'r2025', r2025: 'r2024', r2024: 'r2023' }[roundId]
  const prev = prevId ? peakCounts(prevId) : null
  const sorted = [...mountains].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
  const years = ['r2023', 'r2024', 'r2025', 'r2026'].map((id) => ({ label: `${id.slice(1)}년`, v: roundStats[id].certs }))
  const byZone = zones.map((z) => ({ label: z.name, v: mountains.filter((m) => m.zone === z.id).reduce((s, m) => s + (counts[m.id] ?? 0), 0) }))
  const [page, setPage] = useState(1)

  return (
    <>
      <PageHead

        title="인증지점별 통계"
        desc={`${rd.name} 기준 산별 인증 현황과 연도별 추이입니다.`}
        actions={
          <DownloadBtn menu="인증지점별 통계" rows={TOTAL} personal={false} />
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="연도별 인증 건수">
          <div className="p-5">
            <VBars data={years} unit="건" />
            <p className="mt-3 text-[14px] text-sub">2023~2025년은 밴드 인증 집계, 2026년은 앱 인증 기록입니다.</p>
          </div>
        </Panel>
        <Panel title="산줄기 권역별 인증 건수">
          <div className="p-5">
            <HBars data={byZone} />
          </div>
        </Panel>
        <Panel title="인증 많은 산 15">
          <div className="p-5">
            <HBars data={sorted.slice(0, 15).map((m) => ({ label: m.title, v: counts[m.id] ?? 0 }))} />
          </div>
        </Panel>
        <Panel title="인증 적은 산 15 (등산로·안내 점검 대상)">
          <div className="p-5">
            <HBars data={sorted.slice(-15).reverse().map((m) => ({ label: m.title, v: counts[m.id] ?? 0 }))} max={counts[sorted[0].id]} />
          </div>
        </Panel>
      </div>
      <Panel className="mt-4" title={`산별 인증 현황 (${TOTAL}곳)`}>
        <Table
          rows={sorted.slice((page - 1) * 20, page * 20)}
          rowKey={(m) => m.id}
          offset={(page - 1) * 20}
          cols={[
            { h: '산 이름', cell: (m) => <span className="font-bold">{m.title}</span> },
            { h: '산줄기', cell: (m) => zoneById(m.zone).name },
            { h: '높이', align: 'right', cell: (m) => `${m.height.toLocaleString()}m` },
            { h: '인증 건수', align: 'right', cell: (m) => <span className="font-bold">{(counts[m.id] ?? 0).toLocaleString()}건</span> },
            {
              h: '전년 대비',
              align: 'right',
              cell: (m) => {
                if (!prev) return '-'
                const a = counts[m.id] ?? 0
                const b = prev[m.id] ?? 0
                if (!b) return '-'
                const d = Math.round(((a - b) / b) * 100)
                return <span className={d >= 0 ? 'font-semibold text-forest' : 'font-semibold text-[#B5402A]'}>{d >= 0 ? `▲ ${d}%` : `▼ ${-d}%`}</span>
              },
            },
          ]}
        />
        <Pager page={page} pages={Math.ceil(TOTAL / 20)} onPage={setPage} total={TOTAL} />
      </Panel>
    </>
  )
}
