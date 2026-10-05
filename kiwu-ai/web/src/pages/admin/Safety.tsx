import { Check, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { BANNED, BLOCK_LOGS } from '../../data/admin'
import { Badge, Button, Card, inputCls, PageHeader, Table, Tabs, Td, Toggle, useToast } from './ui'

// 금칙어 목록 관리 + 자동 판별 + 차단 이력
const AUTO_RULES = [
  { name: '욕설·비속어·혐오 표현', action: '차단 후 정제된 안내 문구로 응답' },
  { name: '자해·자살 관련', action: '응답 제한 + 자살예방상담전화(109) 안내' },
  { name: '폭력·불법 행위', action: '응답 제한 + 안내 문구' },
  { name: '서비스 범위 외 질의', action: 'ESG 서비스 범위 안내' },
]
type Tab = 'rules' | 'words' | 'logs'

export default function Safety() {
  const [tab, setTab] = useState<Tab>('rules')
  const [words, setWords] = useState(BANNED)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(null)
  const toast = useToast()

  return (
    <>
      <PageHeader title="유해 질의 차단" description="금칙어 목록과 자동 판별을 병행해 부적절한 질의를 차단하고, 차단·제한 이력을 조회합니다.">
        <Tabs
          label="보기"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'rules', label: '자동 판별 규칙' },
            { value: 'words', label: '금칙어', count: words.length },
            { value: 'logs', label: '차단 이력', count: BLOCK_LOGS.length },
          ]}
        />
      </PageHeader>

      {tab === 'rules' && (
        <Card flush>
          <ul className="divide-y divide-zinc-100">
            {AUTO_RULES.map((r) => (
              <li key={r.name} className="px-5 py-4">
                <Toggle label={r.name} description={r.action} defaultChecked />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'words' && (
        <Card title="금칙어 목록" description="등록된 표현이 포함된 질의는 답변하지 않고 안내 문구로 응답합니다.">
          <form
            className="mb-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              setWords([draft.trim(), ...words])
              toast(`‘${draft.trim()}’을(를) 추가했습니다`)
              setDraft('')
            }}
          >
            <label htmlFor="new-word" className="sr-only">금칙어 추가</label>
            <input id="new-word" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="추가할 금칙어" className={`${inputCls} max-w-sm`} />
            <Button variant="primary" type="submit"><Plus className="size-4" aria-hidden />추가</Button>
          </form>
          <ul className="flex flex-wrap gap-1.5">
            {words.map((w) =>
              editing?.from === w ? (
                <li key={w}>
                  <form
                    className="flex h-7 items-center gap-1 rounded-md border border-zinc-400 bg-white pr-1 pl-2 text-sm"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const next = editing.to.trim()
                      if (next) setWords(words.map((x) => (x === w ? next : x)))
                      setEditing(null)
                      toast('금칙어를 수정했습니다')
                    }}
                  >
                    <input
                      autoFocus
                      aria-label={`${w} 수정`}
                      value={editing.to}
                      onChange={(e) => setEditing({ from: w, to: e.target.value })}
                      className="w-32 bg-transparent outline-none"
                    />
                    <button type="submit" aria-label="수정 저장" className="grid size-5 place-items-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                      <Check className="size-3" />
                    </button>
                    <button type="button" aria-label="수정 취소" onClick={() => setEditing(null)} className="grid size-5 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                      <X className="size-3" />
                    </button>
                  </form>
                </li>
              ) : (
                <li key={w} className="flex h-7 items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 pr-1 pl-2.5 text-sm">
                  <span className="mr-0.5">{w}</span>
                  <button onClick={() => setEditing({ from: w, to: w })} aria-label={`${w} 수정`} className="grid size-5 place-items-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700">
                    <Pencil className="size-3" />
                  </button>
                  <button onClick={() => setWords(words.filter((x) => x !== w))} aria-label={`${w} 삭제`} className="grid size-5 place-items-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700">
                    <X className="size-3" />
                  </button>
                </li>
              ),
            )}
          </ul>
        </Card>
      )}

      {tab === 'logs' && (
        <Card flush>
          <Table head={['일시', '판별 방식', '분류', '조치']} minWidth={600}>
            {BLOCK_LOGS.map((b) => (
              <tr key={b.at} className="hover:bg-zinc-50">
                <Td className="text-zinc-500 tabular-nums">{b.at}</Td>
                <Td><Badge tone={b.rule === '금칙어' ? 'neutral' : 'info'}>{b.rule}</Badge></Td>
                <Td className="font-medium">{b.category}</Td>
                <Td className="text-zinc-600">{b.action}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </>
  )
}
