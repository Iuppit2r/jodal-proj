import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { MapContainer, CircleMarker, TileLayer, Tooltip } from 'react-leaflet'
import { mountains, TOTAL, zoneById } from '../../data'
import { roundStats, roundStatus, type Round } from '../data'
import { useAdmin, type CoursePoint } from '../store'
import { Badge, Btn, Field, inputCls, Modal, PageHead, Panel, Table, Toggle } from '../ui'

// ── 인증 회차 관리 (SFR-009) ─────────────────────────────
export function Rounds() {
  const { rounds, saveRound, deleteRound, flash } = useAdmin()
  const [edit, setEdit] = useState<Round | null>(null)

  return (
    <>
      <PageHead

        title="인증 회차 관리"
        desc="회차명과 인증기간을 등록합니다. 인증기간이 아닌 회차는 사용자 앱에서 자동으로 비활성화됩니다."
        actions={
          <Btn kind="primary" onClick={() => setEdit({ id: `r${Date.now()}`, name: '2027년 김천 100산 완등 인증', start: '2027-03-01', end: '2027-12-31', peaks: TOTAL, note: '' })}>
            <Plus size={16} /> 회차 등록
          </Btn>
        }
      />
      <Panel>
        <Table
          rows={rounds}
          rowKey={(r) => r.id}
          cols={[
            { h: '회차명', cell: (r) => <span className="font-bold">{r.name}</span> },
            { h: '인증기간', cell: (r) => `${r.start.replaceAll('-', '.')} ~ ${r.end.replaceAll('-', '.')}` },
            { h: '인증지점', align: 'right', cell: (r) => `${r.peaks}곳` },
            { h: '참여자', align: 'right', cell: (r) => (roundStats[r.id] ? `${roundStats[r.id].participants.toLocaleString()}명` : '-') },
            { h: '완등자', align: 'right', cell: (r) => (roundStats[r.id] ? `${roundStats[r.id].completers.toLocaleString()}명` : '-') },
            {
              h: '상태',
              align: 'center',
              cell: (r) => {
                const s = roundStatus(r)
                return <Badge tone={s === '진행중' ? 'green' : s === '예정' ? 'brand' : 'gray'}>{s === '진행중' ? '진행중 · 앱 활성' : s === '예정' ? '예정 · 앱 비활성' : '종료 · 앱 비활성'}</Badge>
              },
            },
            { h: '비고', cell: (r) => <span className="text-sub">{r.note}</span> },
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
                      deleteRound(r.id)
                      flash('회차를 삭제했습니다')
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
          title={rounds.some((r) => r.id === edit.id) ? '회차 수정' : '회차 등록'}
          onClose={() => setEdit(null)}
          footer={
            <>
              <Btn onClick={() => setEdit(null)}>취소</Btn>
              <Btn
                kind="primary"
                onClick={() => {
                  saveRound(edit)
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
            <Field label="회차명">
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={`${inputCls} w-full`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="인증 시작일">
                <input type="date" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} className={`${inputCls} w-full`} />
              </Field>
              <Field label="인증 종료일">
                <input type="date" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} className={`${inputCls} w-full`} />
              </Field>
            </div>
            <Field label="비고">
              <input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} className={`${inputCls} w-full`} />
            </Field>
            <p className="rounded-lg bg-bg p-3 text-[14px] text-sub">인증코스는 등록 후 「인증코스 관리」에서 이전 회차 코스를 복사하거나 새로 구성할 수 있습니다.</p>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── 인증코스 관리 (SFR-010) ──────────────────────────────
export function Courses() {
  const { course, movePoint, savePoint, flash, roundId, rounds } = useAdmin()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<CoursePoint | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const list = useMemo(() => course.filter((p) => !q || p.name.includes(q)), [course, q])
  const noCoord = course.filter((p) => p.lat == null).length
  const rd = rounds.find((r) => r.id === roundId)!

  return (
    <>
      <PageHead

        title="인증코스 관리"
        desc={`${rd.name} 코스의 인증지점(봉우리)을 등록하고 순서를 정렬합니다. 좌표가 없는 지점은 사용자 앱에서 인증할 수 없습니다.`}
        actions={
          <>
            <Btn onClick={() => flash('2025년 회차 코스를 복사했습니다')}>이전 회차 코스 복사</Btn>
            <Btn kind="primary" onClick={() => flash('인증지점 등록 화면 (시연)')}>
              <Plus size={16} /> 인증지점 등록
            </Btn>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat k="인증지점" v={`${course.length}곳`} />
        <MiniStat k="사용 중" v={`${course.filter((p) => p.enabled).length}곳`} />
        <MiniStat k="좌표 미등록" v={`${noCoord}곳`} warn={noCoord > 0} />
        <MiniStat k="기본 인증 반경" v="50m" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel
          title="인증지점 목록"
          action={
            <label className="flex items-center gap-2">
              <Search size={16} className="text-mute" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="봉우리 이름" className={`${inputCls} w-44`} />
            </label>
          }
        >
          <div className="max-h-[640px] overflow-y-auto">
            <Table
              rows={list}
              rowKey={(p) => p.id}
              onRow={(p) => setFocus(p.id)}
              cols={[
                { h: '인증지점명', cell: (p) => <span className="font-bold">{p.name}</span> },
                { h: '높이', align: 'right', cell: (p) => `${p.height.toLocaleString()}m` },
                { h: '위치 (위도, 경도)', cell: (p) => (p.lat != null ? <span className="tabular-nums">{`${p.lat.toFixed(5)}, ${p.lng!.toFixed(5)}`}</span> : <Badge tone="accent">좌표 미등록</Badge>) },
                { h: '반경', align: 'right', cell: (p) => `${p.radius}m` },
                {
                  h: '사용',
                  align: 'center',
                  cell: (p) => (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Toggle on={p.enabled} onChange={() => savePoint({ ...p, enabled: !p.enabled })} />
                    </span>
                  ),
                },
                {
                  h: '순서 · 수정',
                  align: 'center',
                  cell: (p) => (
                    <div className="flex justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => movePoint(p.id, -1)} className="grid size-8 place-items-center rounded-md hover:bg-alt" aria-label="위로">
                        <ArrowUp size={16} />
                      </button>
                      <button onClick={() => movePoint(p.id, 1)} className="grid size-8 place-items-center rounded-md hover:bg-alt" aria-label="아래로">
                        <ArrowDown size={16} />
                      </button>
                      <button onClick={() => setEdit(p)} className="grid size-8 place-items-center rounded-md hover:bg-alt" aria-label="수정">
                        <Pencil size={15} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Panel>
        <Panel title="인증지점 지도">
          <div className="p-3">
            <MapContainer center={[36.03, 128.05]} zoom={10} className="isolate h-[600px] rounded-xl" scrollWheelZoom attributionControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {course
                .filter((p) => p.lat != null)
                .map((p) => {
                  const m = mountains.find((x) => x.id === p.id)!
                  return (
                    <CircleMarker
                      key={p.id}
                      center={[p.lat!, p.lng!]}
                      radius={focus === p.id ? 11 : 6}
                      pathOptions={{ color: focus === p.id ? '#F26B3A' : '#fff', weight: 2, fillColor: p.enabled ? zoneById(m.zone).color : '#B9BDB7', fillOpacity: 0.9 }}
                      eventHandlers={{ click: () => setFocus(p.id) }}
                    >
                      <Tooltip permanent={focus === p.id}>{`${p.name} ${p.height}m`}</Tooltip>
                    </CircleMarker>
                  )
                })}
            </MapContainer>
            <p className="mt-2 text-[13px] text-sub">© 오픈스트리트맵 · 지도 장애 시 다른 지도 서비스로 자동 전환(다중화)</p>
          </div>
        </Panel>
      </div>

      {edit && (
        <Modal
          title="인증지점 수정"
          onClose={() => setEdit(null)}
          footer={
            <>
              <Btn onClick={() => setEdit(null)}>취소</Btn>
              <Btn
                kind="primary"
                onClick={() => {
                  savePoint(edit)
                  setEdit(null)
                  flash('인증지점을 저장했습니다')
                }}
              >
                저장
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="인증지점명 (봉우리 이름)">
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={`${inputCls} w-full`} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="위도 (y)">
                <input value={edit.lat ?? ''} onChange={(e) => setEdit({ ...edit, lat: e.target.value ? Number(e.target.value) : null })} className={`${inputCls} w-full`} />
              </Field>
              <Field label="경도 (x)">
                <input value={edit.lng ?? ''} onChange={(e) => setEdit({ ...edit, lng: e.target.value ? Number(e.target.value) : null })} className={`${inputCls} w-full`} />
              </Field>
              <Field label="높이 (m)">
                <input value={edit.height} onChange={(e) => setEdit({ ...edit, height: Number(e.target.value) || 0 })} className={`${inputCls} w-full`} />
              </Field>
            </div>
            <Field label="인증 반경 (m)" hint="정상석 기준 이 거리 안에서만 촬영 버튼이 활성화됩니다.">
              <input value={edit.radius} onChange={(e) => setEdit({ ...edit, radius: Number(e.target.value) || 0 })} className={`${inputCls} w-full`} />
            </Field>
          </div>
        </Modal>
      )}
    </>
  )
}

export function MiniStat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3">
      <p className="text-[14px] font-semibold text-sub">{k}</p>
      <p className={`mt-0.5 text-[20px] font-black ${warn ? 'text-accent' : ''}`}>{v}</p>
    </div>
  )
}
