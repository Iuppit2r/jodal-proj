import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ACCESS_LOGS, ADMINS } from '../../data/admin'
import { AI_NOTICE, LEVELS, PRACTICE_DISCLAIMER } from '../../data/chat'
import { Badge, Button, Card, inputCls, PageHeader, Table, Td, Toggle, useToast } from './ui'

// 기본 환경설정 · 권한 관리 · 이력 보관 기간 · 백업 · 접근 이력
const SECTIONS = [
  { id: 'notice', label: '안내 문구' },
  { id: 'response', label: '응답 설정' },
  { id: 'data', label: '데이터 보관' },
  { id: 'members', label: '관리자·권한' },
  { id: 'access', label: '접근 이력' },
] as const
type Section = (typeof SECTIONS)[number]['id']

export default function Settings() {
  const [section, setSection] = useState<Section>('notice')
  const [dirty, setDirty] = useState(false)
  const toast = useToast()

  return (
    <>
      <PageHeader title="환경설정·권한" description="챗봇 운영에 필요한 기본 설정과 관리자 권한, 접근 이력을 관리합니다." />

      <div className="grid gap-8 md:grid-cols-[180px_1fr]" onChange={() => setDirty(true)}>
        <nav aria-label="설정 섹션" className="md:sticky md:top-20 md:self-start">
          <ul className="flex gap-1 overflow-x-auto md:flex-col scroll-thin">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSection(s.id)}
                  aria-current={section === s.id ? 'page' : undefined}
                  className={clsx(
                    'w-full rounded-lg px-3 py-1.5 text-left text-sm whitespace-nowrap transition',
                    section === s.id ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                  )}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {section === 'notice' && (
            <Card title="안내 문구" description="챗봇이 상황별로 표시하는 고지·안내 문구입니다.">
              <Rows>
                <Row label="생성형 AI 한계 안내" desc="대화 시작 시 표시">
                  <textarea rows={4} className={`${inputCls} h-auto py-2 leading-relaxed`} defaultValue={AI_NOTICE} />
                </Row>
                <Row label="근거 확인 불가 안내" desc="학습 범위 밖 질문일 때">
                  <textarea rows={2} className={`${inputCls} h-auto py-2 leading-relaxed`} defaultValue="현재 ESG 지식베이스에서 이 질문에 대한 근거 자료를 찾지 못했어요." />
                </Row>
                <Row label="법적 고지" desc="인증·공시 실무 안내 답변에 첨부">
                  <textarea rows={3} className={`${inputCls} h-auto py-2 leading-relaxed`} defaultValue={PRACTICE_DISCLAIMER} />
                </Row>
                <Row label="서비스 범위 안내" desc="서비스 목적과 무관한 질의일 때">
                  <textarea rows={2} className={`${inputCls} h-auto py-2 leading-relaxed`} defaultValue="이 챗봇은 ESG 관련 질문에 답변해요. ESG 기준, 인증·공시 절차, 경인여대의 ESG 활동 등을 물어보세요." />
                </Row>
                <Row label="응답 제한 안내" desc="유해·부적절한 질의일 때">
                  <textarea rows={2} className={`${inputCls} h-auto py-2 leading-relaxed`} defaultValue="이 질문에는 답변할 수 없어요. 도움이 필요하시면 자살예방상담전화 109로 연락하세요." />
                </Row>
              </Rows>
            </Card>
          )}

          {section === 'response' && (
            <Card title="응답 설정" description="응답 수준과 지원 언어입니다.">
              <Rows>
                <Row label="초기 응답 수준" desc="이용자가 수준을 선택하지 않았을 때">
                  <select defaultValue="U3" className={`${inputCls} max-w-56`}>
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </Row>
                <Row label="다국어 질의응답" desc="선택 기능">
                  <Toggle label="사용" />
                </Row>
              </Rows>
            </Card>
          )}

          {section === 'data' && (
            <Card title="데이터 보관" description="질의응답 이력 보관과 백업 정책입니다.">
              <Rows>
                <Row label="이력 보관 기간" desc="기간이 지나면 파기">
                  <select className={`${inputCls} max-w-40`}><option>1년</option><option>2년</option><option>3년</option></select>
                </Row>
                <Row label="백업 주기" desc="지식베이스·운영 데이터">
                  <select className={`${inputCls} max-w-40`}><option>매일</option><option>매주</option></select>
                </Row>
              </Rows>
            </Card>
          )}

          {section === 'members' && (
            <Card
              title="관리자·권한"
              description="권한이 부여된 사용자만 관리자 콘솔에 접근할 수 있습니다."
              flush
              actions={<Button size="sm" onClick={() => toast('관리자 추가 창을 엽니다')}><Plus className="size-3.5" aria-hidden />관리자 추가</Button>}
            >
              <Table head={['이름', '권한', '최근 접속', '']} minWidth={560}>
                {ADMINS.map((a) => (
                  <tr key={a.name} className="hover:bg-zinc-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">{a.name[0]}</span>
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <p className="text-xs text-zinc-500">{a.dept}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><Badge tone={a.role === '최고관리자' ? 'info' : 'neutral'}>{a.role}</Badge></Td>
                    <Td className="text-zinc-500 tabular-nums">{a.last}</Td>
                    <Td className="text-right"><Button size="sm" variant="ghost">권한 변경</Button></Td>
                  </tr>
                ))}
              </Table>
              <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">최고관리자: 전체 · 운영자: 학습자료·최신성·유해 질의 · 검수자: 질의응답 검수·통계</p>
            </Card>
          )}

          {section === 'access' && (
            <Card title="접근 이력" description="관리자 계정의 인증 및 접근 기록입니다." flush>
              <Table head={['일시', '관리자', '내용', 'IP', '결과']} minWidth={640}>
                {ACCESS_LOGS.map((l) => (
                  <tr key={l.at + l.name} className="hover:bg-zinc-50">
                    <Td className="whitespace-nowrap text-zinc-500 tabular-nums">{l.at}</Td>
                    <Td className="font-medium">{l.name}</Td>
                    <Td className="text-zinc-600">{l.event}</Td>
                    <Td className="text-zinc-500 tabular-nums">{l.ip}</Td>
                    <Td>{l.ok ? <Badge dot tone="good">성공</Badge> : <Badge dot tone="bad">실패</Badge>}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>
      </div>

      {dirty && (
        <div className="anim-pop fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white py-2.5 pr-2.5 pl-4 shadow-xl">
          <span className="text-sm text-zinc-600">저장하지 않은 변경사항이 있습니다</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDirty(false)}>취소</Button>
            <Button size="sm" variant="primary" onClick={() => { setDirty(false); toast('설정을 저장했습니다') }}>저장</Button>
          </div>
        </div>
      )}
    </>
  )
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="-my-5 divide-y divide-zinc-100">{children}</div>
}

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
