import { useState } from 'react'
import { Lock, Pencil, Plus, Unlock } from 'lucide-react'
import { notices } from '../../data'
import { accessLogs, admins as initialAdmins, dailyVisitors, guestbook, hourly, osShare } from '../data'
import { useAdmin } from '../store'
import { Badge, Btn, HBars, Line, PageHead, Panel, Stat, Table, Toggle, VBars } from '../ui'

// ── 게시판 관리 (SFR-002 통합게시판, SFR-008) ─────────────────
export function Boards() {
  const flash = useAdmin((s) => s.flash)
  const [tab, setTab] = useState<'notice' | 'guest'>('notice')
  const [hidden, setHidden] = useState<Record<number, boolean>>(Object.fromEntries(guestbook.map((g) => [g.no, g.hidden])))
  return (
    <>
      <PageHead

        title="게시판 관리"
        desc="공지사항과 방명록(본인인증 후 작성)을 관리합니다. 필독 공지, 공개 여부, 금칙어를 설정할 수 있습니다."
        actions={
          <Btn kind="primary" onClick={() => flash('글쓰기 편집기 (시연)')}>
            <Plus size={16} /> 공지 등록
          </Btn>
        }
      />
      <Panel>
        <div className="flex gap-1 border-b border-line px-5 pt-3">
          {(
            [
              ['notice', `공지사항 ${notices.length}`],
              ['guest', `방명록 ${guestbook.length}`],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`h-10 border-b-[3px] px-3 text-[15px] font-bold ${tab === k ? 'border-brand text-brand' : 'border-transparent text-sub'}`}>
              {l}
            </button>
          ))}
        </div>
        {tab === 'notice' ? (
          <Table
            rows={notices}
            rowKey={(n) => n.id}
            startNo={notices.length}
            cols={[
              { h: '분류', align: 'center', cell: (n) => <Badge tone={n.tag === '안전' ? 'accent' : 'brand'}>{n.tag}</Badge> },
              { h: '제목', cell: (n) => <span className="font-semibold">{n.title}</span> },
              { h: '필독', align: 'center', cell: (n) => (n.pinned ? <Badge tone="gold">필독</Badge> : '-') },
              { h: '조회', align: 'right', cell: (n) => n.views.toLocaleString() },
              { h: '등록일', cell: (n) => n.date },
              {
                h: '관리',
                align: 'center',
                cell: () => (
                  <Btn kind="ghost" onClick={() => flash('수정 화면 (시연)')}>
                    <Pencil size={15} /> 수정
                  </Btn>
                ),
              },
            ]}
          />
        ) : (
          <Table
            rows={guestbook}
            rowKey={(g) => String(g.no)}
            startNo={guestbook.length}
            cols={[
              { h: '산', cell: (g) => g.mountain },
              { h: '제목', cell: (g) => <span className="font-semibold">{g.title}</span> },
              { h: '작성자', cell: (g) => `${g.author} (본인인증)` },
              { h: '작성일', cell: (g) => g.date.replaceAll('-', '.') },
              {
                h: '공개',
                align: 'center',
                cell: (g) => (
                  <div className="flex items-center justify-center gap-2">
                    <Toggle on={!hidden[g.no]} onChange={() => setHidden({ ...hidden, [g.no]: !hidden[g.no] })} />
                    <span className={`w-12 text-left font-semibold ${hidden[g.no] ? 'text-sub' : 'text-forest'}`}>{hidden[g.no] ? '숨김' : '공개'}</span>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </>
  )
}

// ── 관리자 · 권한 관리 (SFR-002) ─────────────────────────
export function Admins() {
  const flash = useAdmin((s) => s.flash)
  const [list, setList] = useState(initialAdmins)
  const groups = [
    { name: '최고관리자', perms: '전체 메뉴 · 관리자 계정 관리' },
    { name: '완등인증 담당', perms: '회차 · 코스 · 인증현황 · 물품 · 지급 · 통계' },
    { name: '관광정보 담당', perms: '관광 미션 · 관광지 · 게시판' },
    { name: '시스템 관리', perms: '접속 이력 · 웹로그 · 접속 주소 제한' },
    { name: '유지보수', perms: '조회 전용 (개인정보 마스킹)' },
  ]
  return (
    <>
      <PageHead

        title="관리자 · 권한"
        desc="관리자 등록, 계정 잠금, 비밀번호 변경, 담당 메뉴와 권한 그룹, 접속 주소 제한을 관리합니다."
        actions={
          <Btn kind="primary" onClick={() => flash('관리자 등록 화면 (시연)')}>
            <Plus size={16} /> 관리자 등록
          </Btn>
        }
      />
      <Panel title="관리자 계정">
        <Table
          rows={list}
          rowKey={(a) => a.id}
          cols={[
            { h: '아이디', cell: (a) => <span className="font-bold">{a.id}</span> },
            { h: '이름', cell: (a) => a.name },
            { h: '부서', cell: (a) => a.dept },
            { h: '권한 그룹', cell: (a) => <Badge tone="brand">{a.group}</Badge> },
            { h: '허용 접속 주소', cell: (a) => a.ip },
            { h: '최근 접속', cell: (a) => a.last },
            { h: '상태', align: 'center', cell: (a) => (a.locked ? <Badge tone="accent">잠김</Badge> : <Badge tone="green">정상</Badge>) },
            {
              h: '관리',
              align: 'center',
              cell: (a) => (
                <div className="flex justify-center gap-1">
                  <Btn
                    kind="ghost"
                    onClick={() => {
                      setList(list.map((x) => (x.id === a.id ? { ...x, locked: !x.locked } : x)))
                      flash(a.locked ? '계정 잠금을 해제했습니다' : '계정을 잠갔습니다')
                    }}
                  >
                    {a.locked ? <Unlock size={15} /> : <Lock size={15} />} {a.locked ? '잠금 해제' : '잠금'}
                  </Btn>
                  <Btn kind="ghost" onClick={() => flash('임시 비밀번호를 발송했습니다')}>
                    비밀번호 초기화
                  </Btn>
                </div>
              ),
            },
          ]}
        />
      </Panel>
      <Panel className="mt-4" title="권한 그룹">
        <Table
          rows={groups}
          rowKey={(g) => g.name}
          cols={[
            { h: '그룹명', cell: (g) => <span className="font-bold">{g.name}</span> },
            { h: '담당 메뉴 · 권한', cell: (g) => g.perms },
            { h: '소속 관리자', align: 'right', cell: (g) => `${list.filter((a) => a.group === g.name).length}명` },
          ]}
        />
      </Panel>
    </>
  )
}

// ── 접속 · 작업 이력 (SFR-002 접속로그, 작업이력) ─────────────
export function Logs() {
  const downloads = useAdmin((s) => s.downloads)
  const [tab, setTab] = useState<'access' | 'download'>('access')
  return (
    <>
      <PageHead title="접속 · 작업 이력" desc="관리자별 접속·작업 기록과 개인정보 내려받기 이력입니다. 개인정보 처리 이력은 3년간 보관합니다." />
      <Panel>
        <div className="flex gap-1 border-b border-line px-5 pt-3">
          {(
            [
              ['access', `접속 · 작업 ${accessLogs.length}`],
              ['download', `개인정보 내려받기 ${downloads.length}`],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`h-10 border-b-[3px] px-3 text-[15px] font-bold ${tab === k ? 'border-brand text-brand' : 'border-transparent text-sub'}`}>
              {l}
            </button>
          ))}
        </div>
        {tab === 'access' ? (
          <Table
            rows={accessLogs}
            rowKey={(l) => String(l.no)}
            startNo={accessLogs.length}
            cols={[
              { h: '일시', cell: (l) => l.at },
              { h: '아이디', cell: (l) => <span className="font-bold">{l.id}</span> },
              { h: '이름', cell: (l) => l.name },
              { h: '작업', cell: (l) => (l.act.includes('내려받기') || l.act.includes('조회') ? <Badge tone="gold">{l.act}</Badge> : l.act) },
              { h: '접속 주소', cell: (l) => l.ip },
            ]}
          />
        ) : (
          <Table
            rows={downloads}
            rowKey={(d) => String(d.no)}
            startNo={downloads.length}
            cols={[
              { h: '일시', cell: (d) => d.at },
              { h: '관리자', cell: (d) => <span className="font-bold">{d.who}</span> },
              { h: '자료', cell: (d) => d.menu },
              { h: '건수', align: 'right', cell: (d) => `${d.rows.toLocaleString()}건` },
              { h: '사유', cell: (d) => <Badge tone="brand">{d.reason}</Badge> },
              { h: '상세 사유', cell: (d) => d.detail },
            ]}
          />
        )}
      </Panel>
    </>
  )
}

// ── 웹로그 분석 (SFR-003) ───────────────────────────────
export function WebLog() {
  const total = dailyVisitors.reduce((s, d) => s + d.v, 0)
  const menus = [
    { label: '홈', v: 18420 },
    { label: '김천 100산', v: 12976 },
    { label: '정상 인증', v: 9310 },
    { label: '산행여권', v: 8044 },
    { label: '관광미션', v: 5212 },
    { label: '인증카드', v: 3830 },
    { label: '공지사항', v: 1906 },
  ]
  return (
    <>
      <PageHead title="웹로그 분석" desc="앱 방문자 수를 일·주·월·연 단위와 요일·시간대·운영체제·메뉴별로 확인합니다." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="최근 30일 방문" value={`${total.toLocaleString()}명`} />
        <Stat label="일 평균" value={`${Math.round(total / 30).toLocaleString()}명`} />
        <Stat label="주말 평균" value={`${Math.round(dailyVisitors.filter((_, i) => [0, 6].includes(new Date(2026, 8, 7 + i).getDay())).reduce((s, d) => s + d.v, 0) / 8).toLocaleString()}명`} sub="평일의 약 2배" />
        <Stat label="올해 누적" value="214,380명" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="일별 방문자">
          <div className="p-5">
            <Line data={dailyVisitors.map((d) => ({ label: d.date, v: d.v }))} />
          </div>
        </Panel>
        <Panel title="시간대별 방문 비율">
          <div className="p-5">
            <VBars data={hourly.map((v, i) => ({ label: `${i}시`, v }))} unit="%" />
            <p className="mt-3 text-[14px] text-sub">오전 6~8시 산행 출발 시간대에 가장 많이 접속합니다.</p>
          </div>
        </Panel>
        <Panel title="운영체제별 방문">
          <div className="p-5">
            <HBars data={osShare.map((o) => ({ label: o.name, v: o.v }))} unit="%" max={100} />
          </div>
        </Panel>
        <Panel title="메뉴별 방문 (최근 30일)">
          <div className="p-5">
            <HBars data={menus} unit="회" />
          </div>
        </Panel>
      </div>
    </>
  )
}
