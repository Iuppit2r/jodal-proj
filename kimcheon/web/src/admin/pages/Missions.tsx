import { useState } from 'react'
import { Plus } from 'lucide-react'
import { byId, placeById, places, placeTypeLabel } from '../../data'
import { MissionStamp } from '../../components/art'
import { missionStats } from '../data'
import { useAdmin } from '../store'
import { Badge, Btn, HBars, PageHead, Panel, Table, Toggle } from '../ui'

/** 특화 서비스: 관광 연계 미션 · 관광 스탬프 · 인증카드 공유 */
export function Missions() {
  const flash = useAdmin((s) => s.flash)
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(missionStats.map((m) => [m.mission.id, true])))
  const shares = [
    { label: '카카오톡', v: 1284 },
    { label: '인스타그램', v: 862 },
    { label: '이미지 저장', v: 731 },
    { label: '밴드', v: 418 },
    { label: '링크 복사', v: 205 },
  ]

  return (
    <>
      <PageHead
        title="관광 미션 · 스탬프"
        desc="산 인증과 주변 관광지 체크인을 묶은 관광 연계 미션을 관리합니다. 관광지 정보는 김천 문화관광 누리집 데이터를 연계합니다."
        actions={
          <Btn kind="primary" onClick={() => flash('미션 등록 화면 (시연)')}>
            <Plus size={16} /> 미션 등록
          </Btn>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {missionStats.map(({ mission: m, done, inProgress }) => (
          <Panel key={m.id} className="p-5">
            <div className="flex gap-4">
              <MissionStamp mission={m} earned size={78} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[16px] font-extrabold">{m.title}</p>
                  <Toggle
                    on={on[m.id]}
                    onChange={() => {
                      setOn({ ...on, [m.id]: !on[m.id] })
                      flash(`${m.title}: ${on[m.id] ? '앱에서 숨김' : '앱에 표시'}`)
                    }}
                  />
                </div>
                <p className="mt-1 text-[14px] text-sub">배지: {m.badge}</p>
                <p className="mt-1 text-[14px] text-sub">
                  산 {m.peaks.map((id) => byId(id).title).join('·')} 중 {m.need}곳
                </p>
                <p className="text-[14px] text-sub">관광지 {m.spots.map((id) => placeById(id).name).join('·')}</p>
                <div className="mt-3 flex gap-4 text-[14px]">
                  <span>
                    달성 <b className="text-forest">{done}명</b>
                  </span>
                  <span>
                    진행 중 <b>{inProgress}명</b>
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="인증카드 공유 (이번 달)">
          <div className="p-5">
            <HBars data={shares} unit="회" />
            <p className="mt-3 text-[14px] text-sub">공유된 카드 3,500장 · 해시태그 #김천100산 게시물 추적</p>
          </div>
        </Panel>
        <Panel title="연계 관광지 (체크인 반경 200m)">
          <Table
            rows={places}
            rowKey={(p) => p.id}
            cols={[
              { h: '구분', align: 'center', cell: (p) => <Badge>{placeTypeLabel[p.type]}</Badge> },
              { h: '관광지명', cell: (p) => <span className="font-bold">{p.name}</span> },
              { h: '소재지', cell: (p) => p.area.replace('김천시 ', '') },
              { h: '체크인', align: 'right', cell: (p) => `${(p.name.length * 37) % 180 + 20}건` },
            ]}
          />
        </Panel>
      </div>
    </>
  )
}
