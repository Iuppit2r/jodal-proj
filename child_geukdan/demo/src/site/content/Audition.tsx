import { useCallback, useState, type FormEvent } from 'react'
import { CalendarDays, CheckCircle2, ChevronDown, FileUp, Send, Users } from 'lucide-react'
import PageHeader from '../PageHeader'
import Modal from '../../components/Modal'
import { auditions } from '../../data/mock'
import type { Audition as Au } from '../../data/types'
import { useMe, useStore } from '../../store'
import { cx } from '../../lib/format'
import { NEWS_TABS } from './Notices'
import { FilterTabs, Section } from './ui'

const STATUS_TONE: Record<Au['status'], string> = {
  접수중: 'bg-mint-500 text-white',
  접수예정: 'bg-sun-400 text-ink',
  마감: 'bg-gray-200 text-gray-600',
  결과발표: 'bg-brand-600 text-white',
}
const FILTERS = ['전체', '접수중', '접수예정', '결과발표', '마감'] as const
const STEPS = ['서류 접수', '1차 서류심사', '2차 실기', '최종 발표']

export default function Audition() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체')
  const [openId, setOpenId] = useState<string | null>('au1')
  const [applyTo, setApplyTo] = useState<Au | null>(null)
  const [applied, setApplied] = useState<string[]>([])
  const toast = useStore(s => s.toast)
  const list = auditions.filter(a => filter === '전체' || a.status === filter)
  const close = useCallback(() => setApplyTo(null), [])

  return (
    <>
      <PageHeader crumbs={['소식', '오디션·모집']} title="오디션·모집" desc="국립어린이청소년극단과 함께할 배우, 창작자, 청소년 자문단을 모집합니다." tabs={NEWS_TABS} />
      <Section>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs label="모집 상태" items={FILTERS} value={filter} onChange={setFilter} />
          <p className="text-sm text-muted">총 <b className="text-brand-600">{list.length}</b>건</p>
        </div>
        <ul className="space-y-3">
          {list.length === 0 && <li className="rounded-2xl bg-paper p-10 text-center text-sm text-muted">해당 상태의 모집 공고가 없습니다.</li>}
          {list.map(a => {
            const open = openId === a.id
            const done = applied.includes(a.id)
            return (
              <li key={a.id} className={cx('card overflow-hidden transition', open && 'border-brand-200 shadow-md')}>
                <h2>
                  <button className="flex w-full items-start gap-3 p-5 text-left sm:items-center" aria-expanded={open} aria-controls={`au-${a.id}`} onClick={() => setOpenId(open ? null : a.id)}>
                    <span className={cx('chip shrink-0', STATUS_TONE[a.status])}>{a.status}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold sm:text-lg">{a.title}</span>
                      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden />{a.period}</span>
                        <span className="inline-flex items-center gap-1"><Users size={13} aria-hidden />{a.target}</span>
                      </span>
                    </span>
                    <ChevronDown size={20} aria-hidden className={cx('shrink-0 text-muted transition', open && 'rotate-180')} />
                  </button>
                </h2>
                {open && (
                  <div id={`au-${a.id}`} className="border-t border-line bg-paper/50 p-5">
                    <dl className="grid gap-3 text-sm sm:grid-cols-[100px_1fr]">
                      <dt className="font-semibold text-muted">접수기간</dt><dd>{a.period}</dd>
                      <dt className="font-semibold text-muted">지원자격</dt><dd>{a.target}</dd>
                      <dt className="font-semibold text-muted">세부내용</dt><dd className="leading-7">{a.body}</dd>
                      <dt className="font-semibold text-muted">제출서류</dt><dd>지원서 1부, 프로필(사진 포함) 1부, 경력증명 자료 (PDF·HWP·DOCX, 10MB 이하)</dd>
                      <dt className="font-semibold text-muted">문의</dt><dd>공연기획팀 02-3279-2201 · audition@ntcy.or.kr</dd>
                    </dl>
                    <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="전형 절차">
                      {STEPS.map((s, i) => (
                        <li key={s} className="rounded-xl bg-white p-3 text-center text-xs ring-1 ring-line">
                          <span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{i + 1}</span>{s}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {a.status === '접수중' && (done
                        ? <span className="btn bg-mint-400/20 text-[#0c6b55]"><CheckCircle2 size={16} aria-hidden />지원 완료</span>
                        : <button className="btn-primary" onClick={() => setApplyTo(a)}><Send size={16} aria-hidden />지원하기</button>)}
                      {a.status === '접수예정' && <button className="btn-outline" onClick={() => toast('접수 시작 시 알림을 보내드릴게요.')}>접수 시작 알림 받기</button>}
                      {a.status === '결과발표' && <button className="btn-outline" onClick={() => toast('합격자 발표 공지로 이동합니다. (시연)')}>결과 확인</button>}
                      <button className="btn-ghost" onClick={() => toast('모집요강.hwp 다운로드를 시작합니다.')}>모집요강 다운로드</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Section>

      <Modal open={!!applyTo} onClose={close} title={applyTo ? `지원서 작성 · ${applyTo.title}` : ''} size="lg">
        {applyTo && <ApplyForm au={applyTo} onDone={() => { setApplied(x => [...x, applyTo.id]); setApplyTo(null) }} />}
      </Modal>
    </>
  )
}

const OK_EXT = ['pdf', 'hwp', 'docx']
function ApplyForm({ au, onDone }: { au: Au; onDone: () => void }) {
  const me = useMe()
  const toast = useStore(s => s.toast)
  const sendSms = useStore(s => s.sendSms)
  const [f, setF] = useState({ name: me?.name ?? '', phone: me?.phone ?? '', email: me?.email ?? '', birth: me?.birth ?? '', career: '', agree: false })
  const [file, setFile] = useState<File | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string | boolean) => setF(p => ({ ...p, [k]: v }))

  const onFile = (fl: File | undefined) => {
    setFile(null)
    if (!fl) return
    const ext = fl.name.split('.').pop()?.toLowerCase() ?? ''
    if (!OK_EXT.includes(ext)) { setErrs(e => ({ ...e, file: `허용되지 않는 파일 형식입니다 (.${ext}). PDF, HWP, DOCX 파일만 첨부할 수 있습니다.` })); return }
    if (fl.size > 10 * 1024 * 1024) { setErrs(e => ({ ...e, file: `파일 용량이 ${(fl.size / 1024 / 1024).toFixed(1)}MB입니다. 10MB 이하 파일만 첨부할 수 있습니다.` })); return }
    setErrs(e => { const { file: _, ...r } = e; void _; return r })
    setFile(fl)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.name.trim().length < 2) er.name = '이름을 입력해주세요.'
    if (!/^01\d-?\d{3,4}-?\d{4}$/.test(f.phone)) er.phone = '휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = '이메일 형식이 올바르지 않습니다.'
    if (!f.birth) er.birth = '생년월일을 입력해주세요.'
    if (f.career.trim().length < 10) er.career = '주요 경력을 10자 이상 입력해주세요.'
    if (!file) er.file = errs.file ?? '지원서 파일을 첨부해주세요.'
    if (!f.agree) er.agree = '개인정보 수집·이용에 동의해주세요.'
    setErrs(er)
    if (Object.keys(er).length) {
      document.getElementById(`ap-${Object.keys(er)[0]}`)?.focus()
      return
    }
    const no = 'AU' + String(Math.floor(Math.random() * 9000) + 1000)
    sendSms(f.phone, `[국립어린이청소년극단] ${f.name}님, 「${au.title}」 지원서가 정상 접수되었습니다. 접수번호 ${no}. 서류 결과는 개별 안내드립니다.`)
    toast(`지원서가 접수되었습니다. (접수번호 ${no}) 접수 확인 문자가 발송되었습니다.`)
    onDone()
  }

  const field = (k: 'name' | 'phone' | 'email' | 'birth', label: string, type = 'text', ph = '') => (
    <div>
      <label htmlFor={`ap-${k}`} className="label">{label} <span className="text-coral-500" aria-hidden>*</span></label>
      <input id={`ap-${k}`} type={type} className="input" placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)} required aria-required
        aria-invalid={!!errs[k]} aria-describedby={errs[k] ? `ap-${k}-err` : undefined} />
      {errs[k] && <p id={`ap-${k}-err`} className="mt-1 text-xs text-coral-500">{errs[k]}</p>}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">접수기간 {au.period} · <span className="text-coral-500">*</span> 표시는 필수 입력 항목입니다.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', '이름', 'text', '홍길동')}
        {field('birth', '생년월일', 'date')}
        {field('phone', '휴대폰 번호', 'tel', '010-0000-0000')}
        {field('email', '이메일', 'email', 'name@example.com')}
      </div>
      <div>
        <label htmlFor="ap-career" className="label">주요 경력 <span className="text-coral-500" aria-hidden>*</span></label>
        <textarea id="ap-career" rows={4} className="input resize-y" maxLength={1000} placeholder="출연작, 교육 이력, 특기(노래·악기·움직임 등)를 적어주세요." value={f.career}
          onChange={e => set('career', e.target.value)} aria-invalid={!!errs.career} aria-describedby={errs.career ? 'ap-career-err' : 'ap-career-cnt'} />
        <div className="mt-1 flex justify-between text-xs">
          <span id="ap-career-err" className="text-coral-500">{errs.career}</span>
          <span id="ap-career-cnt" className="text-muted">{f.career.length} / 1000</span>
        </div>
      </div>
      <div>
        <label htmlFor="ap-file" className="label">지원서·프로필 첨부 <span className="text-coral-500" aria-hidden>*</span></label>
        <label htmlFor="ap-file" className={cx('flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-5 text-center text-sm transition hover:border-brand-500',
          errs.file ? 'border-coral-500 bg-coral-400/5' : file ? 'border-mint-500 bg-mint-400/10' : 'border-line')}>
          <FileUp size={24} aria-hidden className="text-muted" />
          {file ? <span className="font-semibold text-ink">{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</span> : <span className="font-semibold">파일 선택</span>}
          <span className="text-xs text-muted">PDF, HWP, DOCX · 최대 10MB</span>
        </label>
        <input id="ap-file" type="file" accept=".pdf,.hwp,.docx" className="sr-only" onChange={e => onFile(e.target.files?.[0])}
          aria-invalid={!!errs.file} aria-describedby={errs.file ? 'ap-file-err' : undefined} />
        {errs.file && <p id="ap-file-err" role="alert" className="mt-1 text-xs text-coral-500">{errs.file}</p>}
      </div>
      <div className="rounded-xl border border-line p-4 text-xs leading-6 text-muted">
        <p className="font-bold text-ink">개인정보 수집·이용 동의</p>
        수집항목: 이름, 생년월일, 연락처, 이메일, 경력 / 이용목적: 오디션 전형 진행 및 결과 안내 / 보유기간: 전형 종료 후 1년 (이후 즉시 파기)
        <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <input id="ap-agree" type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.agree} onChange={e => set('agree', e.target.checked)} aria-invalid={!!errs.agree} />
          위 내용에 동의합니다. (필수)
        </label>
        {errs.agree && <p className="mt-1 text-coral-500">{errs.agree}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-primary w-full sm:w-auto"><Send size={16} aria-hidden />지원서 제출</button>
      </div>
    </form>
  )
}
