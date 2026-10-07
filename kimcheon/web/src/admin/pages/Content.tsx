import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, RefreshCw, Search } from 'lucide-react'
import { distKm, mountains, places, placeTypeLabel, zoneById, type Mountain } from '../../data'
import { coursesOf, parkingOf, transportOf } from '../../data/extra'
import { MountainArt } from '../../components/art'
import { useAdmin } from '../store'
import { Badge, Btn, Field, inputCls, Modal, PageHead, Pager, Panel, Table, Toggle } from '../ui'
import { MiniStat } from './Rounds'

// ── 산 정보 관리 (소개 · 등산코스 · 교통 · 주차 · 사진) ───────────
const filled = (m: Mountain) => ({
  intro: true,
  course: ['hwangak', 'sudo', 'samdo', 'daedeok', 'goseong', 'dalbong'].includes(m.id) || m.no % 3 !== 0,
  traffic: m.lat != null,
  parking: m.no % 7 !== 0,
  photo: !!m.photo || m.no % 5 !== 0,
})

export function MountainInfo() {
  const flash = useAdmin((s) => s.flash)
  const [q, setQ] = useState('')
  const [only, setOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [edit, setEdit] = useState<Mountain | null>(null)
  const list = useMemo(
    () =>
      mountains.filter((m) => {
        const f = filled(m)
        return (!q || m.title.includes(q)) && (!only || !Object.values(f).every(Boolean))
      }),
    [q, only],
  )
  const done = mountains.filter((m) => Object.values(filled(m)).every(Boolean)).length
  const PER = 15
  const Dot = ({ on }: { on: boolean }) => (on ? <Badge tone="green">등록</Badge> : <Badge tone="accent">미등록</Badge>)

  return (
    <>
      <PageHead title="산 정보 관리" desc="사용자 앱 산 상세에 보이는 소개, 등산코스, 교통·주차 정보와 대표 사진을 관리합니다." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat k="전체 산" v={`${mountains.length}곳`} />
        <MiniStat k="정보 완비" v={`${done}곳`} />
        <MiniStat k="보완 필요" v={`${mountains.length - done}곳`} warn />
        <MiniStat k="실사진 등록" v={`${mountains.filter((m) => filled(m).photo).length}곳`} />
      </div>
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <label className="relative">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="산 이름 검색"
              className={`${inputCls} w-48 pl-9`}
            />
          </label>
          <label className="flex items-center gap-2 text-[14px] font-semibold">
            <Toggle
              on={only}
              onChange={() => {
                setOnly(!only)
                setPage(1)
              }}
            />
            보완 필요만 보기
          </label>
        </div>
        <Table
          rows={list.slice((page - 1) * PER, page * PER)}
          rowKey={(m) => m.id}
          offset={(page - 1) * PER}
          onRow={setEdit}
          cols={[
            { h: '산 이름', cell: (m) => <span className="font-bold">{m.title}</span> },
            { h: '산줄기', cell: (m) => zoneById(m.zone).name },
            { h: '소개', align: 'center', cell: (m) => <Dot on={filled(m).intro} /> },
            { h: '등산코스', align: 'center', cell: (m) => <Dot on={filled(m).course} /> },
            { h: '교통', align: 'center', cell: (m) => <Dot on={filled(m).traffic} /> },
            { h: '주차', align: 'center', cell: (m) => <Dot on={filled(m).parking} /> },
            { h: '사진', align: 'center', cell: (m) => <Dot on={filled(m).photo} /> },
            { h: '수정일', cell: (m) => `2026.0${(m.no % 9) + 1}.${String((m.no * 7) % 28 + 1).padStart(2, '0')}` },
          ]}
        />
        <Pager page={page} pages={Math.ceil(list.length / PER)} onPage={setPage} total={list.length} />
      </Panel>

      {edit && (
        <Modal
          wide
          title={`${edit.title} 정보 수정`}
          onClose={() => setEdit(null)}
          footer={
            <>
              <Btn onClick={() => setEdit(null)}>취소</Btn>
              <Btn
                kind="primary"
                onClick={() => {
                  setEdit(null)
                  flash('산 정보를 저장했습니다 · 앱에 바로 반영됩니다')
                }}
              >
                저장
              </Btn>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="h-28 w-40 shrink-0 overflow-hidden rounded-xl">
                <MountainArt m={edit} className="size-full" />
              </div>
              <div className="flex flex-col justify-between">
                <p className="text-[14px] text-sub">대표 사진 · 공공누리 표시 의무 사진은 출처를 함께 입력하세요.</p>
                <Btn>
                  <ImagePlus size={16} /> 사진 교체
                </Btn>
              </div>
            </div>
            <Field label="산 소개">
              <textarea rows={3} defaultValue={`${edit.title}은(는) ${edit.regionLabel}에 있는 해발 ${edit.height}m의 봉우리입니다.`} className={`${inputCls} h-auto w-full py-2 leading-relaxed`} />
            </Field>
            <div>
              <div className="mb-1.5 flex items-center">
                <span className="flex-1 text-[14px] font-bold">등산코스</span>
                <Btn kind="ghost">
                  <Plus size={15} /> 코스 추가
                </Btn>
              </div>
              <div className="space-y-2">
                {coursesOf(edit).map((c) => (
                  <div key={c.name} className="grid grid-cols-[1fr_1.4fr_80px_80px_90px] gap-2">
                    <input defaultValue={c.name} className={inputCls} />
                    <input defaultValue={c.start} className={inputCls} />
                    <input defaultValue={`${c.km}km`} className={inputCls} />
                    <input defaultValue={`${c.min}분`} className={inputCls} />
                    <select defaultValue={c.level} className={inputCls}>
                      <option>쉬움</option>
                      <option>보통</option>
                      <option>어려움</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="대중교통">
                <input defaultValue={transportOf(edit).bus} className={`${inputCls} w-full`} />
              </Field>
              <Field label="주차">
                <input defaultValue={parkingOf(edit)} className={`${inputCls} w-full`} />
              </Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── 관광정보 연계 관리 (문화관광 누리집 데이터) ─────────────────
export function Tourism() {
  const flash = useAdmin((s) => s.flash)
  const [syncing, setSyncing] = useState(false)
  const [radius, setRadius] = useState(5)
  const [show, setShow] = useState<Record<string, boolean>>(Object.fromEntries(places.map((p) => [p.id, true])))
  const near = (pid: string) => {
    const p = places.find((x) => x.id === pid)!
    return mountains.filter((m) => m.lat != null && distKm(p.lat, p.lng, m.lat, m.lng!) <= radius).length
  }
  return (
    <>
      <PageHead
        title="관광정보 연계 관리"
        desc="김천 문화관광 누리집의 음식점·숙박·관광지 데이터를 매일 새벽 받아와 앱에 보여줍니다. 산 주변 표시 거리를 설정합니다."
        actions={
          <Btn
            kind="primary"
            onClick={() => {
              setSyncing(true)
              setTimeout(() => {
                setSyncing(false)
                flash('동기화 완료 · 신규 2건, 변경 5건')
              }, 1200)
            }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? '받아오는 중' : '지금 동기화'}
          </Btn>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat k="최근 동기화" v="오늘 03:00" />
        <MiniStat k="연계 관광정보" v={`${places.length}건`} />
        <MiniStat k="이번 달 변경" v="신규 2 · 변경 5" />
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-[14px] font-semibold text-sub">산 주변 표시 거리</p>
          <div className="mt-1 flex items-center gap-2">
            <input type="range" min={1} max={15} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-[#1F4434]" />
            <span className="w-14 text-right text-[18px] font-black">{radius}km</span>
          </div>
        </div>
      </div>
      <Panel title="연계 데이터">
        <Table
          rows={places}
          rowKey={(p) => p.id}
          cols={[
            { h: '구분', align: 'center', cell: (p) => <Badge>{placeTypeLabel[p.type]}</Badge> },
            { h: '이름', cell: (p) => <span className="font-bold">{p.name}</span> },
            { h: '주소', cell: (p) => p.area },
            { h: '전화번호', cell: (p) => p.phone },
            { h: `주변 산 (${radius}km)`, align: 'right', cell: (p) => `${near(p.id)}곳` },
            { h: '갱신', cell: (p) => (p.name.length % 3 === 0 ? <Badge tone="gold">변경</Badge> : '2026.10.06') },
            {
              h: '앱 노출',
              align: 'center',
              cell: (p) => <Toggle on={show[p.id]} onChange={() => setShow({ ...show, [p.id]: !show[p.id] })} />,
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ── 메뉴 · 콘텐츠 관리 ──────────────────────────────────
type MenuItem = { id: string; name: string; depth: number; type: string; on: boolean; owner: string; updated: string }
const INIT_MENUS: MenuItem[] = [
  { id: 'home', name: '홈', depth: 1, type: '앱 화면', on: true, owner: '산림녹지과', updated: '2026.09.30' },
  { id: 'peaks', name: '김천 100산', depth: 1, type: '앱 화면', on: true, owner: '산림녹지과', updated: '2026.09.12' },
  { id: 'certify', name: '정상 인증', depth: 1, type: '앱 화면', on: true, owner: '산림녹지과', updated: '2026.08.20' },
  { id: 'passport', name: '산행여권', depth: 1, type: '앱 화면', on: true, owner: '산림녹지과', updated: '2026.08.20' },
  { id: 'mission', name: '관광미션', depth: 1, type: '앱 화면', on: true, owner: '문화관광과', updated: '2026.09.18' },
  { id: 'my', name: '마이', depth: 1, type: '앱 화면', on: true, owner: '산림녹지과', updated: '2026.09.01' },
  { id: 'notice', name: '공지사항', depth: 2, type: '게시판', on: true, owner: '산림녹지과', updated: '2026.09.25' },
  { id: 'guest', name: '방명록', depth: 2, type: '게시판', on: true, owner: '산림녹지과', updated: '2026.09.14' },
  { id: 'faq', name: '이용안내', depth: 2, type: '콘텐츠', on: true, owner: '산림녹지과', updated: '2026.07.10' },
  { id: 'terms', name: '약관 및 정책', depth: 2, type: '콘텐츠', on: true, owner: '정보통신과', updated: '2026.03.01' },
  { id: 'event', name: '이벤트', depth: 2, type: '콘텐츠', on: false, owner: '문화관광과', updated: '2026.06.02' },
]

export function Menus() {
  const flash = useAdmin((s) => s.flash)
  const [list, setList] = useState(INIT_MENUS)
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= list.length) return
    const c = [...list]
    ;[c[i], c[j]] = [c[j], c[i]]
    setList(c)
  }
  return (
    <>
      <PageHead
        title="메뉴 · 콘텐츠 관리"
        desc="앱 메뉴의 노출·순서와 담당 부서를 관리하고, 이용안내·약관 같은 콘텐츠 페이지를 편집합니다. 수정 이력은 자동 보관되어 복원할 수 있습니다."
        actions={
          <Btn kind="primary" onClick={() => flash('메뉴 추가 화면 (시연)')}>
            <Plus size={16} /> 메뉴 추가
          </Btn>
        }
      />
      <Panel>
        <Table
          rows={list}
          rowKey={(m) => m.id}
          cols={[
            { h: '메뉴명', cell: (m) => <span className={`font-bold ${m.depth === 2 ? 'pl-5 text-sub' : ''}`}>{m.depth === 2 ? `└ ${m.name}` : m.name}</span> },
            { h: '유형', cell: (m) => <Badge tone={m.type === '앱 화면' ? 'brand' : 'gray'}>{m.type}</Badge> },
            { h: '담당 부서', cell: (m) => m.owner },
            { h: '최근 수정', cell: (m) => m.updated },
            {
              h: '노출',
              align: 'center',
              cell: (m) => (
                <Toggle
                  on={m.on}
                  onChange={() => {
                    setList(list.map((x) => (x.id === m.id ? { ...x, on: !x.on } : x)))
                    flash(`${m.name}: ${m.on ? '숨김' : '노출'}`)
                  }}
                />
              ),
            },
            {
              h: '순서 · 편집',
              align: 'center',
              cell: (m, i) => (
                <div className="flex justify-center gap-0.5">
                  <button onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-md hover:bg-alt" aria-label="위로">
                    <ArrowUp size={16} />
                  </button>
                  <button onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-md hover:bg-alt" aria-label="아래로">
                    <ArrowDown size={16} />
                  </button>
                  <button onClick={() => flash(`${m.name} 편집기 (시연)`)} className="grid size-8 place-items-center rounded-md hover:bg-alt" aria-label="편집">
                    <Pencil size={15} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Panel>
      <Panel className="mt-4" title="최근 수정 이력">
        <Table
          rows={[
            { at: '2026.09.30 14:22', who: '김산림', menu: '홈', act: '배너 순서 변경' },
            { at: '2026.09.25 10:05', who: '이녹지', menu: '공지사항', act: '필독 공지 등록' },
            { at: '2026.09.18 16:41', who: '박관광', menu: '관광미션', act: '미션 소개 문구 수정' },
            { at: '2026.07.10 09:30', who: '이녹지', menu: '이용안내', act: '자주 묻는 질문 2건 추가' },
          ]}
          rowKey={(r) => r.at}
          cols={[
            { h: '일시', cell: (r) => r.at },
            { h: '수정자', cell: (r) => r.who },
            { h: '메뉴', cell: (r) => r.menu },
            { h: '내용', cell: (r) => r.act },
            { h: '복원', align: 'center', cell: (r) => <Btn kind="ghost" onClick={() => flash(`${r.menu} 이전 버전으로 복원했습니다`)}>이전 버전 복원</Btn> },
          ]}
        />
      </Panel>
    </>
  )
}

// ── 배너 · 팝업 관리 ─────────────────────────────────────
type Banner = { id: string; kind: '홈 배너' | '팝업'; title: string; start: string; end: string; on: boolean; clicks: number; color: string }
const INIT_BANNERS: Banner[] = [
  { id: 'b1', kind: '팝업', title: '가을철 산불조심기간 입산 통제 안내', start: '2026-11-01', end: '2026-12-15', on: true, clicks: 0, color: '#B5402A' },
  { id: 'b2', kind: '홈 배너', title: '관광 미션 달성하고 김천사랑상품권 받자', start: '2026-10-01', end: '2026-10-31', on: true, clicks: 1842, color: '#F26B3A' },
  { id: 'b3', kind: '홈 배너', title: '김천 포도·자두 축제와 함께하는 산행', start: '2026-08-01', end: '2026-08-31', on: false, clicks: 2210, color: '#8B5E8E' },
  { id: 'b4', kind: '팝업', title: '2026년 완등 인증 시작 안내', start: '2026-03-01', end: '2026-03-31', on: false, clicks: 5120, color: '#1F4434' },
]

export function Banners() {
  const flash = useAdmin((s) => s.flash)
  const [list, setList] = useState(INIT_BANNERS)
  const [preview, setPreview] = useState<Banner | null>(null)
  return (
    <>
      <PageHead
        title="배너 · 팝업 관리"
        desc="앱 홈 배너와 실행 시 팝업의 노출 기간과 순서를 관리합니다. 기간이 지나면 자동으로 내려갑니다."
        actions={
          <Btn kind="primary" onClick={() => flash('배너 등록 화면 (시연)')}>
            <Plus size={16} /> 배너 · 팝업 등록
          </Btn>
        }
      />
      <Panel>
        <Table
          rows={list}
          rowKey={(b) => b.id}
          onRow={setPreview}
          cols={[
            { h: '구분', align: 'center', cell: (b) => <Badge tone={b.kind === '팝업' ? 'gold' : 'brand'}>{b.kind}</Badge> },
            {
              h: '제목',
              cell: (b) => (
                <span className="flex items-center gap-2 font-bold">
                  <i className="size-3 shrink-0 rounded-sm" style={{ background: b.color }} /> {b.title}
                </span>
              ),
            },
            { h: '노출 기간', cell: (b) => `${b.start.replaceAll('-', '.')} ~ ${b.end.replaceAll('-', '.')}` },
            { h: '누름 수', align: 'right', cell: (b) => b.clicks.toLocaleString() },
            {
              h: '노출',
              align: 'center',
              cell: (b) => (
                <span onClick={(e) => e.stopPropagation()}>
                  <Toggle on={b.on} onChange={() => setList(list.map((x) => (x.id === b.id ? { ...x, on: !x.on } : x)))} />
                </span>
              ),
            },
          ]}
        />
      </Panel>
      {preview && (
        <Modal title="미리보기" onClose={() => setPreview(null)}>
          <div className="mx-auto w-[300px] overflow-hidden rounded-[28px] border-[8px] border-ink bg-bg">
            <div className="p-4">
              <div className="rounded-2xl p-5 text-white" style={{ background: preview.color }}>
                <p className="text-[14px] font-bold opacity-85">{preview.kind}</p>
                <p className="mt-1 text-[18px] leading-snug font-extrabold">{preview.title}</p>
                <p className="mt-3 text-[14px] opacity-85">
                  {preview.start.replaceAll('-', '.')} ~ {preview.end.replaceAll('-', '.')}
                </p>
              </div>
              <div className="mt-3 h-24 rounded-2xl bg-white" />
              <div className="mt-3 h-16 rounded-2xl bg-white" />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
