// 제안서 도식 프롬프트("플랫폼 데이터 흐름도") 기반 재현 페이지
// 이미지 없이 인라인 SVG 도형만 사용. 좌표 단위는 pt(960×540)
import type { ReactNode } from 'react'

const NAVY = '#04539a'
const NAVY_DEEP = '#0b4c8c'
const NAVY_LINE = '#1d4f8a'
const PILL = '#cddbea'
const BOX_BLUE = '#6f9fe5'
const PANEL = '#efefef'
const GRAY_LINE = '#a6a6a6'
const INK = '#141414'

/** 글자 폭 추정(pt). 한글은 거의 정사각, 라틴·숫자·기호는 좁게 */
function estimate(text: string, size: number) {
  let w = 0
  for (const ch of text) {
    if (/[가-힣]/.test(ch)) w += 0.92
    else if (ch === ' ') w += 0.27
    else if (/[A-Z]/.test(ch)) w += 0.64
    else if (/[a-z0-9]/.test(ch)) w += 0.55
    else w += 0.38
  }
  return w * size
}

type TextProps = {
  x: number
  y: number
  size: number
  weight?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
  /** 허용 최대 폭(pt). 추정 폭이 넘치면 textLength로 맞춤 */
  fit?: number
  children: string
}

function T({ x, y, size, weight = 400, fill = INK, anchor = 'middle', fit, children }: TextProps) {
  const over = fit !== undefined && estimate(children, size) > fit
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} dominantBaseline="central" textLength={over ? fit : undefined} lengthAdjust={over ? 'spacingAndGlyphs' : undefined}>
      {children}
    </text>
  )
}

function Lines({ cx, cy, lines, size, lh, weight = 400, fill = INK, fit }: { cx: number; cy: number; lines: string[]; size: number; lh: number; weight?: number; fill?: string; fit?: number }) {
  const top = cy - ((lines.length - 1) * lh) / 2
  return (
    <>
      {lines.map((l, i) => (
        <T key={i} x={cx} y={top + i * lh} size={size} weight={weight} fill={fill} fit={fit}>
          {l}
        </T>
      ))}
    </>
  )
}

/** 제목 + 양옆 네이비 세로 막대 */
function SectionTitle({ cx, y, text, gap }: { cx: number; y: number; text: string; gap: number }) {
  return (
    <g>
      <rect x={cx - gap - 1.6} y={y - 8.5} width={1.6} height={17} fill={NAVY} />
      <rect x={cx + gap} y={y - 8.5} width={1.6} height={17} fill={NAVY} />
      <T x={cx} y={y} size={15} weight={700}>
        {text}
      </T>
    </g>
  )
}

/** fieldset legend 형태 박스: 제목이 윗선에 걸침 */
function LegendBox({ x, y, w, h, title, size = 13 }: { x: number; y: number; w: number; h: number; title: string; size?: number }) {
  const cx = x + w / 2
  const tw = estimate(title, size)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={GRAY_LINE} strokeWidth={0.8} />
      <rect x={cx - tw / 2 - 4} y={y - 3} width={tw + 8} height={6} fill={PANEL} />
      <T x={cx} y={y} size={size} weight={700}>
        {title}
      </T>
    </g>
  )
}

function Bullets({ x, y, gap, items, size, fit }: { x: number; y: number; gap: number; items: string[]; size: number; fit: number }) {
  return (
    <>
      {items.map((t, i) => (
        <g key={t}>
          <circle cx={x - 4.5} cy={y + i * gap} r={1.1} fill={INK} />
          <T x={x} y={y + i * gap} size={size} anchor="start" fit={fit}>
            {t}
          </T>
        </g>
      ))}
    </>
  )
}

/** 흰 둥근 타일 + 오른쪽 아래 회색 그림자 */
function Tile({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children: ReactNode }) {
  return (
    <g>
      <rect x={x + 2.5} y={y + 2.5} width={w} height={h} rx={4} fill="#cfcfcf" />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#fff" />
      {children}
    </g>
  )
}

/** 지도 핀. (px,py)가 뾰족한 끝 */
function Pin({ px, py, r, fill }: { px: number; py: number; r: number; fill: string }) {
  const cy = py - r * 1.8
  return (
    <g>
      <path d={`M${px},${py} C${px - r * 0.35},${py - r * 0.6} ${px - r},${cy + r * 0.55} ${px - r},${cy} A${r},${r} 0 1 1 ${px + r},${cy} C${px + r},${cy + r * 0.55} ${px + r * 0.35},${py - r * 0.6} ${px},${py} Z`} fill={fill} />
      <circle cx={px} cy={cy} r={r * 0.4} fill="#fff" />
    </g>
  )
}

function PhoneIcon({ cx, cy }: { cx: number; cy: number }) {
  const x = cx - 8
  const y = cy - 15
  return (
    <g>
      <rect x={x} y={y} width={16} height={30} rx={2.6} fill={NAVY_LINE} />
      <rect x={x + 1.6} y={y + 3.5} width={12.8} height={21.5} rx={0.8} fill="#eaf1f8" />
      <path d={`M${x + 1.6},${y + 16} L${x + 7},${y + 11} L${x + 14.4},${y + 18}`} fill="none" stroke="#b9c9dc" strokeWidth={1} />
      <circle cx={cx} cy={y + 27.4} r={1} fill="#eaf1f8" />
      <Pin px={cx + 5} py={cy + 3} r={4.6} fill="#e0633a" />
    </g>
  )
}

function BuildingIcon({ cx, cy }: { cx: number; cy: number }) {
  const l = cx - 15
  const top = cy - 14
  const cols = [0, 1, 2, 3].map((i) => l + 3 + i * 7.3)
  return (
    <g fill={NAVY_LINE}>
      <polygon points={`${l},${top + 8} ${cx},${top} ${cx + 15},${top + 8}`} />
      <rect x={l} y={top + 9} width={30} height={2.6} />
      {cols.map((c) => (
        <rect key={c} x={c} y={top + 13} width={2.8} height={11} />
      ))}
      <rect x={l - 1} y={top + 25.2} width={32} height={2.4} />
      <rect x={l - 3} y={top + 28.4} width={36} height={2.4} />
    </g>
  )
}

function Gear({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g fill="#f08a24">
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={cx - r * 0.28} y={cy - r * 1.35} width={r * 0.56} height={r * 0.7} rx={0.4} transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={r * 0.42} fill="#eaf1f8" />
    </g>
  )
}

function LaptopIcon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x + 8} y={y} width={48} height={34} rx={2.5} fill={NAVY_LINE} />
      <rect x={x + 11} y={y + 3} width={42} height={27} fill="#eaf1f8" />
      <path d={`M${x + 20},${y + 20} h14 a4,4 0 0 0 0,-8 a6,6 0 0 0 -11,-1.5 a4.5,4.5 0 0 0 -3,9.5 Z`} fill="#b9c9dc" />
      <Gear cx={x + 42} cy={y + 20} r={4} />
      <polygon points={`${x},${y + 36} ${x + 64},${y + 36} ${x + 60},${y + 42} ${x + 4},${y + 42}`} fill="#9aa5ba" />
      <rect x={x + 26} y={y + 36} width={12} height={1.6} fill="#7d889c" />
    </g>
  )
}

/** 가짜 기관 로고: 단순 도형 마크 + 텍스트 */
function Logo({ x, y, mark, name, w }: { x: number; y: number; mark: 'circle' | 'square' | 'diamond'; name: string; w: number }) {
  const m = { cx: x + 8, cy: y + 10 }
  return (
    <g>
      {mark === 'circle' && <circle cx={m.cx} cy={m.cy} r={7.5} fill={NAVY} />}
      {mark === 'square' && <rect x={m.cx - 7} y={m.cy - 7} width={14} height={14} rx={2.5} fill="#2f8fcf" />}
      {mark === 'diamond' && <rect x={m.cx - 5.5} y={m.cy - 5.5} width={11} height={11} fill="#5a6b86" transform={`rotate(45 ${m.cx} ${m.cy})`} />}
      <T x={x + 20} y={m.cy} size={11} weight={800} fill="#2b3a55" anchor="start" fit={w - 20}>
        {name}
      </T>
    </g>
  )
}

/** 기둥 안 흰 DB 원통. segs = 아래 칸 구분선 y */
function Cyl({ x, y, w, h, ry = 5, segs = [] }: { x: number; y: number; w: number; h: number; ry?: number; segs?: number[] }) {
  const rx = w / 2
  const b = y + h
  return (
    <g stroke="#8c8c8c" strokeWidth={0.6} fill="#fff">
      <path d={`M${x},${y} L${x},${b} A${rx},${ry} 0 0 0 ${x + w},${b} L${x + w},${y}`} />
      {segs.map((s) => (
        <path key={s} d={`M${x},${s} A${rx},${ry} 0 0 0 ${x + w},${s}`} fill="none" />
      ))}
      <ellipse cx={x + rx} cy={y} rx={rx} ry={ry} />
    </g>
  )
}

/** 원통 앞면 밴드: 위·아래 모두 아래로 볼록한 반타원 */
function band(x0: number, x1: number, top: number, bottom: number, ry: number) {
  const rx = (x1 - x0) / 2
  return `M${x0},${top} A${rx},${ry} 0 0 0 ${x1},${top} L${x1},${bottom} A${rx},${ry} 0 0 1 ${x0},${bottom} Z`
}

const PIL_L = 188
const PIL_R = 257
const PIL_CX = (PIL_L + PIL_R) / 2
const BAN_TIP = 931

function PillarRing({ y0, y1 }: { y0: number; y1: number }) {
  return (
    <g>
      <path d={band(PIL_L, PIL_R, y0, y1, 9)} fill="#6e9bc2" opacity={0.85} />
      <path d={band(PIL_L + 9, PIL_R - 9, y0 + 2, y1 + 2, 6.5)} fill="#c4d5e6" opacity={0.9} />
    </g>
  )
}

function Banner({ y0, y1, label }: { y0: number; y1: number; label: string }) {
  const mid = (y0 + y1) / 2
  const h = y1 - y0
  return (
    <g>
      <polygon points={`${PIL_R},${y0} ${BAN_TIP - h * 0.55},${y0} ${BAN_TIP},${mid} ${BAN_TIP - h * 0.55},${y1} ${PIL_R},${y1}`} fill={NAVY} />
      <T x={(PIL_R + BAN_TIP) / 2} y={mid} size={12.5} weight={700} fill="#fff">
        {label}
      </T>
    </g>
  )
}

/** 저장소 원통 (On/Off-chain) */
function Store({ x, y, label, dark }: { x: number; y: number; label: string; dark: boolean }) {
  const w = 69
  const h = 20
  const ry = 3.2
  const rx = w / 2
  return (
    <g>
      <path d={`M${x},${y} L${x},${y + h} A${rx},${ry} 0 0 0 ${x + w},${y + h} L${x + w},${y} Z`} fill={dark ? 'url(#p2-storeDark)' : 'url(#p2-storeLight)'} />
      <ellipse cx={x + rx} cy={y} rx={rx} ry={ry} fill={dark ? '#dde2ea' : '#eef0f4'} stroke={dark ? '#a3adbf' : '#c3c9d4'} strokeWidth={0.5} />
      <T x={x + rx} y={y + h / 2 + 1.5} size={9} fit={w - 8}>
        {label}
      </T>
    </g>
  )
}

const META_ROWS = [
  { badge: ['이용자', '정보'], lines: ['DID, 사용자 고유 식별자,', '사용자 인증 이력 해시값 등'] },
  { badge: ['방문', '인증', '정보'], lines: ['방문 위치, QR 코드 식별값,', '방문 시간, 인증 방식 등'] },
  { badge: ['배지', '발급', '조건'], lines: ['해당 배지 ID, 배지 발급 시점,', '배지 관련 콘텐츠 링크 등'] },
  { badge: ['시스템', '운영'], lines: ['인증 기록 해시값, 검증 로그,', '인증 서버 응답시간 등'] },
]

const MODULES = [
  ['역할 및', '규칙관리'],
  ['QR코드', '생성'],
  ['정보흐름', '프로세스'],
  ['스탬프투어', '디지털배지', '발급∙검증'],
  ['신원 및', '접근 관리'],
  ['외부 시스템', '연계'],
  ['데이터 형식/', '데이터 모델'],
]

const STEPS = [
  { lines: ['데이터', '매핑'], size: 12, lh: 13.5 },
  { lines: ['메타데이터', '생성'], size: 12, lh: 13.5 },
  { lines: ['블록체인', '해시값', '생성'], size: 11.5, lh: 13 },
  { lines: ['DID기반', '스탬프투어', '디지털배지', '발급'], size: 10.5, lh: 11.5 },
]

const PREP = [
  ['데이터', '통합수집'],
  ['JSON 스키마로', '정형화'],
  ['정합성 검증', '및 저장'],
]

const STORES = [
  { title: 'On-chain 저장소', sub: '블록체인 기반 신뢰 저장 영역', cells: ['데이터 해시값', '고유식별자', '타임스탬프', 'DID 정보'], dark: true },
  { title: 'Off-chain 저장소', sub: '방문데이터 저장∙관리 영역', cells: ['방문이력', '부속 메타데이터', '첨부문서', '등록 및 변경 로그'], dark: false },
]

// 가로 띠 3개 (y0, y1)
const BANDS = [
  { y0: 206.5, y1: 223, label: '스탬프투어 디지털배지 시스템' },
  { y0: 301, y1: 318, label: '저장/처리 영역' },
  { y0: 464, y1: 481, label: 'BlockChain 인프라' },
]

function Slide() {
  const modX0 = 326
  const modW = 75
  const modPitch = (923 - modX0 - modW) / 6
  const stepCx0 = 586
  const stepPitch = 96
  const stepCy = 260
  const prepW = 68
  const prepX0 = 276
  const prepPitch = (507 - prepX0 - prepW) / 2

  return (
    <svg viewBox="0 0 960 540" width="100%" height="100%" style={{ fontFamily: "Pretendard, 'Pretendard Variable', 'Noto Sans KR', sans-serif", display: 'block' }} role="img" aria-label="플랫폼 구축 전략 – 플랫폼 데이터 흐름도">
      <defs>
        <linearGradient id="p2-storeDark" x1="0" x2="1">
          <stop offset="0" stopColor="#97a3b8" />
          <stop offset="0.5" stopColor="#c8cfdb" />
          <stop offset="1" stopColor="#97a3b8" />
        </linearGradient>
        <linearGradient id="p2-storeLight" x1="0" x2="1">
          <stop offset="0" stopColor="#c3cad6" />
          <stop offset="0.5" stopColor="#e6e9ee" />
          <stop offset="1" stopColor="#c3cad6" />
        </linearGradient>
        <linearGradient id="p2-curve" gradientUnits="userSpaceOnUse" x1="163" y1="0" x2="220" y2="0">
          <stop offset="0" stopColor="#d6d6d6" />
          <stop offset="1" stopColor="#7c7c7c" />
        </linearGradient>
        <linearGradient id="p2-step" x1="0" x2="1">
          <stop offset="0" stopColor="#e2e2e2" />
          <stop offset="1" stopColor="#a8a8a8" />
        </linearGradient>
        <linearGradient id="p2-chev" x1="0" x2="1">
          <stop offset="0" stopColor="#dcdcdc" />
          <stop offset="1" stopColor="#8f8f8f" />
        </linearGradient>
        <linearGradient id="p2-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d6d6d" />
          <stop offset="1" stopColor="#6d6d6d" stopOpacity={0.15} />
        </linearGradient>
        <marker id="p2-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={NAVY_LINE} />
        </marker>
        <marker id="p2-curveHead" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="#7c7c7c" />
        </marker>
        <filter id="p2-soft" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0.8" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width={960} height={540} fill="#fff" />

      {/* ── 1. 헤더 ── */}
      <T x={27} y={54} size={54} weight={900} fill={NAVY} anchor="start">
        01
      </T>
      <T x={106} y={40} size={12} fill="#555" anchor="start">
        지역 상권 활성화를 위한 디지털배지 기반 스탬프투어 플랫폼
      </T>
      <T x={105} y={69} size={25} weight={800} anchor="start" fit={420}>
        플랫폼 구축 전략 – 플랫폼 데이터 흐름도
      </T>
      <Logo x={622} y={66} mark="circle" name="○○진흥원" w={90} />
      <Logo x={722} y={66} mark="square" name="△△테크노파크" w={112} />
      <Logo x={842} y={66} mark="diamond" name="□□랩" w={90} />
      <line x1={0} y1={95.5} x2={960} y2={95.5} stroke="#c4c4c4" strokeWidth={0.9} />

      {/* ── 2. 본문 패널 ── */}
      <rect x={27} y={120} width={161} height={405} fill={PANEL} />
      <rect x={PIL_R} y={120} width={933 - PIL_R} height={386} fill={PANEL} />

      {/* ── 2-2. 가운데 기둥 ── */}
      <g>
        <rect x={PIL_L} y={120.5} width={PIL_R - PIL_L} height={406.5} fill="#d9d9d9" />
        <ellipse cx={PIL_CX} cy={527} rx={34.5} ry={9} fill="#c9c9c9" />
        <ellipse cx={PIL_CX} cy={120.5} rx={34.5} ry={9} fill="#d9d9d9" stroke="#c6c6c6" strokeWidth={0.6} />
        <rect x={PIL_L + 9} y={126} width={PIL_R - PIL_L - 18} height={398} fill="#ececec" />
        <ellipse cx={PIL_CX} cy={126} rx={25.5} ry={6.5} fill="#e6e6e6" />
        <ellipse cx={PIL_CX} cy={524} rx={25.5} ry={6.5} fill="#ececec" />
        {BANDS.map((b) => (
          <PillarRing key={b.y0} y0={b.y0} y1={b.y1} />
        ))}
      </g>

      <Cyl x={199} y={150} w={47} h={33} />
      <Lines cx={PIL_CX} cy={172} lines={['데이터', '수집']} size={11.5} lh={12.5} weight={700} />

      <Cyl x={199} y={240} w={47} h={138} segs={[299, 318.5, 338, 358]} />
      <Lines cx={PIL_CX} cy={272} lines={['디지털배지', '시스템']} size={11} lh={12.5} weight={700} fit={43} />
      {['표준화', '매핑', '저장', '처리'].map((t, i) => (
        <T key={t} x={PIL_CX} y={312 + i * 19.5} size={9.5}>
          {t}
        </T>
      ))}

      <Cyl x={199} y={406} w={47} h={100} segs={[467.5, 487.5]} />
      <Lines cx={PIL_CX} cy={437} lines={['블록체인', '시스템']} size={11.5} lh={12.5} weight={700} fit={43} />
      <T x={PIL_CX} y={481} size={9.5}>온체인</T>
      <T x={PIL_CX} y={501} size={9.5}>오프체인</T>

      {/* ── 2-1. 왼쪽 열: 스탬프투어 ── */}
      <SectionTitle cx={107.5} y={137.5} text="스탬프투어" gap={50} />
      <g>
        <path d="M163,139 C186,139 198,90 215,106" fill="none" stroke="url(#p2-curve)" strokeWidth={5.5} strokeLinecap="round" markerEnd="url(#p2-curveHead)" />
      </g>

      <LegendBox x={34} y={163.5} w={146} h={71} title="사용자 서비스" />
      <Tile x={40} y={177} w={42} h={46}>
        <PhoneIcon cx={60} cy={200} />
      </Tile>
      <Bullets x={93} y={184} gap={12.3} size={8.6} fit={84} items={['신원인증(DID)', '방문이력 데이터 등록', '디지털배지 발급 요청', '디지털배지 이력 조회']} />

      <LegendBox x={34} y={247.5} w={146} h={71} title="관리자 서비스" />
      <Tile x={40} y={261} w={42} h={46}>
        <BuildingIcon cx={61} cy={283} />
      </Tile>
      <Bullets x={93} y={268} gap={12.3} size={8.6} fit={84} items={['계정 및 권한 관리', '방문이력 데이터 관리', '디지털배지발급현황조회', '시스템 연계 관리']} />

      {/* 메타정보 저장 */}
      <g fill="none" stroke="url(#p2-roof)" strokeWidth={2.2} strokeLinejoin="round">
        <polyline points="82,333 108,320 134,333" />
        <polyline points="86,337 108,326 130,337" opacity={0.65} />
        <polyline points="90,341 108,332 126,341" opacity={0.4} />
      </g>
      <T x={107.5} y={350} size={13} weight={700}>메타정보 저장</T>
      {[1, 2, 3].map((i) => (
        <line key={i} x1={34} y1={371 + i * 43.5 - 21.75} x2={180} y2={371 + i * 43.5 - 21.75} stroke={GRAY_LINE} strokeWidth={0.6} />
      ))}
      {META_ROWS.map((r, i) => {
        const cy = 377 + i * 43.5
        return (
          <g key={i}>
            <circle cx={54} cy={cy} r={18.5} fill={NAVY_DEEP} />
            <Lines cx={54} cy={cy} lines={r.badge} size={9} lh={9.5} weight={700} fill="#fff" fit={30} />
            <circle cx={81} cy={cy - 7.5} r={1.1} fill={INK} />
            <T x={85} y={cy - 7.5} size={8.6} anchor="start" fit={93}>{r.lines[0]}</T>
            <T x={85} y={cy + 6.5} size={8.6} anchor="start" fit={93}>{r.lines[1]}</T>
          </g>
        )
      })}

      {/* ── 2-3. 오른쪽 영역 ── */}
      <SectionTitle cx={595} y={138} text="블록체인 기반 스탬프투어 디지털배지 플랫폼" gap={146} />

      {/* (a) 서비스 모듈 */}
      <rect x={264} y={155.5} width={45} height={42.5} fill="#f6f6f6" stroke={GRAY_LINE} strokeWidth={0.8} />
      <Lines cx={286.5} cy={177} lines={['서비스', '모듈']} size={12} lh={13} weight={700} fit={38} />
      <polygon points="310,172.5 316,172.5 316,168 323,177 316,186 316,181.5 310,181.5" fill={GRAY_LINE} />
      {MODULES.map((m, i) => {
        const x = modX0 + i * modPitch
        return (
          <g key={i}>
            <rect x={x} y={155.5} width={modW} height={42.5} fill="#fff" stroke={BOX_BLUE} strokeWidth={1.1} />
            <Lines cx={x + modW / 2} cy={177} lines={m} size={m.length > 2 ? 11 : 12} lh={m.length > 2 ? 12 : 13.5} weight={500} fit={modW - 8} />
          </g>
        )
      })}

      {/* (b)(d)(f) 네이비 가로 띠 */}
      {BANDS.map((b) => (
        <Banner key={b.y0} {...b} />
      ))}

      {/* (c) 도구 → 처리 단계 */}
      <LaptopIcon x={272} y={238} />
      {[
        { y: 247.5, label: '데이터 정합성 검증 도구' },
        { y: 275.5, label: '디지털배지 발급∙검증 도구' },
      ].map((p) => (
        <g key={p.y}>
          <path d={`M337,${p.y > 260 ? 266 : 256} L345,${p.y} L355,${p.y}`} fill="none" stroke={NAVY_LINE} strokeWidth={1.2} strokeDasharray="1.4 1.8" />
          <rect x={355.5} y={p.y - 10} width={176} height={20} rx={10} fill={PILL} stroke={NAVY_LINE} strokeWidth={1.1} />
          <T x={443.5} y={p.y} size={11.5} weight={700} fit={160}>{p.label}</T>
          <line x1={533} y1={p.y} x2={stepCx0 - 34} y2={p.y + (stepCy - p.y) * 0.35} stroke={NAVY_LINE} strokeWidth={1.2} strokeDasharray="1.4 1.8" markerEnd="url(#p2-arrow)" />
        </g>
      ))}
      {STEPS.map((s, i) => {
        const cx = stepCx0 + i * stepPitch
        return (
          <g key={i}>
            <circle cx={cx + 3} cy={stepCy + 3} r={31} fill="#c9c9c9" />
            <circle cx={cx} cy={stepCy} r={31} fill="#fff" stroke={NAVY_LINE} strokeWidth={1.2} />
            <Lines cx={cx} cy={stepCy} lines={s.lines} size={s.size} lh={s.lh} weight={700} fit={48} />
            {i < STEPS.length - 1 && (
              <g stroke="#9db3d6" strokeWidth={3} strokeLinecap="round">
                <line x1={cx + stepPitch / 2 - 6} y1={stepCy} x2={cx + stepPitch / 2 + 6} y2={stepCy} />
                <line x1={cx + stepPitch / 2} y1={stepCy - 6} x2={cx + stepPitch / 2} y2={stepCy + 6} />
              </g>
            )}
          </g>
        )
      })}

      {/* (e) 방문이력 데이터 전처리 */}
      <LegendBox x={264} y={335} w={251} h={114} title="방문이력 데이터 전처리" />
      {PREP.map((lines, i) => {
        const x = prepX0 + i * prepPitch
        return (
          <g key={i}>
            <rect x={x} y={344} width={prepW} height={39} rx={19.5} fill="#fff" stroke={GRAY_LINE} strokeWidth={0.8} />
            <Lines cx={x + prepW / 2} cy={363.5} lines={lines} size={10.5} lh={12} fit={prepW - 10} />
            {i < PREP.length - 1 && (() => {
              const a = x + prepW + 1.5
              const b = x + prepPitch - 1.5
              return <polygon points={`${a},360 ${b - 5},360 ${b - 5},356 ${b},363.5 ${b - 5},371 ${b - 5},367 ${a},367`} fill="url(#p2-step)" />
            })()}
          </g>
        )
      })}
      {['반정형 데이터 : 필드 파싱 및 정리, 표준 스키마에 맞춰 정형화', '비정형 데이터 : 원본 저장 및 관련 메타데이터 추출 후 인덱싱'].map((t, i) => (
        <g key={t}>
          <rect x={276} y={393 + i * 27.5} width={231} height={20.5} fill="#f7f7f7" stroke="#b5b5b5" strokeWidth={0.7} />
          <T x={391.5} y={403.25 + i * 27.5} size={9.8} fit={220}>{t}</T>
        </g>
      ))}

      {/* 겹꺾쇠 >> */}
      <g fill="url(#p2-chev)">
        <polygon points="516,356 522,356 530,372 522,388 516,388 524,372" />
        <polygon points="524,356 530,356 538,372 530,388 524,388 532,372" opacity={0.75} />
      </g>

      {/* 데이터 저장 플랫폼 */}
      <LegendBox x={540} y={335} w={379} h={114} title="데이터 저장 플랫폼" />
      <line x1={729.5} y1={346} x2={729.5} y2={442} stroke="#c2c2c2" strokeWidth={0.7} />
      {STORES.map((s, i) => {
        const x = 552 + i * 189.5
        const cx = x + 74.5
        return (
          <g key={s.title}>
            <rect x={x} y={347} width={149} height={21} rx={10.5} fill="#fff" stroke={NAVY_LINE} strokeWidth={1.1} filter="url(#p2-soft)" />
            <T x={cx} y={357.5} size={12} weight={700} fit={135}>{s.title}</T>
            <T x={cx} y={378} size={10} fill="#333" fit={145}>{s.sub}</T>
            {s.cells.map((c, j) => (
              <Store key={c} x={x + 2.5 + (j % 2) * 75} y={393 + Math.floor(j / 2) * 25} label={c} dark={s.dark} />
            ))}
          </g>
        )
      })}

      {/* ── 3. 페이지 번호 ── */}
      <T x={940} y={522} size={11} weight={500} fill="#555">12</T>
    </svg>
  )
}

export default function PdfTest2() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-200 p-4">
      <div className="w-full max-w-[1440px] bg-white shadow-lg" style={{ aspectRatio: '960 / 540' }}>
        <Slide />
      </div>
    </main>
  )
}
