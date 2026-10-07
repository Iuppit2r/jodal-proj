import { useId } from 'react'
import { artPalette, fmtDate, zoneById, type Mountain, type Tier } from '../data'

/** 오삼이 – 김천시 공식 SNS 캐릭터 (수도산 반달가슴곰, 김천시 누리집 배포 이미지) */
export type OsamPose = 'basic' | 'hello' | 'best' | 'ok' | 'love' | 'notice' | 'tour' | 'plum' | 'grape'
export const osamSrc = (pose: OsamPose) => `./osam/${pose}.png`

export function Osam({ pose = 'basic', size = 72, className = '' }: { pose?: OsamPose; size?: number; className?: string }) {
  return <img src={osamSrc(pose)} alt="오삼이" style={{ height: size }} className={`w-auto object-contain select-none ${className}`} draggable={false} />
}

/** 사진 없는 봉우리용 산 일러스트 */
export function MountainArt({ m, className = '' }: { m: Mountain; className?: string }) {
  const id = useId()
  if (m.photo) return <img src={`./${m.photo}`} alt={m.title} className={`object-cover ${className}`} />
  const p = artPalette(m.hue)
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={className} aria-label={m.title}>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky0} />
          <stop offset="1" stopColor={p.sky1} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#s${id})`} />
      <circle cx="300" cy="70" r="24" fill={p.sun} />
      <path d="M0 150 L70 95 L120 125 L190 60 L260 120 L320 85 L400 135 V240 H0Z" fill={p.r1} />
      <path d="M0 180 L60 140 L130 170 L200 115 L280 165 L350 130 L400 160 V240 H0Z" fill={p.r2} />
      <path d="M0 215 L90 175 L170 205 L250 170 L330 200 L400 185 V240 H0Z" fill={p.r3} />
    </svg>
  )
}

/** 디지털 스탬프 – 산행여권 도장 */
export function Stamp({ m, date, size = 92, order }: { m: Mountain; date?: string; size?: number; order?: number }) {
  const color = zoneById(m.zone).color
  const id = useId()
  const name = m.title.length > 6 ? m.title.slice(0, 6) : m.title
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-8deg)' }} aria-label={`${m.title} 스탬프`}>
      <defs>
        <path id={`c${id}`} d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
        <filter id={`r${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed={m.no} />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#r${id})`} fill="none" stroke={color}>
        <circle cx="50" cy="50" r="46" strokeWidth="3.2" />
        <circle cx="50" cy="50" r="29" strokeWidth="1.6" />
        <text fill={color} stroke="none" fontSize="9" fontWeight="800" letterSpacing="2.2">
          <textPath href={`#c${id}`} startOffset="2%">
            {`김천 100산 · ${m.no}번 · ${m.height}m ·`}
          </textPath>
        </text>
        <path d="M33 58 L43 44 L49 51 L56 40 L68 58 Z" fill={color} stroke="none" opacity=".9" />
        <text x="50" y="70" textAnchor="middle" fill={color} stroke="none" fontSize={name.length > 4 ? 8.5 : 10} fontWeight="900">
          {name}
        </text>
        {date && (
          <text x="50" y="35" textAnchor="middle" fill={color} stroke="none" fontSize="7.5" fontWeight="800">
            {fmtDate(date).slice(2)}
          </text>
        )}
      </g>
      {order != null && (
        <g>
          <circle cx="84" cy="16" r="12" fill="#C60023" />
          <text x="84" y="20.5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900">
            {order}
          </text>
        </g>
      )}
    </svg>
  )
}

/** 빈 스탬프 칸 */
export function EmptyStamp({ m, size = 92 }: { m: Mountain; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`${m.title} 미인증`}>
      <circle cx="50" cy="50" r="44" fill="#F4F1EA" stroke="#C9C2B4" strokeWidth="2" strokeDasharray="5 5" />
      <text x="50" y="46" textAnchor="middle" fill="#6E6656" fontSize="19" fontWeight="800">
        {String(m.no).padStart(2, '0')}
      </text>
      <text x="50" y="67" textAnchor="middle" fill="#6E6656" fontSize={m.title.length > 4 ? 12 : 14.5} fontWeight="800">
        {m.title.length > 6 ? m.title.slice(0, 6) : m.title}
      </text>
    </svg>
  )
}

/** 단계별 완등 배지 */
export function TierBadge({ t, earned, size = 76 }: { t: Tier; earned: boolean; size?: number }) {
  const c = earned ? t.color : '#C9CCC6'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`${t.name} 배지`}>
      <path d="M50 4 L90 27 V73 L50 96 L10 73 V27 Z" fill={c} />
      <path d="M50 13 L82 31.5 V68.5 L50 87 L18 68.5 V31.5 Z" fill={earned ? '#FFFFFF' : '#F1F0EB'} />
      <path d="M30 66 L42 49 L50 57 L58 45 L72 66 Z" fill={c} />
      <text x="50" y="42" textAnchor="middle" fill={earned ? t.color : '#9AA09B'} fontSize="18" fontWeight="900">
        {t.count}
      </text>
      {earned && <circle cx="80" cy="20" r="9" fill="#E0A93B" stroke="#fff" strokeWidth="3" />}
    </svg>
  )
}

/** 권역·미션 배지 (원형 메달) */
export function Medal({ color, label, earned, size = 64, icon }: { color: string; label: string; earned: boolean; size?: number; icon?: 'ridge' | 'spot' }) {
  const c = earned ? color : '#C9CCC6'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={label}>
      <circle cx="50" cy="50" r="46" fill={c} />
      <circle cx="50" cy="50" r="38" fill={earned ? '#fff' : '#F1F0EB'} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3 4" />
      {icon === 'spot' ? (
        <path d="M50 24 c-10 0 -17 7 -17 17 c0 13 17 30 17 30 s17 -17 17 -30 c0 -10 -7 -17 -17 -17z M50 34 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14z" fill={c} fillRule="evenodd" />
      ) : (
        <path d="M24 66 L40 40 L50 52 L60 34 L78 66 Z" fill={c} />
      )}
    </svg>
  )
}

// ── 관광 미션 스탬프 ───────────────────────────────────────
// 우표 모양(톱니 테두리) + 관광지 그림 + 배지 이름. 미획득은 회색 점선 빈칸.
type Picto = 'temple' | 'queen' | 'bridge' | 'pond' | 'pork' | 'crown'
const MISSION_PICTO: Record<string, Picto> = {
  'm-jikji': 'temple',
  'm-queen': 'queen',
  'm-samdo': 'bridge',
  'm-city': 'pond',
  'm-jirye': 'pork',
  'm-gammun': 'crown',
}

function Pictogram({ kind, c }: { kind: Picto; c: string }) {
  // 60×46 영역 안의 선 그림
  const st = { fill: 'none', stroke: c, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'temple':
      return (
        <g>
          <path d="M6 18 Q30 2 54 18" {...st} />
          <path d="M10 18 H50" {...st} />
          <path d="M14 24 Q30 14 46 24" {...st} />
          <path d="M18 24 V40 M42 24 V40 M30 24 V40" {...st} />
          <path d="M8 42 H52" {...st} />
        </g>
      )
    case 'queen':
      return (
        <g>
          <path d="M4 40 L20 16 L30 28 L40 10 L56 40 Z" {...st} />
          <path d="M14 30 Q22 34 30 30 T46 30" {...st} />
          <circle cx="47" cy="10" r="3.5" fill={c} />
        </g>
      )
    case 'bridge':
      return (
        <g>
          <path d="M4 26 Q30 40 56 26" {...st} />
          <path d="M10 10 V36 M50 10 V36" {...st} />
          <path d="M10 12 Q30 30 50 12" {...st} />
          <path d="M20 21 V30 M30 24 V33 M40 21 V30" {...st} strokeWidth={2} />
          <path d="M2 42 Q10 38 18 42 T34 42 T50 42 T58 42" {...st} strokeWidth={2.4} />
        </g>
      )
    case 'pond':
      return (
        <g>
          <path d="M14 16 L30 6 L46 16 Z" {...st} />
          <path d="M18 16 V28 M42 16 V28 M14 28 H46" {...st} />
          <path d="M4 36 Q12 32 20 36 T36 36 T52 36" {...st} strokeWidth={2.4} />
          <path d="M10 43 Q18 39 26 43 T42 43 T56 43" {...st} strokeWidth={2.4} />
          <circle cx="8" cy="10" r="2.5" fill={c} />
          <circle cx="53" cy="8" r="2.5" fill={c} />
        </g>
      )
    case 'pork':
      return (
        <g>
          <path d="M8 30 H52" {...st} />
          <path d="M10 30 Q10 42 30 42 Q50 42 50 30" {...st} />
          <path d="M18 22 Q22 16 18 10 M30 22 Q34 16 30 10 M42 22 Q46 16 42 10" {...st} strokeWidth={2.4} />
          <path d="M16 36 H44" {...st} strokeWidth={2} />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M8 38 L6 12 L20 24 L30 6 L40 24 L54 12 L52 38 Z" {...st} />
          <path d="M8 38 H52" {...st} />
          <circle cx="30" cy="30" r="3" fill={c} />
        </g>
      )
  }
}

export function MissionStamp({ mission, earned, size = 72, date }: { mission: { id: string; color: string; badge: string; stamp: string }; earned: boolean; size?: number; date?: string }) {
  const id = useId()
  const c = earned ? mission.color : '#B9BDB7'
  const picto = MISSION_PICTO[mission.id] ?? 'temple'
  // 톱니 구멍 좌표 (100×120 우표)
  const holes: [number, number][] = []
  for (let x = 6; x <= 94; x += 11) holes.push([x, 0], [x, 120])
  for (let y = 6; y <= 114; y += 11) holes.push([0, y], [100, y])
  const label = mission.stamp
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" aria-label={`${mission.stamp} 관광 스탬프`} style={{ transform: earned ? 'rotate(-4deg)' : undefined, filter: earned ? 'drop-shadow(0 2px 4px rgba(28,32,29,.18))' : undefined, overflow: 'visible' }}>
      <defs>
        <mask id={`k${id}`}>
          <rect width="100" height="120" fill="#fff" />
          {holes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#k${id})`}>
        <rect width="100" height="120" fill={earned ? '#FFFDF8' : '#F1F0EB'} />
        <rect x="8" y="8" width="84" height="104" rx="4" fill={earned ? c : 'none'} opacity={earned ? 0.1 : 1} />
        <rect x="8" y="8" width="84" height="104" rx="4" fill="none" stroke={c} strokeWidth="2" strokeDasharray={earned ? undefined : '4 4'} />
      </g>
      <text x="50" y="25" textAnchor="middle" fill={c} fontSize="9" fontWeight="800">
        김천 관광
      </text>
      <g transform="translate(20 32)">
        <Pictogram kind={picto} c={c} />
      </g>
      <text x="50" y={date ? 92 : 98} textAnchor="middle" fill={earned ? '#1C201D' : '#8A8F89'} fontSize={label.length > 4 ? 13 : 15} fontWeight="900">
        {label}
      </text>
      {date && (
        <text x="50" y="105" textAnchor="middle" fill={c} fontSize="8.5" fontWeight="800">
          {fmtDate(date).slice(2)}
        </text>
      )}
    </svg>
  )
}
