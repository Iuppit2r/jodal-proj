import clsx from 'clsx'
import { Ban, FileText, FileUp, Globe, Pencil, Plus, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DOCS, EXCLUDE_REASONS, EXCLUDED_DOCS, type Doc, type DocStatus, type ExcludedDoc, type ExcludeReason } from '../../data/admin'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Drawer,
  Field,
  FilterChip,
  inputCls,
  Modal,
  PageHeader,
  SearchInput,
  Table,
  Tabs,
  Td,
  useToast,
  type Tone,
} from './ui'

// 학습자료 등록·수정·삭제, 메타데이터·버전 관리, 이용 제한 자료 제외 관리
const STATUS_TONE: Record<DocStatus, Tone> = { 반영됨: 'good', '검수 대기': 'warn', '처리 중': 'info', 오류: 'bad' }
const STATUSES: DocStatus[] = ['반영됨', '검수 대기', '처리 중', '오류']
const REASON_DESC: Record<ExcludeReason, string> = {
  '라이선스 제한': '저작권·이용약관상 복제·재배포·기계학습 활용이 제한된 자료',
  '출처 불명': '출처나 발행 주체가 불분명해 공신력을 확인할 수 없는 자료',
  '개인정보 포함': '개인정보 또는 비공개 정보가 포함된 자료',
  '발주기관 요청': '발주기관이 별도로 제외를 요청한 자료',
}
const CATEGORIES = ['국제 공시기준', '국내 공시기준', '보고 표준', '온실가스', '국내 법령', '국내 실무 가이드', '중소기업 자료', '해외 규제', '국제 의제', '본교 자료']
type Tab = '전체' | DocStatus | '제외'

export default function Knowledge() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('전체')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<Doc | null>(null)
  const [excludedDetail, setExcludedDetail] = useState<ExcludedDoc | null>(null)
  const [excluding, setExcluding] = useState<string[] | null>(null) // 제외 처리할 자료 id
  const toast = useToast()
  const uploading = params.get('new') === '1'
  const setUploading = (v: boolean) => setParams(v ? { new: '1' } : {})

  const excludedView = tab === '제외'
  const rows = excludedView ? EXCLUDED_DOCS : tab === '전체' ? DOCS : DOCS.filter((d) => d.status === tab)
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggle = (id: string, v: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (v) next.add(id)
      else next.delete(id)
      return next
    })
  const clear = () => setSelected(new Set())

  return (
    <>
      <PageHeader
        title="학습자료 관리"
        description="지식베이스 자료를 등록·수정·삭제하고 출처·발행기관·발행시점·버전을 관리합니다."
        actions={
          <Button variant="primary" onClick={() => setUploading(true)}>
            <Plus className="size-4" aria-hidden />
            자료 등록
          </Button>
        }
      >
        <Tabs
          label="자료 구분"
          value={tab}
          onChange={(t) => {
            setTab(t)
            clear()
          }}
          items={[
            { value: '전체', label: '전체', count: DOCS.length },
            ...STATUSES.map((s) => ({ value: s, label: s, count: DOCS.filter((d) => d.status === s).length })),
            { value: '제외', label: '제외', count: EXCLUDED_DOCS.length, icon: Ban, separated: true },
          ]}
        />
      </PageHeader>

      {excludedView && (
        <p className="mb-4 flex items-start gap-2.5 rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
          <Ban className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
          학습·활용 대상에서 빠진 자료입니다. 색인하지 않으므로 챗봇 답변과 출처에 사용되지 않습니다.
        </p>
      )}

      <Card flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-5 py-3">
          {selected.size > 0 ? (
            <>
              <span className="text-sm font-medium">{selected.size}개 선택됨</span>
              <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />
              {excludedView ? (
                <Button size="sm" onClick={() => { toast(`${selected.size}건의 제외를 해제했습니다 · 검수 대기`); clear() }}>
                  <RotateCcw className="size-3.5" aria-hidden />제외 해제
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={() => toast(`${selected.size}건 재색인을 요청했습니다`)}>
                    <RefreshCw className="size-3.5" aria-hidden />재색인
                  </Button>
                  <Button size="sm" onClick={() => setExcluding([...selected])}>
                    <Ban className="size-3.5" aria-hidden />제외
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="size-3.5" aria-hidden />삭제
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={clear}>선택 해제</Button>
            </>
          ) : (
            <>
              <SearchInput placeholder="자료명, 발행기관 검색" className="w-full sm:w-64" />
              {excludedView ? (
                <FilterChip label="제외 사유" options={[...EXCLUDE_REASONS]} />
              ) : (
                <>
                  <FilterChip label="분류" options={CATEGORIES} />
                  <FilterChip label="형식" options={['PDF', 'HWP', 'DOC', 'XLSX', '웹문서']} />
                  <FilterChip label="발행기관" options={['ISSB', 'KSSB', 'GRI', 'GHG Protocol', '산업통상자원부', '대한상공회의소', '경인여자대학교']} />
                </>
              )}
            </>
          )}
        </div>

        {excludedView ? (
          <Table
            head={[
              <Checkbox key="all" label="전체 선택" checked={allChecked} onChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())} />,
              '자료',
              '제외 사유',
              '내용',
              '제외일',
              '처리자',
            ]}
            minWidth={860}
          >
            {EXCLUDED_DOCS.map((d) => (
              <tr key={d.id} onClick={() => setExcludedDetail(d)} className={clsx('cursor-pointer transition', selected.has(d.id) ? 'bg-blue-50/40' : 'hover:bg-zinc-50')}>
                <Td className="w-10">
                  <Checkbox label={`${d.title} 선택`} checked={selected.has(d.id)} onChange={(v) => toggle(d.id, v)} />
                </Td>
                <Td><DocTitle doc={d} muted /></Td>
                <Td><Badge>{d.reason}</Badge></Td>
                <Td className="max-w-64 truncate text-zinc-600">{d.note}</Td>
                <Td className="whitespace-nowrap text-zinc-500 tabular-nums">{d.excludedAt}</Td>
                <Td className="whitespace-nowrap text-zinc-600">{d.by}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table
            head={[
              <Checkbox key="all" label="전체 선택" checked={allChecked} onChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())} />,
              '자료',
              '발행기관',
              '버전',
              '발행시점',
              '상태',
              '최종 갱신',
            ]}
            minWidth={860}
          >
            {(rows as Doc[]).map((d) => (
              <tr key={d.id} onClick={() => setDetail(d)} className={clsx('cursor-pointer transition', selected.has(d.id) ? 'bg-blue-50/40' : 'hover:bg-zinc-50')}>
                <Td className="w-10">
                  <Checkbox label={`${d.title} 선택`} checked={selected.has(d.id)} onChange={(v) => toggle(d.id, v)} />
                </Td>
                <Td><DocTitle doc={d} /></Td>
                <Td className="whitespace-nowrap text-zinc-600">{d.publisher}</Td>
                <Td className="text-zinc-600">{d.version}</Td>
                <Td className="text-zinc-600 tabular-nums">{d.publishedAt}</Td>
                <Td><Badge dot tone={STATUS_TONE[d.status]}>{d.status}</Badge></Td>
                <Td className="whitespace-nowrap text-zinc-500 tabular-nums">{d.updatedAt}</Td>
              </tr>
            ))}
          </Table>
        )}

        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
          <span>{rows.length}개 중 1~{rows.length}</span>
          <div className="flex gap-1">
            <Button size="sm" disabled>이전</Button>
            <Button size="sm" disabled>다음</Button>
          </div>
        </div>
      </Card>

      {detail && (
        <DocDrawer
          doc={detail}
          onClose={() => setDetail(null)}
          onExclude={() => {
            setExcluding([detail.id])
            setDetail(null)
          }}
        />
      )}
      {excludedDetail && <ExcludedDrawer doc={excludedDetail} onClose={() => setExcludedDetail(null)} />}
      {excluding && (
        <ExcludeModal
          count={excluding.length}
          onClose={() => setExcluding(null)}
          onDone={(reason) => {
            toast(`${excluding.length}건을 제외했습니다 · ${reason}`)
            setExcluding(null)
            clear()
          }}
        />
      )}
      {uploading && <UploadModal onClose={() => setUploading(false)} onDone={(msg) => { setUploading(false); toast(msg) }} />}
    </>
  )
}

function DocTitle({ doc, muted = false }: { doc: Pick<Doc, 'title' | 'category' | 'format'>; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500">
        {doc.format === '웹문서' ? <Globe className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
      </span>
      <div className="min-w-0">
        <p className={clsx('truncate font-medium', muted ? 'text-zinc-500' : 'text-zinc-900')}>{doc.title}</p>
        <p className="text-xs text-zinc-500">{doc.category} · {doc.format}</p>
      </div>
    </div>
  )
}

function MetaList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-zinc-500">{k}</dt>
          <dd className="text-zinc-900">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function DocDrawer({ doc, onClose, onExclude }: { doc: Doc; onClose: () => void; onExclude: () => void }) {
  const toast = useToast()
  return (
    <Drawer
      title={doc.title}
      description={`${doc.publisher} · ${doc.category}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { toast('자료를 삭제했습니다'); onClose() }}>
            <Trash2 className="size-4" aria-hidden />삭제
          </Button>
          <Button onClick={onExclude}><Ban className="size-4" aria-hidden />제외</Button>
          <Button onClick={() => toast('메타데이터 수정 모드로 전환합니다')}><Pencil className="size-4" aria-hidden />수정</Button>
          <Button variant="primary" onClick={() => toast('새 버전 등록 창을 엽니다')}>새 버전 등록</Button>
        </>
      }
    >
      <MetaList
        items={[
          ['상태', <Badge key="status" dot tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>],
          ['분류', doc.category],
          ['발행기관', doc.publisher],
          ['버전', doc.version],
          ['발행시점', doc.publishedAt],
          ['형식', doc.format],
          ['이용 가능 여부', '확인 완료'],
        ]}
      />

      <h3 className="mt-8 mb-3 text-sm font-semibold">버전 이력</h3>
      <ol className="space-y-3 text-sm">
        {[
          [doc.version, doc.updatedAt, '현재 버전 · 답변에 사용 중', true],
          ['이전 버전', '2026-06-12', '보관 · 답변에 사용 안 함', false],
        ].map(([v, d, note, cur]) => (
          <li key={String(d)} className="flex items-start gap-3">
            <span className={clsx('mt-1.5 size-2 rounded-full', cur ? 'bg-emerald-500' : 'bg-zinc-300')} aria-hidden />
            <div>
              <p className="font-medium">{v} <span className="font-normal text-zinc-400">· {d}</span></p>
              <p className="text-xs text-zinc-500">{note}</p>
            </div>
          </li>
        ))}
      </ol>
    </Drawer>
  )
}

function ExcludedDrawer({ doc, onClose }: { doc: ExcludedDoc; onClose: () => void }) {
  const toast = useToast()
  return (
    <Drawer
      title={doc.title}
      description={`${doc.publisher} · ${doc.category}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { toast('자료를 삭제했습니다'); onClose() }}>
            <Trash2 className="size-4" aria-hidden />삭제
          </Button>
          <Button variant="primary" onClick={() => { toast('제외를 해제했습니다 · 색인 후 검수 대기'); onClose() }}>
            <RotateCcw className="size-4" aria-hidden />제외 해제
          </Button>
        </>
      }
    >
      <div className="mb-6 rounded-xl bg-zinc-100 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-zinc-900">
          <Ban className="size-4 text-zinc-500" aria-hidden />
          {doc.reason}
        </p>
        <p className="mt-1 text-zinc-600">{doc.note}</p>
        <p className="mt-2 text-xs text-zinc-500">{doc.excludedAt} · {doc.by}</p>
      </div>
      <MetaList
        items={[
          ['분류', doc.category],
          ['발행기관', doc.publisher],
          ['버전', doc.version],
          ['발행시점', doc.publishedAt],
          ['형식', doc.format],
        ]}
      />
      <p className="mt-6 text-xs text-zinc-500">제외를 해제하면 색인 후 담당자 검수를 거쳐 답변에 반영됩니다.</p>
    </Drawer>
  )
}

function ReasonPicker({ name }: { name: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-medium text-zinc-800">제외 사유</legend>
      {EXCLUDE_REASONS.map((r, i) => (
        <label key={r} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 p-3 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-50">
          <input type="radio" name={name} value={r} required defaultChecked={i === 0} className="mt-0.5 size-4 accent-zinc-900" />
          <span>
            <span className="font-medium">{r}</span>
            <span className="block text-xs text-zinc-500">{REASON_DESC[r]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

function ExcludeModal({ count, onClose, onDone }: { count: number; onClose: () => void; onDone: (reason: string) => void }) {
  return (
    <Modal
      title={`자료 ${count}건 제외`}
      description="제외한 자료는 색인에서 빠지며 챗봇 답변과 출처에 사용되지 않습니다."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" type="submit" form="exclude-form">제외</Button>
        </>
      }
    >
      <form
        id="exclude-form"
        onSubmit={(e) => {
          e.preventDefault()
          onDone(String(new FormData(e.currentTarget).get('reason')))
        }}
        className="space-y-5"
      >
        <ReasonPicker name="reason" />
        <Field label="내용"><textarea name="note" rows={2} className={`${inputCls} h-auto py-2`} placeholder="제외 판단 근거" /></Field>
      </form>
    </Modal>
  )
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [usage, setUsage] = useState<'use' | 'exclude' | null>(null)
  return (
    <Modal
      title="자료 등록"
      description="활용 대상 자료는 색인 후 담당자 검수를 거쳐 답변에 반영됩니다."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" type="submit" form="upload-form">{usage === 'exclude' ? '제외 자료로 등록' : '등록 후 검수 요청'}</Button>
        </>
      }
    >
      <form
        id="upload-form"
        onSubmit={(e) => {
          e.preventDefault()
          onDone(usage === 'exclude' ? '제외 자료로 등록했습니다' : '자료를 등록했습니다 · 색인 후 검수 대기')
        }}
        className="space-y-5"
      >
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/60 px-6 py-8 text-center transition hover:border-zinc-400 hover:bg-zinc-50">
          <span className="grid size-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm">
            <FileUp className="size-5 text-zinc-600" aria-hidden />
          </span>
          <span className="mt-3 text-sm font-medium"><span className="underline underline-offset-2">파일 선택</span> 또는 끌어다 놓기</span>
          <span className="mt-1 text-xs text-zinc-500">PDF · HWP · DOC · XLSX, 최대 50MB</span>
          <input type="file" multiple accept=".pdf,.hwp,.hwpx,.doc,.docx,.xlsx" className="sr-only" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="자료명"><input className={inputCls} required /></Field></div>
          <Field label="분류">
            <select className={inputCls}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="발행기관"><input className={inputCls} /></Field>
          <Field label="버전"><input className={inputCls} placeholder="예: 2024 개정" /></Field>
          <Field label="발행시점"><input type="month" className={inputCls} /></Field>
          <div className="sm:col-span-2">
            <Field label="원문 URL" hint="웹문서는 URL만 입력해도 수집됩니다."><input type="url" className={inputCls} placeholder="https://" /></Field>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium text-zinc-800">이용 가능 여부</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ['use', '활용 대상', '저작권·이용약관을 확인했고 기계학습 활용이 가능합니다.'],
              ['exclude', '제외 대상', '활용이 제한되거나 부적합해 답변에 쓰지 않습니다.'],
            ] as const).map(([v, t, d]) => (
              <label key={v} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 p-3 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-50">
                <input type="radio" name="usage" value={v} required checked={usage === v} onChange={() => setUsage(v)} className="mt-0.5 size-4 accent-zinc-900" />
                <span>
                  <span className="font-medium">{t}</span>
                  <span className="block text-xs text-zinc-500">{d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {usage === 'exclude' && <ReasonPicker name="reason" />}

        {usage === 'use' && (
          <label className="flex items-start gap-2.5 rounded-lg border border-zinc-200 p-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-zinc-900" />
            <span>
              <span className="font-medium">기존 자료의 새 버전</span>
              <span className="block text-xs text-zinc-500">구 버전은 이력으로 보관되고 답변에는 새 버전만 사용됩니다.</span>
            </span>
          </label>
        )}
      </form>
    </Modal>
  )
}
