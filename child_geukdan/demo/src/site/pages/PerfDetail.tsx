import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Accessibility, Bus, Car, Clock, MapPin, Share2, Ticket, Train, Trash2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import Poster from '../../components/Poster'
import * as M from '../../data/mock'
import type { Grade, Round } from '../../data/types'
import { memberTier, saleState, useMe, useStore, venueOf } from '../../store'
import { cx, fmtRange, maskName, won } from '../../lib/format'
import { FavButton, RoundPicker, Stars } from '../parts/ui'
import { dday, statusTone, usePerfRounds, useRemainMap } from '../parts/perf'

const TABS = ['공연소개', '출연·제작진', '관람후기', '예매·취소 안내', '공연장 안내'] as const

export default function PerfDetail() {
  const { id } = useParams()
  const perfs = useStore(s => s.performances)
  const p = perfs.find(x => x.id === id && x.status !== '임시저장')
  const me = useMe()
  const set = useStore(s => s.set)
  const toast = useStore(s => s.toast)
  const nav = useNavigate()
  const rounds = usePerfRounds(p?.id)
  const remain = useRemainMap(p?.id)
  const [round, setRound] = useState<Round | undefined>()
  const [tab, setTab] = useState<(typeof TABS)[number]>('공연소개')

  if (!p) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-lg font-bold">공연 정보를 찾을 수 없습니다.</p>
        <Link to="/site/performances" className="btn-primary mt-6">공연 목록으로</Link>
      </div>
    )
  }
  const v = venueOf(p)
  const sale = saleState(p, me)
  const tier = memberTier(me)

  const book = () => {
    if (!me) {
      set({ pendingBooking: { perfId: p.id, roundId: round?.id } })
      toast('로그인 후 선택하신 공연 예매를 이어서 진행합니다', 'warn')
      nav(`/site/login?next=/site/book/${p.id}`)
      return
    }
    set({ pendingBooking: { perfId: p.id, roundId: round?.id } })
    nav(`/site/book/${p.id}`)
  }

  let cta: { label: string; onClick?: () => void; tone: string; disabled?: boolean; note?: string }
  if (sale.canBook) cta = { label: round ? `${round.date.slice(5).replace('-', '/')} ${round.time} ${sale.label}` : sale.label, onClick: book, tone: sale.presale ? 'btn-accent' : 'btn-primary', note: sale.presale ? `유료회원 선예매 기간입니다. 일반 예매 오픈 ${p.openAt}` : undefined }
  else if (sale.presale && !me) cta = { label: '멤버십 회원 로그인 후 선예매', onClick: book, tone: 'btn-accent', note: `현재 유료회원 선예매 중입니다. 일반 예매는 ${p.openAt} 오픈됩니다.` }
  else if (sale.presale && !tier) cta = { label: '멤버십 가입하고 선예매', onClick: () => nav('/site/membership'), tone: 'btn-accent', note: `일반 예매는 ${p.openAt} 오픈됩니다.` }
  else cta = { label: sale.label, tone: 'btn-outline', disabled: true, note: p.presaleAt && p.presaleAt.slice(0, 10) >= M.TODAY ? `유료회원 선예매 ${p.presaleAt} · 일반 ${p.openAt}` : undefined }

  const grades = (Object.entries(p.prices) as [Grade, number][])
  const discounts = M.ticketTypes.filter(t => t.active && t.id !== 't-gen' && t.id !== 't-inv')

  return (
    <>
      <PageHeader crumbs={['공연', '공연안내', p.title]} title={p.title} desc={p.subtitle} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* 공연 정보 */}
          <div className="grid gap-6 sm:grid-cols-[220px_1fr] md:grid-cols-[260px_1fr]">
            <div className="relative mx-auto w-52 sm:w-full">
              <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-line">
                <Poster title={p.title} palette={p.palette} motif={p.motif} sub={p.subtitle} className="aspect-[5/7] w-full" />
              </div>
              <div className="mt-3 flex justify-center gap-2">
                <FavButton perfId={p.id} className="ring-1 ring-line" />
                <button className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-line hover:scale-110" aria-label="공유하기"
                  onClick={() => { try { navigator.clipboard?.writeText(location.href) } catch { /* noop */ } toast('공연 링크가 복사되었습니다') }}><Share2 size={16} /></button>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                <span className={cx('chip', statusTone(p.status))}>{p.status}</span>
                <span className="chip bg-ink text-white">{dday(p)}</span>
                <span className="chip bg-paper text-muted">{p.genre}</span>
                <span className="chip bg-paper text-muted">{p.target}</span>
                {p.incomeDeduction && <span className="chip bg-mint-400/15 text-mint-500">문화비 소득공제</span>}
                {p.isRental && <span className="chip bg-paper text-muted">대관공연</span>}
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">{p.summary}</p>
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">공연 기본 정보</caption>
                <tbody className="[&_th]:w-20 [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:align-top [&_th]:font-semibold [&_th]:text-muted [&_td]:py-2 [&_tr]:border-b [&_tr]:border-line">
                  <tr><th scope="row">기간</th><td>{fmtRange(p.start, p.end)}</td></tr>
                  <tr><th scope="row">장소</th><td>{v.name}</td></tr>
                  <tr><th scope="row">관람등급</th><td>{p.ageLimit}</td></tr>
                  <tr><th scope="row">관람시간</th><td>{p.runtime}분 (인터미션 없음)</td></tr>
                  <tr><th scope="row">가격</th><td><ul className="flex flex-wrap gap-x-4 gap-y-1">{grades.map(([g, pr]) => <li key={g}><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: M.gradeColor[g] }} aria-hidden />{M.gradeLabel[g]} <b>{won(pr)}</b></li>)}</ul></td></tr>
                  <tr><th scope="row">할인</th><td>
                    <ul className="space-y-0.5 text-[13px]">
                      {discounts.map(t => (
                        <li key={t.id} className={cx(t.memberOnly && tier?.id !== t.memberOnly && 'text-muted')}>
                          <b>{t.name} {Math.round(t.discountRate * 100)}%</b> <span className="text-muted">— {t.desc}{t.needsProof ? ' · 현장 증빙' : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </td></tr>
                  <tr><th scope="row">제작</th><td>{p.producer}</td></tr>
                </tbody>
              </table>
              {p.accessibility.length > 0 && (
                <div className="mt-4 rounded-xl bg-sun-300/25 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold"><Accessibility size={16} />접근성 회차·서비스</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">{p.accessibility.map(a => <li key={a} className="chip bg-white text-ink ring-1 ring-sun-400">{a}</li>)}</ul>
                </div>
              )}
            </div>
          </div>

          {/* 예매 박스 */}
          <aside className="lg:sticky lg:top-36 lg:self-start" aria-label="회차 선택 및 예매">
            <div className="card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-extrabold"><Ticket size={18} className="text-brand-600" />날짜·회차 선택</h2>
              <div className="mt-4">
                <RoundPicker rounds={rounds} remain={remain} value={round?.id} onChange={setRound} compact />
              </div>
              <button className={cx(cta.tone, 'mt-5 w-full py-3.5 text-base')} disabled={cta.disabled} onClick={cta.onClick}>{cta.label}</button>
              {cta.note && <p className="mt-2 text-center text-xs text-muted">{cta.note}</p>}
              {!me && sale.canBook && <p className="mt-2 text-center text-xs text-muted">예매는 로그인 후 이용 가능합니다. 선택하신 회차는 로그인 후 유지됩니다.</p>}
            </div>
          </aside>
        </div>

        {/* 탭 */}
        <div className="mt-12">
          <div role="tablist" aria-label="공연 상세 정보" className="flex overflow-x-auto border-b border-line">
            {TABS.map(t => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cx('-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-bold sm:px-6 sm:text-base', tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}>
                {t}{t === '관람후기' && <ReviewCount perfId={p.id} />}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="py-8">
            {tab === '공연소개' && (
              <div className="grid gap-8 md:grid-cols-[1fr_280px]">
                <div>
                  <h3 className="text-lg font-extrabold">작품 소개</h3>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/90">{p.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">{p.tags.map(t => <span key={t} className="chip bg-brand-50 text-brand-700">#{t}</span>)}</div>
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <Poster title={p.titleEn} palette={[p.palette[1], p.palette[0], p.palette[2]]} motif={p.motif} sub="Production still (시연용)" className="aspect-[4/5] w-full" />
                </div>
              </div>
            )}
            {tab === '출연·제작진' && (
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-extrabold">제작진</h3>
                  <dl className="mt-3 divide-y divide-line border-y border-line">
                    {p.credits.map(c => <div key={c.role + c.name} className="flex py-3 text-sm"><dt className="w-32 text-muted">{c.role}</dt><dd className="font-semibold">{c.name}</dd></div>)}
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">출연</h3>
                  <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {p.cast.map((c, i) => (
                      <li key={c} className="text-center">
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-white" style={{ background: p.palette[i % 2 ? 0 : 2] }} aria-hidden>{c[0]}</span>
                        <span className="mt-1.5 block text-sm font-semibold">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {tab === '관람후기' && <Reviews perfId={p.id} />}
            {tab === '예매·취소 안내' && <BookingGuide />}
            {tab === '공연장 안내' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-brand-50" role="img" aria-label={`${v.name} 위치 지도 (시연용)`}>
                  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden>
                    <path d="M0 200 L400 120" stroke="#dbe6ff" strokeWidth="28" /><path d="M150 0 L210 300" stroke="#dbe6ff" strokeWidth="20" />
                    <path d="M0 60 L400 260" stroke="#fff" strokeWidth="10" />
                  </svg>
                  <span className="relative flex flex-col items-center"><MapPin size={40} className="fill-coral-500 text-white" /><span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-bold shadow">{v.name}</span></span>
                </div>
                <div className="space-y-4 text-sm">
                  <h3 className="text-lg font-extrabold">{v.name} <span className="text-sm font-medium text-muted" lang="en">{v.nameEn}</span></h3>
                  <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />{v.address}</p>
                  <p className="flex gap-2"><Train size={16} className="mt-0.5 shrink-0 text-brand-600" />지하철 1·4호선 서울역 1번 출구 도보 10분 / 4호선 숙대입구역 2번 출구 도보 7분</p>
                  <p className="flex gap-2"><Bus size={16} className="mt-0.5 shrink-0 text-brand-600" />간선 421, 400 / 지선 7016 — 숙명여대입구 하차</p>
                  <p className="flex gap-2"><Car size={16} className="mt-0.5 shrink-0 text-brand-600" />주차 공간이 협소하오니 대중교통을 이용해주세요. (장애인 차량 우선)</p>
                  <p className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-brand-600" />매표소 공연 1시간 전 오픈 · 객석 입장 공연 20분 전</p>
                  <ul className="flex flex-wrap gap-1.5 pt-1">{['휠체어석 ' + v.wheelchair.length + '석', '수유실', '유모차 보관', '엘리베이터', '물품보관소'].map(x => <li key={x} className="chip bg-paper text-muted">{x}</li>)}</ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ReviewCount({ perfId }: { perfId: string }) {
  const n = useStore(s => s.reviews.filter(r => r.perfId === perfId).length)
  return <span className="ml-1 text-xs">({n})</span>
}

function Reviews({ perfId }: { perfId: string }) {
  const all = useStore(s => s.reviews)
  const reviews = all.filter(r => r.perfId === perfId)
  const me = useMe()
  const add = useStore(s => s.addReview)
  const del = useStore(s => s.deleteReview)
  const toast = useStore(s => s.toast)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [err, setErr] = useState('')
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (body.trim().length < 10) { setErr('후기를 10자 이상 입력해주세요.'); return }
    add({ perfId, userId: me!.id, name: maskName(me!.name), rating, body: body.trim() })
    setBody(''); setErr(''); setRating(5)
    toast('관람후기가 등록되었습니다')
  }
  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr]">
      <div className="rounded-2xl bg-paper p-6 text-center md:self-start">
        <p className="text-sm text-muted">평균 별점</p>
        <p className="mt-1 text-4xl font-black">{avg.toFixed(1)}</p>
        <div className="mt-1"><Stars value={Math.round(avg)} size={20} /></div>
        <p className="mt-2 text-xs text-muted">후기 {reviews.length}건</p>
      </div>
      <div>
        {me ? (
          <form onSubmit={submit} className="card p-4">
            <fieldset>
              <legend className="label">별점</legend>
              <div className="flex gap-1" role="radiogroup" aria-label="별점 선택">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i}점`} onClick={() => setRating(i)} className="p-0.5">
                    <svg viewBox="0 0 20 20" width={28} height={28} aria-hidden><path d="M10 1.5l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L10 14.8l-5.4 2.9 1.2-5.9L1.4 7.7l6-.7z" fill={i <= rating ? '#ffc933' : '#e3e6ec'} /></svg>
                  </button>
                ))}
              </div>
            </fieldset>
            <label htmlFor="rv-body" className="label mt-3">후기 내용</label>
            <textarea id="rv-body" className="input min-h-24" value={body} onChange={e => setBody(e.target.value)} maxLength={500}
              aria-invalid={!!err} aria-describedby="rv-err" placeholder="공연을 보신 소감을 남겨주세요. (10자 이상, 욕설·비방은 관리자에 의해 삭제될 수 있습니다)" />
            <div className="mt-2 flex items-center justify-between">
              <p id="rv-err" className="text-xs text-coral-500" aria-live="polite">{err}</p>
              <button className="btn-primary btn-sm">후기 등록</button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
            관람후기는 로그인 후 작성할 수 있습니다. <Link to="/site/login" className="font-bold text-brand-600 link-u">로그인</Link>
          </div>
        )}
        <ul className="mt-4 divide-y divide-line">
          {reviews.map(r => (
            <li key={r.id} className="py-4">
              <div className="flex items-center gap-2 text-sm">
                <Stars value={r.rating} />
                <b>{r.name}</b>
                <span className="text-xs text-muted">{r.createdAt.replace(/-/g, '.')}</span>
                {me?.id === r.userId && (
                  <button className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-coral-500" onClick={() => { if (confirm('후기를 삭제할까요?')) { del(r.id); toast('후기가 삭제되었습니다') } }}>
                    <Trash2 size={13} />삭제
                  </button>
                )}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{r.body}</p>
            </li>
          ))}
          {!reviews.length && <li className="py-10 text-center text-sm text-muted">첫 관람후기를 남겨주세요.</li>}
        </ul>
      </div>
    </div>
  )
}

export function BookingGuide() {
  return (
    <div className="space-y-8 text-sm leading-relaxed">
      <section>
        <h3 className="text-lg font-extrabold">예매 안내</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/90">
          <li>온라인 예매는 회원 로그인 후 1회 최대 8매까지 가능하며, 공연 시작 3시간 전까지 예매할 수 있습니다.</li>
          <li>유료 멤버십 회원은 일반 오픈 3일 전부터 선예매가 가능합니다.</li>
          <li>예매수수료는 매당 1,000원이며, 유료 멤버십 회원은 면제됩니다.</li>
          <li>할인 권종(청소년·어린이·장애인 등)은 공연 당일 현장에서 증빙자료를 확인하며, 미지참 시 차액을 지불하셔야 합니다.</li>
          <li>가상계좌 결제는 예매 익일 23:59까지 입금하지 않으면 자동 취소됩니다.</li>
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-extrabold">취소 수수료</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="tbl min-w-[420px]">
            <caption className="sr-only">취소 시점별 수수료</caption>
            <thead><tr><th scope="col">취소 시점</th><th scope="col">취소 수수료</th></tr></thead>
            <tbody>
              <tr><td>예매 당일 자정까지</td><td>없음</td></tr>
              <tr><td>관람일 10일 전까지</td><td>없음</td></tr>
              <tr><td>관람일 9일 ~ 7일 전</td><td>매당 1,000원</td></tr>
              <tr><td>관람일 6일 ~ 3일 전</td><td>티켓금액의 10%</td></tr>
              <tr><td>관람일 2일 ~ 1일 전</td><td>티켓금액의 30%</td></tr>
              <tr><td>관람 당일</td><td className="font-bold text-coral-500">취소 불가</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">※ 부분 취소는 마이페이지 &gt; 예매 확인/취소에서 좌석별로 가능합니다. 예매수수료는 예매 당일 취소 시에만 환불됩니다.</p>
      </section>
    </div>
  )
}
