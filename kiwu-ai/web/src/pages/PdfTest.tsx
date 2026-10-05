// 발표자료 PDF(12p "플랫폼 데이터 흐름도") 재현 페이지
// 좌표는 원본 PDF의 pt 단위(960×540)를 그대로 사용
import type { ReactNode } from 'react'

const A = '/pdf-test'
const NAVY = '#04539a'
const NAVY_LINE = '#1d4f8a'
const PANEL = '#efefef'
const GRAY_LINE = '#a6a6a6'
const BOX_BLUE = '#6f9fe5'
const INK = '#141414'

type TextProps = {
  x: number
  y: number
  size: number
  weight?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
  /** 원본 PDF 텍스트 폭(pt). 지정 시 폭을 강제로 맞춤 */
  w?: number
  children: ReactNode
}

function T({ x, y, size, weight = 500, fill = INK, anchor = 'middle', w, children }: TextProps) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} dominantBaseline="central" textLength={w} lengthAdjust={w ? 'spacingAndGlyphs' : undefined}>
      {children}
    </text>
  )
}

/** 여러 줄 가운데 정렬 텍스트 (cy 기준) */
function Lines({ cx, cy, lines, size, lh, weight = 500, fill = INK, ws }: { cx: number; cy: number; lines: string[]; size: number; lh: number; weight?: number; fill?: string; ws?: number[] }) {
  const top = cy - ((lines.length - 1) * lh) / 2
  return (
    <>
      {lines.map((l, i) => (
        <T key={i} x={cx} y={top + i * lh} size={size} weight={weight} fill={fill} w={ws?.[i]}>
          {l}
        </T>
      ))}
    </>
  )
}

/** 원통 앞면 밴드: 위/아래 모두 아래쪽 반타원 */
function band(x0: number, x1: number, top: number, bottom: number, ry: number) {
  const rx = (x1 - x0) / 2
  return `M${x0},${top} A${rx},${ry} 0 0 0 ${x1},${top} L${x1},${bottom} A${rx},${ry} 0 0 1 ${x0},${bottom} Z`
}

/** 흰색 원통(기둥 안 DB 아이콘). segs = 아래쪽 분할선 y 목록 */
function Cyl({ x, y, w, h, ry = 5, segs = [] }: { x: number; y: number; w: number; h: number; ry?: number; segs?: number[] }) {
  const rx = w / 2
  const cx = x + rx
  const bottom = y + h
  return (
    <g stroke="#8c8c8c" strokeWidth={0.6} fill="#fff">
      <path d={`M${x},${y} L${x},${bottom} A${rx},${ry} 0 0 0 ${x + w},${bottom} L${x + w},${y}`} />
      {segs.map((s) => (
        <path key={s} d={`M${x},${s} A${rx},${ry} 0 0 0 ${x + w},${s}`} fill="none" />
      ))}
      <ellipse cx={cx} cy={y} rx={rx} ry={ry} />
    </g>
  )
}

/** 저장소 원통 (On/Off-chain) */
function Store({ x, y, w, label, lw, dark }: { x: number; y: number; w: number; label: string; lw: number; dark: boolean }) {
  const h = 21
  const ry = 3.2
  const rx = w / 2
  const grad = dark ? 'url(#storeDark)' : 'url(#storeLight)'
  return (
    <g>
      <path d={`M${x},${y} L${x},${y + h} A${rx},${ry} 0 0 0 ${x + w},${y + h} L${x + w},${y} Z`} fill={grad} />
      <ellipse cx={x + rx} cy={y} rx={rx} ry={ry} fill={dark ? '#dfe3ea' : '#e8ebf0'} />
      <rect x={x + 10} y={y + 2} width={w - 20} height={h - 3} fill={dark ? '#e3e7ee' : '#eceef2'} opacity={0.9} />
      <T x={x + rx} y={y + h / 2 + 1} size={10.5} weight={400} w={lw}>
        {label}
      </T>
    </g>
  )
}

function Banner({ y0, y1, label, tx }: { y0: number; y1: number; label: string; tx: number }) {
  const mid = (y0 + y1) / 2
  return (
    <g>
      <polygon points={`257,${y0} 916,${y0} 925,${mid} 916,${y1} 257,${y1}`} fill={NAVY} />
      <T x={tx} y={mid} size={13} weight={700} fill="#fff">
        {label}
      </T>
    </g>
  )
}

function PillarBand({ top, bottom }: { top: number; bottom: number }) {
  return (
    <g>
      <path d={band(188, 257, top, bottom, 9)} fill="#6e9bc2" />
      <path d={band(197, 247, top + 1.5, bottom + 1.5, 6.5)} fill="#c4d5e6" />
    </g>
  )
}

/** 섹션 테두리 박스 + 테두리 위에 얹힌 제목 */
function LegendBox({ x, y, w, h, title, tx, tw }: { x: number; y: number; w: number; h: number; title: string; tx: number; tw: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={GRAY_LINE} strokeWidth={0.8} />
      <rect x={tx - tw / 2 - 3} y={y - 4} width={tw + 6} height={8} fill={PANEL} />
      <T x={tx} y={y} size={13} weight={700} w={tw}>
        {title}
      </T>
    </g>
  )
}

function Bullets({ x, ys, items, size = 9, ws }: { x: number; ys: number[]; items: string[]; size?: number; ws?: number[] }) {
  return (
    <>
      {items.map((t, i) => (
        <g key={t}>
          <T x={x - 5} y={ys[i]} size={size} anchor="middle" weight={400}>
            •
          </T>
          <T x={x} y={ys[i]} size={size} anchor="start" weight={400} w={ws?.[i]}>
            {t}
          </T>
        </g>
      ))}
    </>
  )
}

function Tile({ y, h, src, iw, ih }: { y: number; h: number; src: string; iw: number; ih: number }) {
  const x = 42
  const w = 44
  return (
    <g>
      <rect x={x + 3} y={y + 3} width={w} height={h} rx={4} fill="#cfcfcf" />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#fff" />
      <image href={`${A}/${src}`} x={x + (w - iw) / 2} y={y + (h - ih) / 2} width={iw} height={ih} />
    </g>
  )
}

const META_ROWS = [
  { cy: 372, badge: ['이용자', '정보'], lines: ['DID, 사용자 고유 식별자, 사용자', '인증 이력 해시값 등'], ly: [363.5, 378], ws: [92, 56] },
  { cy: 416, badge: ['방문', '인증', '정보'], lines: ['방문 위치, QR 코드 식별값,', '방문 시간, 인증 방식 등'], ly: [408.5, 423], ws: [77, 66] },
  { cy: 459, badge: ['배지', '발급', '조건'], lines: ['해당 배지 ID, 배지 발급 시점,', '배지 관련 콘텐츠 링크 등'], ly: [454.5, 469], ws: [82, 70] },
  { cy: 502, badge: ['시스템', '운영'], lines: ['인증 기록 해시값, 검증 로그,', '인증 서버 응답시간 등'], ly: [497, 511.5], ws: [80, 63] },
]

const MODULES = [
  { lines: ['역할 및', '규칙관리'], ws: [32, 38] },
  { lines: ['QR코드', '생성'], ws: [35, 19] },
  { lines: ['정보흐름', '프로세스'], ws: [39, 39] },
  { lines: ['스탬프투어', '디지털배지', '발급∙검증'], ws: [48, 48, 41] },
  { lines: ['신원 및', '접근 관리'], ws: [32, 42] },
  { lines: ['외부 시스템', '연계'], ws: [51, 19] },
  { lines: ['데이터 형식/', '데이터 모델'], ws: [56, 51] },
]

const STEPS = [
  { cx: 586.5, lines: ['데이터', '매핑'], ws: [29, 19] },
  { cx: 682.5, lines: ['메타데이터', '생성'], ws: [44, 19] },
  { cx: 778.5, lines: ['블록체인', '해시값', '생성'], ws: [38, 29, 19] },
  { cx: 874.5, lines: ['DID기반', '스탬프투어', '디지털배지', '발급'], ws: [38, 45, 45, 19] },
]

function Slide() {
  return (
    <svg viewBox="0 0 960 540" width="100%" height="100%" style={{ fontFamily: 'var(--font-sans)', display: 'block' }} role="img" aria-label="플랫폼 구축 전략 - 플랫폼 데이터 흐름도">
      <defs>
        <linearGradient id="storeDark" x1="0" x2="1">
          <stop offset="0" stopColor="#9aa5ba" />
          <stop offset="0.5" stopColor="#c9d0dc" />
          <stop offset="1" stopColor="#9aa5ba" />
        </linearGradient>
        <linearGradient id="storeLight" x1="0" x2="1">
          <stop offset="0" stopColor="#b9c1cf" />
          <stop offset="0.5" stopColor="#dde1e8" />
          <stop offset="1" stopColor="#b9c1cf" />
        </linearGradient>
        <linearGradient id="stepArrow" x1="0" x2="1">
          <stop offset="0" stopColor="#dfe3ea" />
          <stop offset="1" stopColor="#a9b4c6" />
        </linearGradient>
        <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d6d6d" />
          <stop offset="1" stopColor="#6d6d6d" stopOpacity={0} />
        </linearGradient>
        <marker id="dotArrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={NAVY_LINE} />
        </marker>
      </defs>

      <rect width={960} height={540} fill="#fff" />

      {/* 헤더 */}
      <T x={54} y={53} size={54} weight={900} fill="#0a4d93">
        01
      </T>
      <T x={108} y={40} size={12} weight={400} fill="#333" anchor="start" w={254}>
        지역 상권 활성화를 위한 디지털배지 기반 스탬프투어 플랫폼
      </T>
      <T x={106} y={69} size={25} weight={800} anchor="start" w={414}>
        플랫폼 구축 전략 – 플랫폼 데이터 흐름도
      </T>
      <image href={`${A}/logo-nipa.png`} x={627} y={67} width={96} height={20} preserveAspectRatio="xMidYMid meet" />
      <image href={`${A}/logo-dip.png`} x={731} y={67} width={141} height={21.5} preserveAspectRatio="xMidYMid meet" />
      <image href={`${A}/logo-rootlab.png`} x={876} y={67} width={56} height={20} preserveAspectRatio="xMidYMid meet" />
      <line x1={0} y1={95.5} x2={960} y2={95.5} stroke="#c0c0c0" strokeWidth={0.9} />

      {/* 배경 패널 */}
      <rect x={27} y={120} width={161} height={405} fill={PANEL} />
      <rect x={257} y={120} width={676} height={386} fill={PANEL} />

      {/* 가운데 기둥 */}
      <g>
        <rect x={188} y={120.5} width={69} height={406.5} fill="#d9d9d9" />
        <ellipse cx={222.5} cy={527} rx={34.5} ry={9} fill="#c7c7c7" />
        <ellipse cx={222.5} cy={120.5} rx={34.5} ry={9} fill="#d9d9d9" />
        <rect x={197} y={126} width={50} height={398} fill="#ececec" />
        <ellipse cx={222.5} cy={126} rx={25} ry={6.5} fill="#e9e9e9" />
        <ellipse cx={222.5} cy={524} rx={25} ry={6.5} fill="#ececec" />
        <PillarBand top={198} bottom={213.5} />
        <PillarBand top={292} bottom={310} />
        <PillarBand top={455} bottom={473} />
      </g>

      <Cyl x={199} y={152} w={46.5} h={31} />
      <Lines cx={222.5} cy={173} lines={['데이터', '수집']} size={11.5} lh={12.5} weight={700} />

      <Cyl x={199} y={241} w={46.5} h={137} segs={[299, 318.5, 338, 358]} />
      <Lines cx={222.5} cy={273} lines={['디지털배지', '시스템']} size={11.5} lh={12.5} weight={700} ws={[45, 27]} />
      {['표준화', '매핑', '저장', '처리'].map((t, i) => (
        <T key={t} x={222.5} y={315 + i * 19.5} size={9.5} weight={400}>
          {t}
        </T>
      ))}

      <Cyl x={199} y={406} w={46.5} h={100} segs={[467.5, 487.5]} />
      <Lines cx={222.5} cy={437.5} lines={['블록체인', '시스템']} size={11.5} lh={12.5} weight={700} />
      <T x={222.5} y={484} size={9.5} weight={400}>온체인</T>
      <T x={222.5} y={504} size={9.5} weight={400}>오프체인</T>

      {/* 스탬프투어 */}
      <rect x={53} y={128.5} width={1.6} height={17.5} fill={NAVY} />
      <rect x={160} y={128.5} width={1.6} height={17.5} fill={NAVY} />
      <T x={108} y={137.5} size={15} weight={700} w={64}>스탬프투어</T>
      <image href={`${A}/curve.png`} x={163} y={-160} width={68} height={33} transform="scale(1,-1)" />

      <LegendBox x={34} y={163.5} w={146} h={70.5} title="사용자 서비스" tx={107.5} tw={65} />
      <Tile y={177.5} h={45.5} src="phone.png" iw={35} ih={35} />
      <Bullets x={99} ys={[183.5, 196.5, 208.5, 220.5]} items={['신원인증(DID)', '방문이력 데이터 등록', '디지털배지 발급 요청', '디지털배지 이력 조회']} ws={[47, 68, 68, 68]} />

      <LegendBox x={34} y={247.5} w={146} h={70} title="관리자 서비스" tx={107.5} tw={65} />
      <Tile y={261} h={45} src="building.png" iw={30} ih={30} />
      <Bullets x={99} ys={[266.5, 278.5, 289.5, 301.5]} items={['계정 및 권한 관리', '방문이력 데이터 관리', '디지털배지발급현황조회', '시스템 연계 관리']} ws={[57, 68, 72, 54]} />

      {/* 메타정보 저장 */}
      <g fill="none" stroke="url(#roof)" strokeWidth={2.2}>
        <polyline points="80,338 108,321 136,338" />
        <polyline points="84,339 108,325 132,339" opacity={0.7} />
        <polyline points="88,340 108,329 128,340" opacity={0.45} />
      </g>
      <T x={109} y={345.5} size={13} weight={700} w={60}>메타정보 저장</T>
      {[393.5, 437, 480].map((y) => (
        <line key={y} x1={34} y1={y} x2={180} y2={y} stroke={GRAY_LINE} strokeWidth={0.6} />
      ))}
      {META_ROWS.map((r) => (
        <g key={r.cy}>
          <circle cx={53.5} cy={r.cy} r={18.5} fill="#0b4c8c" />
          <Lines cx={53.5} cy={r.cy} lines={r.badge} size={9} lh={9.5} weight={700} fill="#fff" />
          <Bullets x={86} ys={r.ly} items={[r.lines[0]]} size={8.8} ws={[r.ws[0]]} />
          <T x={86} y={r.ly[1]} size={8.8} weight={400} anchor="start" w={r.ws[1]}>{r.lines[1]}</T>
        </g>
      ))}

      {/* 블록체인 기반 플랫폼 */}
      <rect x={443} y={128.5} width={1.6} height={17.5} fill={NAVY} />
      <rect x={719} y={128.5} width={1.6} height={17.5} fill={NAVY} />
      <T x={584} y={138} size={15} weight={700} w={260}>블록체인 기반 스탬프투어 디지털배지 플랫폼</T>

      <rect x={264} y={155.5} width={45} height={42.5} fill="#f4f4f4" stroke={GRAY_LINE} strokeWidth={0.8} />
      <Lines cx={286.5} cy={177} lines={['서비스', '모듈']} size={12} lh={13} weight={500} />
      <polygon points="309,172.5 318,172.5 318,168.5 326,177 318,185.5 318,181.5 309,181.5" fill="#a6a6a6" />
      {MODULES.map((m, i) => {
        const x = 326.5 + i * 87.05
        return (
          <g key={i}>
            <rect x={x} y={155.5} width={75} height={42.5} fill="#fff" stroke={BOX_BLUE} strokeWidth={1.1} />
            <Lines cx={x + 37.5} cy={177.5} lines={m.lines} size={12} lh={13} weight={500} ws={m.ws} />
          </g>
        )
      })}

      <Banner y0={206.5} y1={223} label="스탬프투어 디지털배지 시스템" tx={588.5} />

      <image href={`${A}/laptop.png`} x={273} y={236.5} width={67} height={48.5} />
      {[247.5, 275.5].map((y, i) => (
        <g key={y}>
          <line x1={341} y1={y} x2={355} y2={y} stroke={NAVY_LINE} strokeWidth={1.2} strokeDasharray="1.2 1.6" />
          <rect x={355.7} y={y - 9.9} width={176.3} height={19.8} rx={9.9} fill="#cddbea" stroke={NAVY_LINE} strokeWidth={1.1} />
          <T x={444} y={y} size={11.5} weight={700} w={i === 0 ? 106 : 115}>{i === 0 ? '데이터 정합성 검증 도구' : '디지털배지 발급∙검증 도구'}</T>
          <line x1={533} y1={y} x2={i === 0 ? 554 : 557} y2={y} stroke={NAVY_LINE} strokeWidth={1.2} strokeDasharray="1.2 1.6" markerEnd="url(#dotArrow)" />
        </g>
      ))}
      {STEPS.map((s, i) => (
        <g key={s.cx}>
          <circle cx={s.cx + 3} cy={262} r={31} fill="#c6c6c6" />
          <circle cx={s.cx} cy={259} r={31} fill="#fff" stroke={NAVY_LINE} strokeWidth={1.2} />
          <Lines cx={s.cx} cy={259.5} lines={s.lines} size={12} lh={13} weight={700} ws={s.ws} />
          {i < 3 && (
            <g stroke="#9db3d6" strokeWidth={3}>
              <line x1={s.cx + 41} y1={261} x2={s.cx + 55} y2={261} />
              <line x1={s.cx + 48} y1={254} x2={s.cx + 48} y2={268} />
            </g>
          )}
        </g>
      ))}

      <Banner y0={301} y1={319} label="저장/처리 영역" tx={589} />

      {/* 방문이력 데이터 전처리 */}
      <LegendBox x={264} y={335} w={251} h={114} title="방문이력 데이터 전처리" tx={392} tw={108} />
      {[
        { x: 276, lines: ['데이터', '통합수집'], ws: [24, 32] },
        { x: 359, lines: ['JSON 스키마로', '정형화'], ws: [52, 23] },
        { x: 442, lines: ['정합성 검증', '및 저장'], ws: [47, 29] },
      ].map((p, i) => (
        <g key={p.x}>
          <rect x={p.x} y={343.5} width={64.5} height={39.5} rx={19.75} fill="#fff" stroke={GRAY_LINE} strokeWidth={0.8} />
          <Lines cx={p.x + 32.25} cy={363.5} lines={p.lines} size={11.2} lh={12} weight={400} ws={p.ws} />
          {i < 2 && <polygon points={`${p.x + 65},359 ${p.x + 74},359 ${p.x + 74},355 ${p.x + 83},363.5 ${p.x + 74},372 ${p.x + 74},368 ${p.x + 65},368`} fill="url(#stepArrow)" />}
        </g>
      ))}
      <rect x={276.5} y={392.5} width={230.5} height={20.5} fill="#f6f6f6" stroke="#b5b5b5" strokeWidth={0.7} />
      <T x={392} y={403.5} size={10.8} weight={400} w={210}>반정형 데이터 : 필드 파싱 및 정리, 표준 스키마에 맞춰 정형화</T>
      <rect x={276.5} y={420} width={230.5} height={20.5} fill="#f6f6f6" stroke="#b5b5b5" strokeWidth={0.7} />
      <T x={392} y={430.5} size={10.8} weight={400} w={208}>비정형 데이터 : 원본 저장 및 관련 메타데이터 추출 후 인덱싱</T>

      <image href={`${A}/chevron2.png`} x={513} y={350} width={25} height={45} preserveAspectRatio="none" />

      {/* 데이터 저장 플랫폼 */}
      <LegendBox x={537.5} y={335} w={381.5} h={114} title="데이터 저장 플랫폼" tx={724} tw={88} />
      {[
        { x: 558.7, title: 'On-chain 저장소', sub: '블록체인 기반 신뢰 저장 영역', subW: 112, titleW: 79, cells: ['데이터 해시값', '고유식별자', '타임스탬프', 'DID 정보'], cellWs: [48, 38, 38, 32], dark: true },
        { x: 747.4, title: 'Off-chain 저장소', sub: '방문데이터 저장∙관리 영역', subW: 101, titleW: 80, cells: ['방문이력', '부속 메타데이터', '첨부문서', '등록 및 변경 로그'], cellWs: [30, 55, 30, 61], dark: false },
      ].map((s) => (
        <g key={s.title}>
          <rect x={s.x} y={348.8} width={149.6} height={21} rx={10.5} fill="#fff" stroke={NAVY_LINE} strokeWidth={1.1} />
          <T x={s.x + 74.8} y={359.5} size={12.5} weight={500} w={s.titleW}>{s.title}</T>
          <T x={s.x + 74.8} y={378.5} size={10.8} weight={400} w={s.subW}>{s.sub}</T>
          <Store x={s.x + 2.5} y={393} w={69} label={s.cells[0]} lw={s.cellWs[0]} dark={s.dark} />
          <Store x={s.x + 78.5} y={393} w={69} label={s.cells[1]} lw={s.cellWs[1]} dark={s.dark} />
          <Store x={s.x + 2.5} y={417.5} w={69} label={s.cells[2]} lw={s.cellWs[2]} dark={s.dark} />
          <Store x={s.x + 78.5} y={417.5} w={69} label={s.cells[3]} lw={s.cellWs[3]} dark={s.dark} />
        </g>
      ))}

      <Banner y0={464} y1={482} label="BlockChain 인프라" tx={588.5} />

      <T x={936.5} y={515.5} size={11} weight={500}>12</T>
    </svg>
  )
}

export default function PdfTest() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-200 p-4">
      <div className="w-full max-w-[1440px] bg-white shadow-lg" style={{ aspectRatio: '960 / 540' }}>
        <Slide />
      </div>
    </main>
  )
}
