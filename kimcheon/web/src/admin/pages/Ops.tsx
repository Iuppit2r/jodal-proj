import { useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Clock, Search, Send } from 'lucide-react'
import { byId, fmtDate, mountains, TOTAL } from '../../data'
import { records, users, type AdminUser } from '../data'
import { useAdmin } from '../store'
import { Badge, Btn, DownloadBtn, Field, inputCls, Modal, PageHead, Pager, Panel, Table, Toggle } from '../ui'
import { MiniStat } from './Rounds'

// ── 회원 관리 ────────────────────────────────────────────
const statusOf = (u: AdminUser, i: number) => (i % 97 === 13 ? '탈퇴' : i % 61 === 7 ? '휴면' : '정상')

export function Members() {
  const flash = useAdmin((s) => s.flash)
  const [q, setQ] = useState('')
  const [via, setVia] = useState('')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<AdminUser | null>(null)
  const list = useMemo(() => users.map((u, i) => ({ u, st: statusOf(u, i) })).filter(({ u }) => (!q || u.name.includes(q)) && (!via || u.via === via)), [q, via])
  const PER = 15
  const recs = sel ? records.filter((r) => r.userId === sel.id).slice(0, 6) : []
  return (
    <>
      <PageHead title="회원 관리" desc="본인인증으로 가입한 회원과 인증 이력을 확인합니다. 개인정보는 가려서 표시합니다." actions={<DownloadBtn menu="회원 관리" rows={list.length} />} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat k="전체 회원" v={`${users.length.toLocaleString()}명`} />
        <MiniStat k="휴대폰 인증" v={`${users.filter((u) => u.via === '휴대폰').length.toLocaleString()}명`} />
        <MiniStat k="아이핀 인증" v={`${users.filter((u) => u.via === '아이핀').length.toLocaleString()}명`} />
        <MiniStat k="이번 달 가입" v="148명" />
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
              placeholder="회원명 검색"
              className={`${inputCls} w-48 pl-9`}
            />
          </label>
          <select value={via} onChange={(e) => setVia(e.target.value)} className={`${inputCls} w-40`}>
            <option value="">본인인증 전체</option>
            <option>휴대폰</option>
            <option>아이핀</option>
          </select>
        </div>
        <Table
          rows={list.slice((page - 1) * PER, page * PER)}
          rowKey={({ u }) => u.id}
          offset={(page - 1) * PER}
          onRow={({ u }) => setSel(u)}
          cols={[
            { h: '회원명', cell: ({ u }) => <span className="font-bold">{u.masked}</span> },
            { h: '생년월일', cell: ({ u }) => u.birth },
            { h: '연락처', cell: ({ u }) => u.phone },
            { h: '거주지', cell: ({ u }) => u.area },
            { h: '본인인증', align: 'center', cell: ({ u }) => <Badge>{u.via}</Badge> },
            { h: '가입일', cell: ({ u }) => u.joined.replaceAll('-', '.') },
            { h: '인증', align: 'right', cell: ({ u }) => `${u.count}/${TOTAL}` },
            { h: '상태', align: 'center', cell: ({ st }) => <Badge tone={st === '정상' ? 'green' : st === '휴면' ? 'gold' : 'gray'}>{st}</Badge> },
          ]}
        />
        <Pager page={page} pages={Math.ceil(list.length / PER)} onPage={setPage} total={list.length} />
      </Panel>
      {sel && (
        <Modal
          wide
          title={`회원 상세 · ${sel.masked}`}
          onClose={() => setSel(null)}
          footer={
            <>
              <Btn
                kind="danger"
                onClick={() => {
                  setSel(null)
                  flash('탈퇴 처리했습니다 · 인증 기록은 30일 후 파기됩니다')
                }}
              >
                탈퇴 처리
              </Btn>
              <Btn kind="primary" onClick={() => setSel(null)}>
                닫기
              </Btn>
            </>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <dl className="space-y-2.5 text-[15px]">
              {[
                ['회원 번호', sel.id],
                ['생년월일', sel.birth],
                ['연락처', sel.phone],
                ['거주지', sel.area],
                ['본인인증', `${sel.via} · ${sel.joined.replaceAll('-', '.')}`],
                ['인증 진행', `${sel.count}/${TOTAL}산`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 border-b border-line pb-2.5">
                  <dt className="w-24 shrink-0 font-semibold text-sub">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-2 text-[15px] font-bold">최근 인증 이력</p>
              <ol className="space-y-2">
                {recs.map((r) => (
                  <li key={r.no} className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2 text-[14px]">
                    <CheckCircle2 size={16} className="text-forest" />
                    <span className="flex-1 font-semibold">{byId(r.mountainId).title}</span>
                    <span className="text-sub">{fmtDate(r.at)}</span>
                  </li>
                ))}
                {recs.length === 0 && <li className="text-[14px] text-sub">인증 이력이 없습니다.</li>}
              </ol>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── 푸시 알림 발송 ───────────────────────────────────────
type PushLog = { no: number; at: string; target: string; title: string; sent: number; opened: number; status: '발송 완료' | '예약' }
export function PushSend() {
  const flash = useAdmin((s) => s.flash)
  const [target, setTarget] = useState('all')
  const [peak, setPeak] = useState('sudo')
  const [title, setTitle] = useState('[안전] 가을철 산불조심기간 입산 통제 안내')
  const [body, setBody] = useState('11월 1일부터 12월 15일까지 일부 등산로 입산이 통제됩니다. 출발 전 공지사항을 확인해 주세요.')
  const [reserve, setReserve] = useState(false)
  const [when, setWhen] = useState('2026-10-31T09:00')
  const [logs, setLogs] = useState<PushLog[]>([
    { no: 4, at: '2026.10.31 09:00', target: '전체 회원', title: '[안전] 산불조심기간 입산 통제', sent: 0, opened: 0, status: '예약' },
    { no: 3, at: '2026.09.18 10:00', target: '관광 미션 진행자', title: '가을 관광 미션 이벤트 시작', sent: 412, opened: 187, status: '발송 완료' },
    { no: 2, at: '2026.09.10 08:30', target: '수도산 미인증자', title: '수도산 등산로 정비공사 우회 안내', sent: 1104, opened: 402, status: '발송 완료' },
    { no: 1, at: '2026.03.01 09:00', target: '전체 회원', title: '2026년 완등 인증이 시작됐어요', sent: 902, opened: 611, status: '발송 완료' },
  ])
  const targets: Record<string, [string, number]> = {
    all: ['전체 회원', users.length],
    active: ['이번 달 인증 회원', 486],
    almost: ['완등 임박 회원 (90산 이상)', users.filter((u) => u.count >= 90 && u.count < TOTAL).length],
    peak: [`${byId(peak).title} 미인증 회원`, users.length - Math.round(users.length * 0.18)],
  }
  const [tName, tCount] = targets[target]
  return (
    <>
      <PageHead title="푸시 알림 발송" desc="공지·안전 알림을 대상별로 보내거나 예약합니다. 정상 도착 알림은 앱이 자동으로 보냅니다." />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Panel title="새 알림">
          <div className="space-y-4 p-5">
            <Field label="받는 사람">
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(targets).map(([k, [n, c]]) => (
                  <button key={k} onClick={() => setTarget(k)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[14px] ${target === k ? 'border-brand bg-brand-50 font-bold text-brand' : 'border-line'}`}>
                    <span>{n}</span>
                    <span>{c.toLocaleString()}명</span>
                  </button>
                ))}
              </div>
            </Field>
            {target === 'peak' && (
              <Field label="산 선택">
                <select value={peak} onChange={(e) => setPeak(e.target.value)} className={`${inputCls} w-full`}>
                  {mountains.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="제목">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} w-full`} />
            </Field>
            <Field label="내용" hint={`${body.length}/100자`}>
              <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 100))} rows={3} className={`${inputCls} h-auto w-full py-2 leading-relaxed`} />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-[14px] font-bold">
                <Toggle on={reserve} onChange={() => setReserve(!reserve)} /> 예약 발송
              </label>
              {reserve && <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />}
              <span className="flex-1" />
              <Btn
                kind="primary"
                disabled={!title}
                onClick={() => {
                  setLogs([{ no: logs.length + 1, at: reserve ? when.replace('T', ' ').replaceAll('-', '.') : '2026.10.06 15:30', target: tName, title, sent: reserve ? 0 : tCount, opened: 0, status: reserve ? '예약' : '발송 완료' }, ...logs])
                  flash(reserve ? '예약했습니다' : `${tCount.toLocaleString()}명에게 보냈습니다`)
                }}
              >
                <Send size={16} /> {reserve ? '예약하기' : `${tCount.toLocaleString()}명에게 보내기`}
              </Btn>
            </div>
            <p className="text-[13px] text-sub">밤 9시 ~ 아침 8시에는 광고성 알림을 보낼 수 없습니다. 안전 알림은 예외입니다.</p>
          </div>
        </Panel>
        <Panel title="미리보기">
          <div className="p-5">
            <div className="rounded-[28px] bg-[#2A3A33] p-4">
              <p className="pt-2 text-center text-[34px] font-light text-white">9:41</p>
              <div className="mt-6 rounded-2xl bg-white/90 p-3 backdrop-blur">
                <div className="flex items-start gap-2.5">
                  <img src="./brand/symbol_mark.png" alt="" className="size-9 rounded-lg bg-white object-contain p-1" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-sub">김천 100산 · 지금</p>
                    <p className="text-[14px] leading-snug font-bold">{title || '제목'}</p>
                    <p className="text-[13px] leading-snug text-sub">{body || '내용'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <Panel className="mt-4" title="발송 이력">
        <Table
          rows={logs}
          rowKey={(l) => String(l.no)}
          startNo={logs.length}
          cols={[
            { h: '발송 일시', cell: (l) => l.at },
            { h: '대상', cell: (l) => l.target },
            { h: '제목', cell: (l) => <span className="font-semibold">{l.title}</span> },
            { h: '발송', align: 'right', cell: (l) => (l.sent ? `${l.sent.toLocaleString()}명` : '-') },
            { h: '열람률', align: 'right', cell: (l) => (l.sent ? `${Math.round((l.opened / l.sent) * 100)}%` : '-') },
            { h: '상태', align: 'center', cell: (l) => <Badge tone={l.status === '예약' ? 'gold' : 'green'}>{l.status}</Badge> },
          ]}
        />
      </Panel>
    </>
  )
}

// ── 지도 서비스 상태 (다중화) ──────────────────────────────
export function MapStatus() {
  const flash = useAdmin((s) => s.flash)
  const [auto, setAuto] = useState(true)
  const [primary, setPrimary] = useState('카카오맵')
  const services = [
    { name: '카카오맵', role: '기본', ok: true, ms: 182, uptime: '99.98%' },
    { name: '네이버 지도', role: '예비 1', ok: true, ms: 205, uptime: '99.97%' },
    { name: '오픈스트리트맵', role: '예비 2', ok: true, ms: 341, uptime: '99.90%' },
    { name: '국토정보플랫폼', role: '등산로 도형', ok: true, ms: 420, uptime: '99.80%' },
  ]
  const incidents = [
    { at: '2026.08.14 13:02 ~ 13:19', svc: '카카오맵', what: '지도 타일 응답 지연', act: '네이버 지도로 자동 전환 (17분)' },
    { at: '2026.05.03 06:40 ~ 06:52', svc: '네이버 지도', what: '인증키 호출 한도 초과', act: '한도 상향 요청 후 복구' },
  ]
  return (
    <>
      <PageHead title="지도 서비스 상태" desc="민간 지도 서비스 장애 시 다른 지도로 자동 전환되도록 다중화되어 있습니다. 5분마다 응답을 확인합니다." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {services.map((s) => (
          <div key={s.name} className={`rounded-2xl border bg-white p-5 ${primary === s.name ? 'border-brand ring-2 ring-brand/15' : 'border-line'}`}>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-[16px] font-extrabold">{s.name}</p>
              <Badge tone={primary === s.name ? 'brand' : 'gray'}>{primary === s.name ? '사용 중' : s.role}</Badge>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[15px] font-bold text-forest">
              <CheckCircle2 size={17} /> 정상
            </p>
            <p className="mt-1 text-[14px] text-sub">
              응답 {s.ms}ms · 가용률 {s.uptime}
            </p>
            {primary !== s.name && s.role !== '등산로 도형' && (
              <Btn
                kind="ghost"
                onClick={() => {
                  setPrimary(s.name)
                  flash(`${s.name}(으)로 전환했습니다`)
                }}
              >
                수동 전환
              </Btn>
            )}
          </div>
        ))}
      </div>
      <Panel className="mt-4" title="전환 설정">
        <div className="flex flex-wrap items-center gap-6 p-5 text-[15px]">
          <label className="flex items-center gap-2 font-bold">
            <Toggle on={auto} onChange={() => setAuto(!auto)} /> 장애 시 자동 전환
          </label>
          <span className="flex items-center gap-1.5 text-sub">
            <Clock size={16} /> 3회 연속 응답 실패(15초) 시 전환
          </span>
          <span className="flex items-center gap-1.5 text-sub">
            <CircleAlert size={16} /> 전환 시 담당자 문자 알림
          </span>
        </div>
      </Panel>
      <Panel className="mt-4" title="장애 · 전환 이력">
        <Table
          rows={incidents}
          rowKey={(r) => r.at}
          startNo={incidents.length}
          cols={[
            { h: '기간', cell: (r) => r.at },
            { h: '서비스', cell: (r) => r.svc },
            { h: '내용', cell: (r) => r.what },
            { h: '조치', cell: (r) => r.act },
          ]}
        />
      </Panel>
    </>
  )
}
