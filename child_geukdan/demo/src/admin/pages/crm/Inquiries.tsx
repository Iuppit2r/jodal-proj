import { useMemo, useState } from 'react'
import { Inbox, MailCheck, UserCog, Clock, Send, MessageSquareText } from 'lucide-react'
import { nowStr, useStore } from '../../../store'
import { cx } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Field, FilterBar, Kpi, MultiCheck, Note, PiiToggle, Status, Empty, ask, errMsg, usePII, type Col } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { TODAY } from '../../lib'
import type { Inquiry } from '../../../data/types'

const CATS = ['예매', '취소·환불', '회원', '단체관람', 'VOC', '기타'] as const
const STATS = ['접수', '담당자배정', '답변완료'] as const

const TEMPLATES: { label: string; text: (q: Inquiry) => string }[] = [
  { label: '기본 인사', text: q => `안녕하세요, ${q.name}님. 국립어린이청소년극단입니다.\n\n문의하신 「${q.title}」에 대해 안내드립니다.\n\n\n추가 문의는 고객센터(1600-6261, 평일 10:00~18:00)로 연락 주시기 바랍니다. 감사합니다.` },
  { label: '취소·환불 안내', text: q => `안녕하세요, ${q.name}님.\n\n예매 취소는 관람일 기준 10일 전까지 수수료 없이 가능하며, 이후에는 「공연법 시행규칙」에 따른 취소수수료가 부과됩니다. 환불은 결제수단에 따라 3~5영업일 내 처리됩니다.\n\n감사합니다.` },
  { label: '단체관람 안내', text: q => `안녕하세요, ${q.name}님.\n\n20인 이상 단체관람은 단체관람 신청서 제출 후 담당자 확인을 거쳐 좌석이 배정됩니다. 인솔 교사 1인당 1매 초대권이 제공되며, 단체 할인 20%가 적용됩니다.\n\n감사합니다.` },
  { label: 'VOC 접수 확인', text: q => `안녕하세요, ${q.name}님.\n\n소중한 의견 감사드립니다. 말씀하신 내용은 해당 부서에 전달하여 개선 방안을 검토하겠습니다. 조치 결과는 추후 공지사항을 통해 안내드리겠습니다.\n\n감사합니다.` },
  { label: '회원·휴면 안내', text: q => `안녕하세요, ${q.name}님.\n\n휴면 계정은 로그인 화면에서 본인인증(휴대폰) 후 즉시 해제됩니다. 계속 문제가 발생하면 회원 아이디를 알려주시면 확인해 드리겠습니다.\n\n감사합니다.` },
]

interface F { q: string; cat: Inquiry['category'][]; st: Inquiry['status'][] }
const INIT: F = { q: '', cat: [], st: [] }

export default function Inquiries() {
  const inquiries = useStore(s => s.inquiries)
  const { updateInquiry, log, toast } = useStore.getState()
  const admins = useAdminLocal(s => s.adminUsers)
  const pii = usePII()
  const [draft, setDraft] = useState<F>(INIT)
  const [f, setF] = useState<F>(INIT)
  const [sel, setSel] = useState<string | null>(() => inquiries.find(q => q.status !== '답변완료')?.id ?? inquiries[0]?.id ?? null)

  const rows = useMemo(() => inquiries.filter(q =>
    (!f.q || q.title.includes(f.q) || q.body.includes(f.q) || q.name.includes(f.q)) &&
    (!f.cat.length || f.cat.includes(q.category)) && (!f.st.length || f.st.includes(q.status))), [inquiries, f])

  const kpi = useMemo(() => {
    const done = inquiries.filter(q => q.status === '답변완료' && q.answeredAt)
    const hrs = done.map(q => (new Date(q.answeredAt!.replace(' ', 'T')).getTime() - new Date(q.createdAt.replace(' ', 'T')).getTime()) / 36e5)
    return {
      open: inquiries.filter(q => q.status === '접수').length,
      assigned: inquiries.filter(q => q.status === '담당자배정').length,
      today: inquiries.filter(q => q.createdAt.startsWith(TODAY)).length,
      avg: hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : 0,
    }
  }, [inquiries])

  const cur = inquiries.find(q => q.id === sel) ?? null

  const cols: Col<Inquiry>[] = [
    { key: 'createdAt', header: '접수일시', render: q => <span className="tabular-nums text-xs">{q.createdAt}</span>, sort: q => q.createdAt },
    { key: 'category', header: '유형', render: q => <span className={cx('chip', q.category === 'VOC' ? 'bg-orange-50 text-coral-500' : 'bg-paper text-muted')}>{q.category}</span>, sort: q => q.category },
    { key: 'title', header: '제목', render: q => <span className="font-semibold">{q.title}</span>, sort: q => q.title },
    { key: 'name', header: '작성자', render: q => pii.name(q.name) },
    { key: 'assignee', header: '담당자', render: q => q.assignee ?? <span className="text-muted">-</span>, sort: q => q.assignee ?? '' },
    { key: 'status', header: '상태', render: q => <Status s={q.status} />, sort: q => STATS.indexOf(q.status) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="미배정 (접수)" value={`${kpi.open}건`} icon={<Inbox size={18} />} tone="coral" onClick={() => { const n = { ...INIT, st: ['접수'] as Inquiry['status'][] }; setDraft(n); setF(n) }} />
        <Kpi label="처리중 (담당자배정)" value={`${kpi.assigned}건`} icon={<UserCog size={18} />} tone="brand" onClick={() => { const n = { ...INIT, st: ['담당자배정'] as Inquiry['status'][] }; setDraft(n); setF(n) }} />
        <Kpi label="오늘 접수" value={`${kpi.today}건`} icon={<MessageSquareText size={18} />} tone="ink" />
        <Kpi label="평균 답변 소요" value={`${kpi.avg.toFixed(1)}시간`} icon={<Clock size={18} />} tone="mint" sub="목표 24시간 이내" />
      </div>

      <FilterBar onSearch={() => setF(draft)} onReset={() => { setDraft(INIT); setF(INIT) }}>
        <Field label="검색어" hint="제목·내용·작성자"><input className="input" value={draft.q} onChange={e => setDraft({ ...draft, q: e.target.value })} /></Field>
        <Field label="문의 유형" className="sm:col-span-2"><MultiCheck options={CATS} value={draft.cat} onChange={v => setDraft({ ...draft, cat: v })} /></Field>
        <Field label="처리 상태"><MultiCheck options={STATS} value={draft.st} onChange={v => setDraft({ ...draft, st: v })} /></Field>
      </FilterBar>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card title={`VOC · 1:1 문의 (${rows.length}건)`} actions={<><PiiToggle /><ExportButtons filename="1대1문의" count={rows.length}
          getRows={() => [['접수일시', '유형', '제목', '작성자', '이메일', '담당자', '상태', '답변일시'], ...rows.map(q => [q.createdAt, q.category, q.title, pii.name(q.name), pii.email(q.email), q.assignee ?? '', q.status, q.answeredAt ?? ''])]} /></>}>
          <DataTable columns={cols} rows={rows} rowKey={q => q.id} onRowClick={q => setSel(q.id)} dense initialSort={{ key: 'createdAt', dir: 'desc' }}
            rowClass={q => (q.id === sel ? '!bg-brand-50' : q.status === '접수' ? 'font-medium' : undefined)} />
        </Card>
        {cur ? <Detail key={cur.id} q={cur} admins={admins.filter(a => a.active).map(a => a.name)}
          onAssign={name => { updateInquiry(cur.id, { assignee: name, status: cur.status === '답변완료' ? '답변완료' : '담당자배정' }); log('문의 담당자 배정', `${cur.title} → ${name}`); toast(`${name} 담당자로 배정했습니다`) }}
          onAnswer={text => { updateInquiry(cur.id, { answer: text, status: '답변완료', answeredAt: nowStr(), assignee: cur.assignee ?? '관리자' }); log(cur.answer ? '문의 답변 수정' : '문의 답변 등록', cur.title); toast('답변이 등록되어 고객에게 메일로 발송되었습니다') }}
          piiName={pii.name(cur.name)} piiEmail={pii.email(cur.email)} />
          : <Card><Empty text="문의를 선택하세요." /></Card>}
      </div>
    </div>
  )
}

function Detail({ q, admins, onAssign, onAnswer, piiName, piiEmail }: {
  q: Inquiry; admins: string[]; onAssign: (n: string) => void; onAnswer: (t: string) => void; piiName: string; piiEmail: string
}) {
  const [who, setWho] = useState(q.assignee ?? '')
  const [text, setText] = useState(q.answer ?? '')
  const [editing, setEditing] = useState(!q.answer)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (text.trim().length < 10) { setErr(errMsg('E-CM-321', '답변 내용을 10자 이상 입력해 주세요')); return }
    if (q.answer) {
      const r = await ask({ title: '답변 수정', tone: 'warn', confirmText: '수정 발송', message: '이미 발송된 답변을 수정합니다. 수정된 답변이 고객에게 다시 메일로 발송됩니다.' })
      if (r === null) return
    }
    setErr('')
    onAnswer(text.trim())
    setEditing(false)
  }

  return (
    <Card title={<span className="flex items-center gap-2"><Status s={q.status} />{q.title}</span>} sub={`${q.category} · ${q.createdAt} · ${piiName} (${piiEmail})`} className="xl:sticky xl:top-28 xl:self-start">
      <div className="space-y-4">
        <div className="whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm leading-relaxed">{q.body}</div>

        <div>
          <label className="label text-[13px]">담당자 배정</label>
          <div className="flex gap-2">
            <select className="input" value={who} onChange={e => setWho(e.target.value)} aria-label="담당자">
              <option value="">담당자 선택</option>
              {admins.map(a => <option key={a}>{a}</option>)}
            </select>
            <button className="btn-outline btn-sm shrink-0" disabled={!who || who === q.assignee} onClick={() => onAssign(who)}><UserCog size={14} />배정</button>
          </div>
          {q.assignee && <p className="mt-1 text-xs text-muted">현재 담당자: <b>{q.assignee}</b></p>}
        </div>

        {q.answer && !editing ? (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label mb-0 flex items-center gap-1 text-[13px]"><MailCheck size={14} className="text-mint-500" />등록된 답변</span>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}>수정</button>
            </div>
            <div className="whitespace-pre-wrap rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm leading-relaxed">{q.answer}</div>
            <p className="mt-1 text-xs text-muted">{q.answeredAt} 답변 · {q.assignee} · 고객 메일 발송 완료</p>
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="label mb-0 text-[13px]">답변 작성</span>
              <select className="input w-auto py-1 text-xs" defaultValue="" aria-label="답변 템플릿"
                onChange={e => { const t = TEMPLATES.find(x => x.label === e.target.value); if (t) setText(t.text(q)); e.target.value = '' }}>
                <option value="" disabled>템플릿 선택</option>
                {TEMPLATES.map(t => <option key={t.label}>{t.label}</option>)}
              </select>
            </div>
            <textarea className="input min-h-44 leading-relaxed" value={text} onChange={e => { setText(e.target.value); setErr('') }} placeholder="답변 내용을 입력하세요." aria-label="답변 내용" />
            <div className="mt-1 text-right text-[11px] text-muted">{text.length.toLocaleString()}자</div>
            {err && <Note tone="err" className="mt-1">{err}</Note>}
            <div className="mt-2 flex justify-end gap-2">
              {q.answer && <button className="btn-outline btn-sm" onClick={() => { setText(q.answer!); setEditing(false) }}>취소</button>}
              <button className="btn-primary btn-sm" onClick={submit}><Send size={14} />답변 등록 · 메일 발송</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
