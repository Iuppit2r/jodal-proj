import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronDown, Clock, Mail, Paperclip, RotateCcw, Send } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useMe, useStore } from '../../store'
import type { Inquiry as Inq } from '../../data/types'
import { cx } from '../../lib/format'
import { SUPPORT_TABS } from './Faq'
import { Section, SectionTitle } from './ui'

const CATS: Inq['category'][] = ['예매', '취소·환불', '회원', '단체관람', '기타', 'VOC']
const CAT_LABEL: Record<Inq['category'], string> = { 예매: '예매', '취소·환불': '취소·환불', 회원: '회원·멤버십', 단체관람: '단체관람', 기타: '기타', VOC: '고객의 소리(VOC·칭찬·불편·제안)' }
const STATUS_TONE: Record<Inq['status'], string> = { 접수: 'bg-gray-100 text-gray-600', 담당자배정: 'bg-sun-300/50 text-[#7a5600]', 답변완료: 'bg-mint-500 text-white' }
const MAX = 2000

export default function Inquiry() {
  const me = useMe()
  const addInquiry = useStore(s => s.addInquiry)
  const toast = useStore(s => s.toast)
  const inquiries = useStore(s => s.inquiries)
  const mine = me ? inquiries.filter(q => q.userId === me.id) : []

  const empty = { name: '', email: '', category: '' as Inq['category'] | '', title: '', body: '', agree: false }
  const [f, setF] = useState(empty)
  const [file, setFile] = useState<File | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ title: string; email: string } | null>(null)
  const [openQ, setOpenQ] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string | boolean) => setF(p => ({ ...p, [k]: v }))

  const name = me?.name ?? f.name
  const email = me?.email ?? f.email

  const onFile = (fl?: File) => {
    if (!fl) { setFile(null); return }
    const ext = fl.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['jpg', 'jpeg', 'png', 'pdf', 'hwp', 'docx'].includes(ext)) { setErrs(e => ({ ...e, file: 'JPG, PNG, PDF, HWP, DOCX 파일만 첨부할 수 있습니다.' })); setFile(null); return }
    if (fl.size > 5 * 1024 * 1024) { setErrs(e => ({ ...e, file: '첨부파일은 5MB 이하만 가능합니다.' })); setFile(null); return }
    setErrs(e => ({ ...e, file: '' }))
    setFile(fl)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!me) {
      if (name.trim().length < 2) er.name = '이름을 입력해주세요.'
      if (!/^\S+@\S+\.\S+$/.test(email)) er.email = '답변 받을 이메일 주소를 정확히 입력해주세요.'
      if (!f.agree) er.agree = '개인정보 수집·이용에 동의해야 문의를 등록할 수 있습니다.'
    }
    if (!f.category) er.category = '문의 유형을 선택해주세요.'
    if (f.title.trim().length < 2) er.title = '제목을 2자 이상 입력해주세요.'
    if (f.body.trim().length < 10) er.body = '문의 내용을 10자 이상 입력해주세요.'
    if (errs.file) er.file = errs.file
    setErrs(er)
    const first = Object.keys(er).find(k => er[k])
    if (first) { document.getElementById(`iq-${first}`)?.focus(); toast('입력 내용을 확인해주세요.', 'warn'); return }
    addInquiry({ userId: me?.id, name: name.trim(), email: email.trim(), category: f.category as Inq['category'], title: f.title.trim(), body: f.body.trim() + (file ? `\n[첨부] ${file.name}` : '') })
    toast('1:1 문의가 등록되었습니다.')
    setDone({ title: f.title.trim(), email })
    setF(empty); setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const err = (k: string) => errs[k] ? <p id={`iq-${k}-err`} className="mt-1 text-xs text-coral-500">{errs[k]}</p> : null
  const aria = (k: string) => ({ 'aria-invalid': !!errs[k], 'aria-describedby': errs[k] ? `iq-${k}-err` : undefined })

  return (
    <>
      <PageHeader crumbs={['고객지원', '1:1 문의']} title="1:1 문의" desc="문의하신 내용은 담당 부서로 전달되며, 답변은 이메일과 마이페이지에서 확인하실 수 있습니다." tabs={SUPPORT_TABS} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            {done ? (
              <div className="rounded-3xl border-2 border-mint-500 bg-mint-400/10 p-8 text-center" role="status">
                <CheckCircle2 size={48} className="mx-auto text-mint-500" aria-hidden />
                <h2 className="mt-4 text-xl font-extrabold">문의가 정상적으로 접수되었습니다.</h2>
                <p className="mt-2 text-sm text-muted">「{done.title}」</p>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold"><Mail size={16} className="text-brand-600" aria-hidden />담당자 메일로 전달되었습니다.</p>
                <p className="mt-4 text-sm leading-6 text-muted">영업일 기준 1~2일 이내에 <b className="text-ink">{done.email}</b>(으)로 답변드립니다.{me && <><br />답변 내역은 마이페이지에서도 확인할 수 있습니다.</>}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button className="btn-outline" onClick={() => setDone(null)}><RotateCcw size={15} aria-hidden />새 문의 작성</button>
                  {me ? <Link to="/site/mypage" className="btn-primary">마이페이지</Link> : <Link to="/site" className="btn-primary">홈으로</Link>}
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                {me ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 text-sm">
                    <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{me.name[0]}</span>
                    <div><p className="font-bold">{me.name} 님</p><p className="text-muted">{me.email} 로 답변이 발송됩니다.</p></div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-paper p-4 text-sm">
                    비회원으로 문의합니다. <Link to="/site/login" className="link-u font-semibold text-brand-600 underline">로그인</Link>하시면 회원정보가 자동 입력되고 문의 내역을 확인할 수 있어요.
                  </div>
                )}
                {!me && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="iq-name" className="label">이름 <span className="text-coral-500" aria-hidden>*</span></label>
                      <input id="iq-name" className="input" value={f.name} onChange={e => set('name', e.target.value)} aria-required {...aria('name')} />
                      {err('name')}
                    </div>
                    <div>
                      <label htmlFor="iq-email" className="label">이메일 <span className="text-coral-500" aria-hidden>*</span></label>
                      <input id="iq-email" type="email" className="input" placeholder="답변 받을 이메일" value={f.email} onChange={e => set('email', e.target.value)} aria-required {...aria('email')} />
                      {err('email')}
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="iq-category" className="label">문의 유형 <span className="text-coral-500" aria-hidden>*</span></label>
                  <select id="iq-category" className="input" value={f.category} onChange={e => set('category', e.target.value)} aria-required {...aria('category')}>
                    <option value="">선택해주세요</option>
                    {CATS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                  {f.category === 'VOC' && <p className="mt-1 text-xs text-brand-600">칭찬·불편·제안 등 고객의 소리는 VOC 담당자에게 전달되어 서비스 개선에 반영됩니다.</p>}
                  {f.category === '단체관람' && <p className="mt-1 text-xs text-brand-600">기관명, 희망 공연·일시, 인원(학생/인솔자)을 함께 적어주시면 빠른 안내가 가능합니다.</p>}
                  {err('category')}
                </div>
                <div>
                  <label htmlFor="iq-title" className="label">제목 <span className="text-coral-500" aria-hidden>*</span></label>
                  <input id="iq-title" className="input" maxLength={80} value={f.title} onChange={e => set('title', e.target.value)} aria-required {...aria('title')} />
                  {err('title')}
                </div>
                <div>
                  <label htmlFor="iq-body" className="label">문의 내용 <span className="text-coral-500" aria-hidden>*</span></label>
                  <textarea id="iq-body" rows={8} className="input resize-y" maxLength={MAX} placeholder="예매번호, 공연명, 관람일 등을 함께 적어주시면 정확한 답변에 도움이 됩니다." value={f.body} onChange={e => set('body', e.target.value)} aria-required {...aria('body')} />
                  <div className="mt-1 flex justify-between text-xs">
                    <span>{err('body')}</span>
                    <span className={cx('tabular-nums', f.body.length > MAX * 0.9 ? 'text-coral-500' : 'text-muted')} aria-live="polite">{f.body.length.toLocaleString()} / {MAX.toLocaleString()}자</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="iq-file" className="label">첨부파일 <span className="font-normal text-muted">(선택 · JPG/PNG/PDF/HWP/DOCX, 5MB 이하)</span></label>
                  <div className="flex items-center gap-2">
                    <input id="iq-file" type="file" accept=".jpg,.jpeg,.png,.pdf,.hwp,.docx" className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-700" onChange={e => onFile(e.target.files?.[0])} {...aria('file')} />
                  </div>
                  {file && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Paperclip size={12} aria-hidden />{file.name} ({(file.size / 1024).toFixed(0)}KB)</p>}
                  {err('file')}
                </div>
                {!me && (
                  <div className="rounded-xl border border-line p-4 text-xs leading-6 text-muted">
                    <p className="font-bold text-ink">개인정보 수집·이용 동의 (필수)</p>
                    수집항목: 이름, 이메일 / 수집목적: 문의 접수 및 답변 / 보유기간: 문의 처리 완료 후 3년 (전자상거래법)<br />
                    동의를 거부할 수 있으나, 거부 시 비회원 문의 접수가 제한됩니다.
                    <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                      <input id="iq-agree" type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.agree} onChange={e => set('agree', e.target.checked)} {...aria('agree')} />
                      개인정보 수집·이용에 동의합니다.
                    </label>
                    {err('agree')}
                  </div>
                )}
                <div className="flex justify-end gap-2 border-t border-line pt-5">
                  <button type="button" className="btn-outline" onClick={() => { setF(empty); setErrs({}); setFile(null) }}>다시 작성</button>
                  <button className="btn-primary px-8"><Send size={16} aria-hidden />문의 등록</button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <p className="font-bold">고객센터 안내</p>
              <p className="mt-2 text-2xl font-extrabold text-brand-600">1600-6261</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock size={12} aria-hidden />평일 09:00–18:00 (점심 12:00–13:00) · 공연일 주말 운영</p>
              <Link to="/site/support/faq" className="btn-outline btn-sm mt-4 w-full">자주 묻는 질문 먼저 보기</Link>
            </div>
            {me && (
              <div className="card p-5">
                <SectionTitle>나의 최근 문의</SectionTitle>
                {mine.length === 0 ? <p className="text-sm text-muted">문의 내역이 없습니다.</p> : (
                  <ul className="-mt-2 divide-y divide-line">
                    {mine.slice(0, 5).map(q => (
                      <li key={q.id}>
                        <button className="flex w-full items-start gap-2 py-3 text-left" aria-expanded={openQ === q.id} onClick={() => setOpenQ(openQ === q.id ? null : q.id)}>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5"><span className={cx('chip', STATUS_TONE[q.status])}>{q.status}</span><span className="text-xs text-muted">{q.createdAt.slice(0, 10)}</span></span>
                            <span className="mt-1 block truncate text-sm font-semibold">{q.title}</span>
                          </span>
                          <ChevronDown size={16} aria-hidden className={cx('mt-1 shrink-0 text-muted transition', openQ === q.id && 'rotate-180')} />
                        </button>
                        {openQ === q.id && (
                          <div className="mb-3 space-y-2 text-xs leading-5">
                            <p className="rounded-lg bg-paper p-3 text-ink/80">{q.body}</p>
                            {q.answer
                              ? <p className="rounded-lg bg-brand-50 p-3 text-ink"><b className="text-brand-600">답변</b> ({q.answeredAt})<br />{q.answer}</p>
                              : <p className="text-muted">담당자가 확인 중입니다.</p>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </aside>
        </div>
      </Section>
    </>
  )
}
