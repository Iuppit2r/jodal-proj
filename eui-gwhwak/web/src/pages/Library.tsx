import { useMemo, useState } from 'react'
import { BOOKS, MODULES, MY_LOANS, MY_RESERVES, TYPE_COLOR, type Book, type BookType } from '../data/library'
import { useApp } from '../context'
import { Modal, PageHead, Stat, Tabs } from '../components/ui'
import { BarChart, Donut, PALETTE } from '../components/charts'

type Tab = 'search' | 'my' | 'dash'
type FacetKey = 'type' | 'author' | 'publisher' | 'year' | 'subject'
const FACETS: { key: FacetKey; label: string }[] = [
  { key: 'type', label: '자료유형' }, { key: 'subject', label: '주제' }, { key: 'year', label: '발행년' },
  { key: 'publisher', label: '출판사' }, { key: 'author', label: '저자' },
]

export default function Library() {
  const { role } = useApp()
  const [tab, setTab] = useState<Tab>('search')
  const tabs = [
    { id: 'search' as Tab, label: '소장자료 통합검색' },
    ...(role !== 'public' ? [{ id: 'my' as Tab, label: 'My Library' }] : []),
    ...(role === 'admin' ? [{ id: 'dash' as Tab, label: '업무 대시보드' }] : []),
  ]
  const cur = tabs.some(t => t.id === tab) ? tab : 'search'
  return (
    <>
      <PageHead title="통합전자도서관" desc="유니코드 검색엔진 기반 다국어 통합검색 · 실시간 색인 · 100% API 기반 통합 운영" reqs={['SFR-03', 'INR-06', 'DAR-09']} />
      <div className="card" style={{ marginBottom: 16 }}>
        <Tabs value={cur} onChange={setTab} items={tabs} />
      </div>
      {cur === 'search' && <SearchTab />}
      {cur === 'my' && <MyTab />}
      {cur === 'dash' && <Dashboard />}
    </>
  )
}

function SearchTab() {
  const { toast } = useApp()
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [sel, setSel] = useState<Record<FacetKey, Set<string>>>({ type: new Set(), author: new Set(), publisher: new Set(), year: new Set(), subject: new Set() })
  const [sort, setSort] = useState<'score' | 'year'>('score')
  const [focus, setFocus] = useState<Book | null>(null)
  const [wish, setWish] = useState(false)

  const score = (b: Book) => {
    if (!applied) return 1
    const t = applied.toLowerCase()
    let s = 0
    if (b.title.toLowerCase().includes(t)) s += 3
    if (b.title.toLowerCase() === t) s += 2
    if (b.subject.includes(applied)) s += 2
    if (b.author.toLowerCase().includes(t)) s += 1.5
    return s
  }
  const base = useMemo(() => BOOKS.map(b => ({ b, s: score(b) })).filter(x => x.s > 0), [applied])
  const val = (b: Book, k: FacetKey) => String(b[k])
  const results = base
    .filter(({ b }) => FACETS.every(f => !sel[f.key].size || sel[f.key].has(val(b, f.key))))
    .sort((a, b) => sort === 'score' ? b.s - a.s || b.b.year - a.b.year : b.b.year - a.b.year)

  const toggle = (k: FacetKey, v: string) => {
    const n = new Set(sel[k])
    n.has(v) ? n.delete(v) : n.add(v)
    setSel({ ...sel, [k]: n })
  }
  const recs = focus ? BOOKS.filter(b => b.id !== focus.id && (b.subject === focus.subject || b.author === focus.author)).slice(0, 4) : []
  const byType = (['단행본', '보고서', '연속간행물', '비도서', '전자자료'] as BookType[]).map(t => ({ t, n: results.filter(r => r.b.type === t).length }))

  return (
    <>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <form className="row" onSubmit={e => { e.preventDefault(); setApplied(q.trim()); setFocus(null) }}>
          <select className="select" style={{ width: 120 }} aria-label="검색 필드"><option>전체</option><option>서명</option><option>저자</option><option>주제</option><option>청구기호</option></select>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="서명, 저자, 주제어 (다국어 검색 지원 — 예: 감염병, Genomic, 유전체)" aria-label="소장자료 검색어" />
          <button className="btn btn-primary">검색</button>
          <button type="button" className="btn" onClick={() => setWish(true)}>희망도서 신청</button>
        </form>
        <div className="row wrap" style={{ marginTop: 10, gap: 6 }}>
          {byType.map(({ t, n }) => (
            <button key={t} className="chip" aria-pressed={sel.type.has(t)} onClick={() => toggle('type', t)}>{t} <b>{n}</b></button>
          ))}
        </div>
      </div>

      <div className="lib-layout">
        <aside className="card" aria-label="검색결과 제한 (Facet)">
          <div className="card-head"><h3>결과 내 제한</h3><span className="spacer" />
            <button className="btn btn-sm btn-ghost" onClick={() => setSel({ type: new Set(), author: new Set(), publisher: new Set(), year: new Set(), subject: new Set() })}>초기화</button>
          </div>
          {FACETS.map(f => {
            const counts = new Map<string, number>()
            base.forEach(({ b }) => counts.set(val(b, f.key), (counts.get(val(b, f.key)) ?? 0) + 1))
            const entries = [...counts.entries()].sort((a, b) => f.key === 'year' ? +b[0] - +a[0] : b[1] - a[1]).slice(0, 6)
            return (
              <fieldset key={f.key} className="facet" style={{ border: 0, margin: 0 }}>
                <legend style={{ fontSize: 13.5, fontWeight: 700, padding: 0, float: 'left', width: '100%', marginBottom: 6 }}>{f.label}</legend>
                {entries.map(([v, n]) => (
                  <label key={v}><input type="checkbox" checked={sel[f.key].has(v)} onChange={() => toggle(f.key, v)} />{v}<span className="cnt">{n}</span></label>
                ))}
              </fieldset>
            )
          })}
        </aside>

        <section className="card" aria-label="검색 결과">
          <div className="card-head">
            <h2>검색결과 <span style={{ color: 'var(--c-primary)' }}>{results.length}</span>건</h2>
            {applied && <span className="muted small">“{applied}”</span>}
            <span className="spacer" />
            <select className="select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value as 'score' | 'year')} aria-label="정렬">
              <option value="score">정확도(Score)순</option><option value="year">최신순</option>
            </select>
          </div>
          {results.map(({ b, s }) => (
            <article key={b.id} className="book" style={focus?.id === b.id ? { background: 'var(--c-primary-weak)' } : undefined}>
              <div className="book-cover" style={{ background: TYPE_COLOR[b.type] }} aria-hidden>{b.type}</div>
              <div style={{ minWidth: 0 }}>
                <div className="row wrap" style={{ gap: 6, marginBottom: 2 }}>
                  <span className="badge" style={{ color: TYPE_COLOR[b.type] }}>{b.type}</span>
                  <span className="badge">{b.lang}</span>
                  {applied && <span className="badge badge-blue">Score {(s * 10).toFixed(0)}</span>}
                </div>
                <h3><button className="btn-ghost" style={{ border: 0, padding: 0, background: 'none', font: 'inherit', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }} onClick={() => setFocus(b)}>{b.title}</button></h3>
                <div className="small muted">{b.author} · {b.publisher} · {b.year}</div>
                <div className="xs muted">청구기호 {b.callNo} · {b.location}</div>
              </div>
              <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
                <span className={`badge ${b.status === '대출가능' ? 'badge-ok' : b.status === '대출중' ? 'badge-warn' : 'badge-blue'}`}>
                  {b.status}{b.due ? ` (~${b.due.slice(5)})` : ''}
                </span>
                {b.status === '대출중' && <button className="btn btn-sm" onClick={() => toast('예약 신청되었습니다. (예약순위 1)')}>예약</button>}
                {b.status === '원문제공' && <button className="btn btn-sm">원문보기</button>}
                {b.status === '대출가능' && <button className="btn btn-sm" onClick={() => toast('관심자료에 담았습니다.')}>관심자료</button>}
              </div>
            </article>
          ))}
          {!results.length && <div className="empty">검색 결과가 없습니다. 희망도서를 신청해 보세요.</div>}
        </section>

        <aside className="card" aria-label="유사 소장자료 추천">
          <div className="card-head"><h3>이 자료와 유사한 소장자료</h3></div>
          {!focus ? <div className="empty small">자료명을 선택하면 저자·주제가 유사한 소장자료를 자동 추천합니다.</div> : (
            <div style={{ padding: 12 }} className="stack">
              <div className="small"><b>{focus.title}</b><div className="xs muted">주제: {focus.subject} · 저자: {focus.author}</div></div>
              <div className="divider" style={{ margin: 0 }} />
              {recs.map(r => (
                <button key={r.id} className="src-item" style={{ gridTemplateColumns: '32px 1fr' }} onClick={() => setFocus(r)}>
                  <span className="book-cover" style={{ width: 32, height: 44, background: TYPE_COLOR[r.type], padding: 0 }} aria-hidden />
                  <span><span className="src-title" style={{ display: 'block', fontSize: 13 }}>{r.title}</span>
                    <span className="src-meta">{r.subject === focus.subject ? '동일 주제' : '동일 저자'} · {r.year}</span></span>
                </button>
              ))}
              {!recs.length && <div className="xs muted">추천 자료가 없습니다.</div>}
            </div>
          )}
        </aside>
      </div>
      {wish && <WishModal onClose={() => setWish(false)} />}
    </>
  )
}

function WishModal({ onClose }: { onClose: () => void }) {
  const { toast } = useApp()
  return (
    <Modal title="희망도서 신청" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>취소</button><button className="btn btn-primary" onClick={() => { toast('희망도서 신청이 접수되었습니다.'); onClose() }}>신청</button></>}>
      <div className="stack">
        <label className="field">서명 *<input className="input" /></label>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="field">저자<input className="input" /></label>
          <label className="field">출판사<input className="input" /></label>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="field">ISBN<input className="input" /></label>
          <label className="field">발행년<input className="input" /></label>
        </div>
        <label className="field">신청 사유<textarea className="textarea" rows={3} /></label>
      </div>
    </Modal>
  )
}

function MyTab() {
  const { toast } = useApp()
  const [loans, setLoans] = useState(MY_LOANS)
  const book = (id: string) => BOOKS.find(b => b.id === id)!
  const dday = (d: string) => Math.ceil((new Date(d).getTime() - new Date('2026-10-05').getTime()) / 86400000)
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))' }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gridColumn: '1 / -1' }}>
        <Stat label="대출 중" value={`${loans.length}권`} sub="최대 5권" />
        <Stat label="예약" value={`${MY_RESERVES.length}건`} />
        <Stat label="대출 제재" value="없음" color="var(--c-ok)" sub="연체 시 연체일수만큼 정지" />
      </div>
      <section className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-head"><h2>대출 현황</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>자료</th><th>대출일</th><th>반납예정일</th><th>연장</th><th /></tr></thead>
            <tbody>
              {loans.map(l => {
                const d = dday(l.due)
                return (
                  <tr key={l.id}>
                    <td><b>{book(l.id).title}</b><div className="xs muted">{book(l.id).callNo}</div></td>
                    <td className="mono">{l.loanedAt}</td>
                    <td className="mono">{l.due} <span className={`badge ${d <= 4 ? 'badge-warn' : ''}`}>D-{d}</span></td>
                    <td>{l.extended}/1회</td>
                    <td><button className="btn btn-sm" disabled={l.extended >= 1}
                      onClick={() => { setLoans(ls => ls.map(x => x.id === l.id ? { ...x, extended: 1, due: addDays(x.due, 14) } : x)); toast('반납예정일이 14일 연장되었습니다.') }}>연장</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <div className="card-head"><h2>예약 현황</h2></div>
        <div className="card-pad">
          {MY_RESERVES.map(r => (
            <div key={r.id} className="row"><div style={{ flex: 1 }}><b>{book(r.id).title}</b><div className="xs muted">예약일 {r.reservedAt} · 순위 {r.rank}</div></div><button className="btn btn-sm btn-danger">취소</button></div>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-head"><h2>희망도서 신청 내역</h2></div>
        <table className="table">
          <tbody>
            <tr><td>Vaccine Epidemiology (2nd ed.)</td><td><span className="badge badge-blue">구입 진행</span></td></tr>
            <tr><td>공중보건 데이터 과학</td><td><span className="badge badge-ok">소장 완료</span></td></tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}

const WIDGETS = ['업무 지표', '월별 대출 추이', '장서 현황', '수서 현황', 'My 메뉴', '최근 이용 메뉴', '접속 이력'] as const
type Widget = typeof WIDGETS[number]

function Dashboard() {
  const [on, setOn] = useState<Set<Widget>>(new Set(WIDGETS))
  const [cfg, setCfg] = useState(false)
  const [myMenu, setMyMenu] = useState(['대출반납', '수서', '신청관리', '경영지원서비스'])
  const has = (w: Widget) => on.has(w)
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row">
        <span className="small muted">관리자 설정 위젯 · 마지막 접속 2026-10-05 09:12 (10.12.4.33)</span>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={() => setCfg(true)}>⚙ 위젯 설정</button>
      </div>
      {has('업무 지표') && (
        <div className="widget-grid">
          <Stat label="오늘 대출" value="38" sub="전일 대비 +6" />
          <Stat label="오늘 반납" value="41" />
          <Stat label="연체 자료" value="12" color="var(--c-warn)" sub="연체 이용자 9명" />
          <Stat label="희망도서 처리 대기" value="7" color="var(--c-primary)" />
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}>
        {has('월별 대출 추이') && (
          <section className="card"><div className="card-head"><h3>월별 대출·반납 (2026)</h3></div>
            <div className="card-pad"><BarChart labels={['4월', '5월', '6월', '7월', '8월', '9월']}
              series={[{ name: '대출', color: PALETTE[0], values: [612, 680, 590, 540, 498, 702] }, { name: '반납', color: PALETTE[1], values: [598, 660, 610, 552, 470, 688] }]} unit="건" /></div>
          </section>
        )}
        {has('장서 현황') && (
          <section className="card"><div className="card-head"><h3>장서 현황 (자료유형별)</h3></div>
            <div className="card-pad"><Donut center={{ value: '128,940', label: '총 소장' }} data={[
              { name: '단행본', value: 74210, color: TYPE_COLOR.단행본 }, { name: '보고서', value: 21880, color: TYPE_COLOR.보고서 },
              { name: '연속간행물', value: 18450, color: TYPE_COLOR.연속간행물 }, { name: '비도서', value: 3120, color: TYPE_COLOR.비도서 },
              { name: '전자자료', value: 11280, color: TYPE_COLOR.전자자료 }]} /></div>
          </section>
        )}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))' }}>
        {has('수서 현황') && (
          <section className="card"><div className="card-head"><h3>수서 현황</h3></div>
            <table className="table"><tbody>
              <tr><td>주문 진행</td><td style={{ textAlign: 'right' }}><b>46</b>건</td></tr>
              <tr><td>검수 대기</td><td style={{ textAlign: 'right' }}><b>18</b>건</td></tr>
              <tr><td>정리(MARC) 대기</td><td style={{ textAlign: 'right' }}><b>23</b>건</td></tr>
              <tr><td>예산 집행률</td><td style={{ textAlign: 'right' }}><b>72.4</b>%</td></tr>
            </tbody></table>
          </section>
        )}
        {has('My 메뉴') && (
          <section className="card"><div className="card-head"><h3>My 메뉴</h3><span className="spacer" /><span className="xs muted">클릭하여 추가/제거</span></div>
            <div className="card-pad row wrap" style={{ gap: 6 }}>
              {MODULES.map(m => (
                <button key={m} className="chip" aria-pressed={myMenu.includes(m)} onClick={() => setMyMenu(x => x.includes(m) ? x.filter(y => y !== m) : [...x, m])}>{m}</button>
              ))}
            </div>
          </section>
        )}
        {has('최근 이용 메뉴') && (
          <section className="card"><div className="card-head"><h3>최근 이용 메뉴</h3></div>
            <ul className="card-pad stack" style={{ margin: 0, listStyle: 'none', gap: 8 }}>
              {[['대출반납 › 반납처리', '09:31'], ['정리 › MARC 편집', '09:20'], ['경영지원 › 통계보고서', '어제'], ['이용자관리 › 인사연동 이력', '어제']].map(([m, t]) => (
                <li key={m} className="row small"><a href="#" onClick={e => e.preventDefault()}>{m}</a><span className="spacer" /><span className="muted xs">{t}</span></li>
              ))}
            </ul>
          </section>
        )}
        {has('접속 이력') && (
          <section className="card"><div className="card-head"><h3>개인별 접속 이력</h3></div>
            <table className="table small"><tbody>
              {[['10-05 09:12', '10.12.4.33', '성공'], ['10-02 08:58', '10.12.4.33', '성공'], ['10-01 18:40', '10.12.7.81', '실패(비밀번호)'], ['10-01 09:03', '10.12.4.33', '성공']].map(([t, ip, r]) => (
                <tr key={t}><td className="mono">{t}</td><td className="mono">{ip}</td><td><span className={`badge ${r === '성공' ? 'badge-ok' : 'badge-danger'}`}>{r}</span></td></tr>
              ))}
            </tbody></table>
          </section>
        )}
      </div>
      {cfg && (
        <Modal title="대시보드 위젯 설정" onClose={() => setCfg(false)} footer={<button className="btn btn-primary" onClick={() => setCfg(false)}>완료</button>}>
          <div className="stack" style={{ gap: 6 }}>
            {WIDGETS.map(w => (
              <label key={w} className="row" style={{ padding: '6px 0' }}>
                <input type="checkbox" checked={on.has(w)} onChange={() => setOn(s => { const n = new Set(s); n.has(w) ? n.delete(w) : n.add(w); return n })} />{w}
              </label>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function addDays(d: string, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}
