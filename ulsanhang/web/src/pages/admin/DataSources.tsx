import { useRef, useState } from 'react'
import {
  Binary, CircleCheck, CircleX, Database, Download, EyeOff, FileText, FileUp, Globe, History, Layers, Loader, RefreshCw,
  ScanText, Share2, Sparkles, Trash2, Upload, Workflow,
} from 'lucide-react'
import { Card, PageHeader, Stat } from '../../components/ui'
import { Anno } from '../../proposal'
import KnowledgeGraph from '../../components/KnowledgeGraph'

interface Src {
  id: string; site: string; name: string; type: '비정형' | '정형'; docs: number; chunks: number; cycle: string; last: string; status: 'ok' | 'running' | 'error'
}

const SOURCES: Src[] = [
  { id: 's1', site: '대표홈페이지', name: '공사소개', type: '비정형', docs: 412, chunks: 3180, cycle: '매일 03:00', last: '09-30 03:04', status: 'ok' },
  { id: 's2', site: '대표홈페이지', name: '인재채용', type: '비정형', docs: 238, chunks: 1942, cycle: '매일 03:00', last: '09-30 03:06', status: 'ok' },
  { id: 's3', site: '대표홈페이지', name: '항만운영', type: '비정형', docs: 1024, chunks: 9811, cycle: '매일 03:00', last: '09-30 03:21', status: 'ok' },
  { id: 's4', site: 'PortWise', name: '선박운항정보', type: '정형', docs: 0, chunks: 0, cycle: '10분', last: '09-30 14:00', status: 'running' },
  { id: 's5', site: 'PortWise', name: '선석운영지원', type: '정형', docs: 0, chunks: 0, cycle: '10분', last: '09-30 13:50', status: 'error' },
  { id: 's6', site: 'PortWise', name: '항만시설관리', type: '정형', docs: 0, chunks: 0, cycle: '매주 월', last: '09-29 04:00', status: 'ok' },
  { id: 's7', site: '업무매뉴얼', name: '담당자 업로드', type: '비정형', docs: 86, chunks: 2204, cycle: '업로드 시', last: '09-26 16:12', status: 'ok' },
]

const PIPELINE = [
  { name: '수집', n: '1,760건', icon: Download },
  { name: 'OCR·추출', n: '1,758건', icon: ScanText },
  { name: '정제·중복 제거', n: '1,702건', icon: Sparkles },
  { name: '비식별화', n: '312건 마스킹', icon: EyeOff },
  { name: '시맨틱 청킹', n: '17,137 청크', icon: Layers },
  { name: '임베딩·적재', n: '벡터DB · 지식그래프', icon: Binary },
]

const MANUALS = [
  { name: '2026년 울산항 인센티브 지급 지침.hwp', dept: '마케팅팀', by: '박○○', date: '2026-09-23', ver: 'v3', done: true },
  { name: '선박 입출항 신고 업무 매뉴얼.pdf', dept: '항만운영팀', by: '이○○', date: '2026-09-12', ver: 'v2', done: true },
  { name: '항만시설 사용료 FAQ.xlsx', dept: '항만운영팀', by: '최○○', date: '2026-09-30', ver: 'v1', done: false },
]

const status = (s: Src['status']) =>
  s === 'ok' ? <span className="badge badge-green"><CircleCheck size={12} />정상</span>
    : s === 'running' ? <span className="badge badge-blue"><Loader size={12} className="spin" />수집 중</span>
    : <span className="badge badge-red"><CircleX size={12} />실패</span>

const TABS = [
  { key: 'sources', label: '수집 대상', icon: Globe },
  { key: 'manuals', label: '매뉴얼', icon: FileText },
  { key: 'logs', label: '실패 로그', icon: History },
] as const

export default function DataSourcesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('sources')
  const [uploaded, setUploaded] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="page">
      <PageHeader
        title="데이터·지식 관리"
        desc="수집 대상과 동기화 주기, 업무 매뉴얼, 데이터 파이프라인 상태를 관리합니다"
        solves={['흩어진 자료로 검색 효율성 저하', '정보 최신성 유지']}
        actions={<button className="btn btn-primary"><RefreshCw size={15} />전체 동기화</button>}
      />

      <div className="grid cols-4 mb">
        <Stat label="수집 문서" icon={FileText} value="1,760건" foot="대표홈페이지 · 업무매뉴얼" />
        <Stat label="지식 청크" spark={[14.2, 14.6, 15.1, 15.5, 15.9, 16.3, 16.7, 17.1]} icon={Layers} value="17,137개" trend={{ dir: 'up', good: true, text: '지난주 대비 412개 증가' }} />
        <Stat label="정형 데이터 연계" icon={Database} value="3개 API" foot="PortWise 선박·선석·시설" />
        <Stat label="수집 실패" icon={CircleX} value="1건" foot="선석운영지원 13:50 배치" />
      </div>

      <Anno n={1} className="mb">
      <Card title="데이터 파이프라인" icon={Workflow} actions={<span className="muted">최근 실행 09-30 03:00</span>}>
        <ol className="pipeline">
          {PIPELINE.map((p, i) => (
            <li key={p.name} className="pipe-step">
              <div className="row between">
                <span className="icon-tile tile-green"><p.icon size={16} /></span>
                <span className="faint num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <b>{p.name}</b>
              <span>{p.n}</span>
            </li>
          ))}
        </ol>
      </Card>
      </Anno>

      <Anno n={2} className="mb">
        <Card title="지식그래프" icon={Share2} sub="규정·요금·절차·부서 사이의 관계를 구조화해 복합 질문에 답합니다"
          actions={<span className="muted">노드 2,418 · 관계 7,962</span>}>
          <KnowledgeGraph />
        </Card>
      </Anno>

      <Anno n={3} className="card">
        <div className="tabs" role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => (
            key === 'sources'
              ? <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}><Icon size={15} />{label}</button>
              : <Anno key={key} n={key === 'manuals' ? 4 : 5} inline place="right"><button role="tab" aria-selected={tab === key} onClick={() => setTab(key)}><Icon size={15} />{label}</button></Anno>
          ))}
        </div>

        {tab === 'sources' && (
          <div className="table-wrap" role="tabpanel">
            <table className="table">
              <caption className="sr-only">수집 대상 데이터 소스</caption>
              <thead><tr><th>콘텐츠</th><th>대상 사이트</th><th>유형</th><th className="right">문서</th><th className="right">청크</th><th>동기화 주기</th><th>최근 수집</th><th>상태</th><th /></tr></thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.id}>
                    <td className="strong">{s.name}</td>
                    <td className="muted">{s.site}</td>
                    <td><span className="badge badge-gray">{s.type}</span></td>
                    <td className="right num">{s.docs ? s.docs.toLocaleString() : '-'}</td>
                    <td className="right num">{s.chunks ? s.chunks.toLocaleString() : '-'}</td>
                    <td>
                      <select className="select" style={{ width: 116 }} defaultValue={s.cycle} aria-label={`${s.name} 동기화 주기`}>
                        {[...new Set([s.cycle, '10분', '1시간', '매일 03:00', '매주 월', '업로드 시'])].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="muted num">{s.last}</td>
                    <td>{status(s.status)}</td>
                    <td className="right"><button className="btn btn-sm"><RefreshCw size={13} />수집</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'manuals' && (
          <div role="tabpanel">
            <div className="card-body row between" style={{ flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
              <span className="muted">업로드한 규정·매뉴얼은 자동 전처리되어 AI 답변 근거로 반영됩니다</span>
              <button className="btn btn-primary" onClick={() => fileRef.current?.click()}><Upload size={15} />파일 업로드</button>
              <input ref={fileRef} type="file" hidden multiple onChange={(e) => setUploaded((u) => [...u, ...Array.from(e.target.files ?? []).map((f) => f.name)])} />
            </div>
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">업로드된 매뉴얼</caption>
                <thead><tr><th>파일명</th><th>담당 부서</th><th>등록자</th><th>등록일</th><th>버전</th><th>반영 상태</th><th /></tr></thead>
                <tbody>
                  {[...uploaded.map((name) => ({ name, dept: 'AI정보실', by: '김○○', date: '2026-09-30', ver: 'v1', done: false })), ...MANUALS].map((m) => (
                    <tr key={m.name}>
                      <td className="strong"><span className="row"><FileText size={15} className="faint" />{m.name}</span></td>
                      <td>{m.dept}</td><td>{m.by}</td><td className="num muted">{m.date}</td>
                      <td><span className="badge badge-gray">{m.ver}</span></td>
                      <td>{m.done ? <span className="badge badge-green"><CircleCheck size={12} />반영 완료</span> : <span className="badge badge-blue"><Loader size={12} className="spin" />처리 중</span>}</td>
                      <td className="right">
                        <span className="row" style={{ justifyContent: 'flex-end', gap: 2 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" aria-label="새 버전 업로드"><FileUp size={15} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm btn-danger" aria-label="삭제"><Trash2 size={15} /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="table-wrap" role="tabpanel">
            <table className="table">
              <caption className="sr-only">수집 실패 이력</caption>
              <thead><tr><th>일시</th><th>대상</th><th>오류</th><th>재시도</th><th>결과</th></tr></thead>
              <tbody>
                <tr><td className="num muted">09-30 13:50</td><td className="strong">PortWise 선석배정</td><td>HTTP 504 Gateway Timeout</td><td className="num">3 / 3</td><td><span className="badge badge-red"><CircleX size={12} />실패 · 담당자 알림</span></td></tr>
                <tr><td className="num muted">09-30 13:00</td><td className="strong">PortWise 선석배정</td><td>Connection reset</td><td className="num">2 / 3</td><td><span className="badge badge-green"><CircleCheck size={12} />재시도 성공</span></td></tr>
                <tr><td className="num muted">09-28 03:12</td><td className="strong">대표홈페이지 항만운영</td><td>첨부파일 OCR 실패 · 암호화 PDF</td><td className="num">1 / 3</td><td><span className="badge badge-amber"><span className="dot" />건너뜀</span></td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Anno>
    </div>
  )
}
