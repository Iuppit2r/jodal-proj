// 완등 인증카드 이미지 생성 (Canvas, 1080×1350 = 인스타그램 4:5)
// 서버·외부 솔루션 없이 단말에서 인증사진 + 완등정보를 합성한다.
import { osamSrc, type OsamPose } from '../components/art'
import { artPalette, fmtDate, TOTAL, zoneById, type CertRecord, type Mountain } from '../data'

export const cardStyles = [
  { id: 0, name: '포토 스탬프' },
  { id: 1, name: '풀사진' },
  { id: 2, name: '산행여권' },
] as const

export type CardInput = {
  m: Mountain
  rec: CertRecord
  order: number
  count: number
  style: number
  nick: string
}

const W = 1080
const H = 1350
const FONT = '"Pretendard Variable", Pretendard, sans-serif'
const cache = new Map<string, Promise<HTMLImageElement>>()

function loadImg(src: string) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((res, rej) => {
        const img = new Image()
        img.onload = () => res(img)
        img.onerror = rej
        img.src = src
      }),
    )
  }
  return cache.get(src)!
}

/** 오삼이 이미지를 높이 h, 하단·우측(또는 좌측) 기준으로 그린다 */
async function drawOsam(ctx: CanvasRenderingContext2D, pose: OsamPose, edgeX: number, bottom: number, h: number, align: 'left' | 'right' = 'right') {
  try {
    const img = await loadImg(osamSrc(pose))
    const w = (img.width / img.height) * h
    ctx.drawImage(img, align === 'right' ? edgeX - w : edgeX, bottom - h, w, h)
    return w
  } catch {
    return 0
  }
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** cover 방식으로 이미지 채우기 */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height)
  const iw = img.width * s
  const ih = img.height * s
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
}

function drawIllustration(ctx: CanvasRenderingContext2D, m: Mountain, x: number, y: number, w: number, h: number) {
  // 400×240 일러스트를 비율 유지(cover)로 채운다
  const k = Math.max(w / 400, h / 240)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.translate(x + (w - 400 * k) / 2, y + (h - 240 * k) / 2)
  ctx.scale(k, k)
  const p = artPalette(m.hue)
  const g = ctx.createLinearGradient(0, 0, 0, 240)
  g.addColorStop(0, p.sky0)
  g.addColorStop(1, p.sky1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 400, 240)
  ctx.fillStyle = p.sun
  ctx.beginPath()
  ctx.arc(300, 70, 24, 0, Math.PI * 2)
  ctx.fill()
  const layers: [string, number[]][] = [
    [p.r1, [0, 150, 70, 95, 120, 125, 190, 60, 260, 120, 320, 85, 400, 135]],
    [p.r2, [0, 180, 60, 140, 130, 170, 200, 115, 280, 165, 350, 130, 400, 160]],
    [p.r3, [0, 215, 90, 175, 170, 205, 250, 170, 330, 200, 400, 185]],
  ]
  for (const [c, pts] of layers) {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1])
    ctx.lineTo(400, 240)
    ctx.lineTo(0, 240)
    ctx.fill()
  }
  ctx.restore()
}

async function drawPhoto(ctx: CanvasRenderingContext2D, input: CardInput, x: number, y: number, w: number, h: number) {
  const src = input.rec.photo ?? (input.m.photo ? `./${input.m.photo}` : null)
  if (src) {
    try {
      drawCover(ctx, await loadImg(src), x, y, w, h)
      return
    } catch {
      /* 일러스트로 대체 */
    }
  }
  drawIllustration(ctx, input.m, x, y, w, h)
}

/** 원형 도장 */
function drawStamp(ctx: CanvasRenderingContext2D, input: CardInput, cx: number, cy: number, r: number, color: string, rot = -0.14) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.globalAlpha = 0.92
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = r * 0.07
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = r * 0.035
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2)
  ctx.stroke()
  // 둘레 글자
  const ring = `김천 100산 · ${input.m.no}번 · ${input.m.height}m · 완등 인증 · `
  ctx.font = `800 ${r * 0.19}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const chars = [...ring]
  chars.forEach((ch, i) => {
    const a = (i / chars.length) * Math.PI * 2 - Math.PI / 2
    ctx.save()
    ctx.rotate(a + Math.PI / 2)
    ctx.fillText(ch, 0, -r * 0.82)
    ctx.restore()
  })
  // 산 + 이름
  ctx.beginPath()
  ctx.moveTo(-r * 0.36, r * 0.12)
  ctx.lineTo(-r * 0.14, -r * 0.2)
  ctx.lineTo(0, -r * 0.04)
  ctx.lineTo(r * 0.14, -r * 0.28)
  ctx.lineTo(r * 0.38, r * 0.12)
  ctx.closePath()
  ctx.fill()
  const nm = input.m.title.length > 6 ? input.m.title.slice(0, 6) : input.m.title
  ctx.font = `900 ${r * (nm.length > 4 ? 0.17 : 0.22)}px ${FONT}`
  ctx.fillText(nm, 0, r * 0.36)
  ctx.font = `800 ${r * 0.14}px ${FONT}`
  ctx.fillText(fmtDate(input.rec.at).slice(2), 0, -r * 0.42)
  ctx.restore()
}

/** 최대 폭에 맞춰 글자 크기 축소 */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxW: number) {
  let s = size
  ctx.font = `${weight} ${s}px ${FONT}`
  while (ctx.measureText(text).width > maxW && s > 40) {
    s -= 4
    ctx.font = `${weight} ${s}px ${FONT}`
  }
}

// 색상 – 앱 컬러 스킴과 동일
const C = { brand: '#1F4434', brandDeep: '#15302A', accent: '#F26B3A', gold: '#E0A93B', ink: '#1C201D', sub: '#525A55', line: '#E7E5DF', paper: '#FAF8F3' }
const M = 72 // 바깥 여백 (모든 요소의 정렬 기준선)

function text(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(t, x, y)
}

async function drawLogo(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, h: number) {
  try {
    const logo = await loadImg(src)
    ctx.drawImage(logo, x, y, (logo.width / logo.height) * h, h)
  } catch {
    /* 로고 없음 */
  }
}

export async function renderCard(input: CardInput): Promise<string> {
  await document.fonts.load(`900 40px ${FONT}`).catch(() => {})
  await document.fonts.load(`600 40px ${FONT}`).catch(() => {})
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const { m, rec, order, count } = input
  const zone = zoneById(m.zone)
  const no = `김천 100산 ${m.no}번`
  const meta = `${m.summit} ${m.height.toLocaleString()}m  ·  ${fmtDate(rec.at)}`
  ctx.textBaseline = 'alphabetic'

  if (input.style === 0) {
    // ── 포토 스탬프: 상단 로고 / 사진 / 정보 / 하단 바 ──
    ctx.fillStyle = C.paper
    ctx.fillRect(0, 0, W, H)
    await drawLogo(ctx, './brand/logo_gimcheon.png', M, 64, 56)
    text(ctx, no, W - M, 104, `800 34px ${FONT}`, C.sub, 'right')
    // 사진
    const py = 152
    const ph = 740
    ctx.save()
    rr(ctx, M, py, W - M * 2, ph, 28)
    ctx.clip()
    await drawPhoto(ctx, input, M, py, W - M * 2, ph)
    ctx.restore()
    // 스탬프 – 사진 우상단 안쪽
    const sr = 112
    ctx.fillStyle = 'rgba(255,255,255,.88)'
    ctx.beginPath()
    ctx.arc(W - M - 28 - sr, py + 28 + sr, sr + 14, 0, Math.PI * 2)
    ctx.fill()
    drawStamp(ctx, input, W - M - 28 - sr, py + 28 + sr, sr, C.accent)
    // 정보 (좌측 정렬, 오삼이 영역 제외)
    const osamH = 250
    text(ctx, '김천 100산 완등 인증', M, 972, `800 34px ${FONT}`, C.accent)
    fitFont(ctx, m.title, 900, 104, W - M * 2 - 230)
    ctx.fillStyle = C.ink
    ctx.textAlign = 'left'
    ctx.fillText(m.title, M - 4, 1078)
    text(ctx, meta, M, 1136, `600 36px ${FONT}`, C.sub)
    await drawOsam(ctx, 'best', W - M, 1196, osamH)
    // 하단 바
    ctx.fillStyle = C.line
    ctx.fillRect(M, 1212, W - M * 2, 2)
    text(ctx, `@${input.nick}`, M, 1280, `700 34px ${FONT}`, C.ink)
    text(ctx, `${order}번째 완등  ·  ${count}/${TOTAL}산`, W - M, 1280, `700 34px ${FONT}`, C.brand, 'right')
  } else if (input.style === 1) {
    // ── 풀사진: 풀블리드 사진 + 하단 정보 ──
    await drawPhoto(ctx, input, 0, 0, W, H)
    const g = ctx.createLinearGradient(0, 560, 0, H)
    g.addColorStop(0, 'rgba(21,48,42,0)')
    g.addColorStop(0.5, 'rgba(21,48,42,.82)')
    g.addColorStop(1, 'rgba(21,48,42,.97)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    const tg = ctx.createLinearGradient(0, 0, 0, 240)
    tg.addColorStop(0, 'rgba(0,0,0,.42)')
    tg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = tg
    ctx.fillRect(0, 0, W, 240)
    await drawLogo(ctx, './brand/logo_gimcheon_white.png', M, 64, 56)
    text(ctx, no, W - M, 104, `800 34px ${FONT}`, '#fff', 'right')
    // 순번 태그
    ctx.font = `800 34px ${FONT}`
    const tag = `${order}번째 완등`
    const tw = ctx.measureText(tag).width + 48
    rr(ctx, M, 860, tw, 60, 30)
    ctx.fillStyle = C.accent
    ctx.fill()
    text(ctx, tag, M + 24, 902, `800 34px ${FONT}`, '#fff')
    fitFont(ctx, m.title, 900, 128, W - M * 2 - 220)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(m.title, M - 5, 1044)
    text(ctx, meta, M, 1106, `600 38px ${FONT}`, 'rgba(255,255,255,.9)')
    await drawOsam(ctx, 'best', W - M, 1170, 230)
    // 진행 바
    rr(ctx, M, 1184, W - M * 2, 14, 7)
    ctx.fillStyle = 'rgba(255,255,255,.2)'
    ctx.fill()
    rr(ctx, M, 1184, Math.max(28, (W - M * 2) * (count / TOTAL)), 14, 7)
    ctx.fillStyle = C.accent
    ctx.fill()
    text(ctx, `김천 100산 ${count}/${TOTAL}`, M, 1268, `700 36px ${FONT}`, '#fff')
    text(ctx, '김천시 산악 완등 인증', W - M, 1268, `700 36px ${FONT}`, 'rgba(255,255,255,.85)', 'right')
  } else {
    // ── 산행여권 페이지 ──
    const O = 48 // 여권 테두리
    const X = O + 56 // 내부 정렬선
    ctx.fillStyle = C.brand
    ctx.fillRect(0, 0, W, H)
    rr(ctx, O, O, W - O * 2, H - O * 2, 32)
    ctx.fillStyle = C.paper
    ctx.fill()
    text(ctx, '김천시 발행 · 2026년 회차', X, 150, `800 30px ${FONT}`, C.accent)
    text(ctx, '김천 100산 디지털 산행여권', X, 208, `900 48px ${FONT}`, C.ink)
    ctx.fillStyle = C.line
    ctx.fillRect(X, 248, W - X * 2, 2)
    // 사진 + 정보 2단
    const top = 290
    const pw = 420
    const ph = 560
    ctx.save()
    rr(ctx, X, top, pw, ph, 20)
    ctx.clip()
    await drawPhoto(ctx, input, X, top, pw, ph)
    ctx.restore()
    const lx = X + pw + 48
    const rows: [string, string][] = [
      ['산 이름', m.title],
      ['인증 지점', `${m.summit} ${m.height.toLocaleString()}m`],
      ['산줄기', zone.name],
      ['인증 일자', fmtDate(rec.at)],
      ['누적 완등', `${count} / ${TOTAL}산`],
    ]
    rows.forEach(([k, v], i) => {
      const y = top + 30 + i * 112
      text(ctx, k, lx, y, `700 28px ${FONT}`, C.sub)
      fitFont(ctx, v, 900, 44, W - X - lx)
      ctx.fillStyle = C.ink
      ctx.fillText(v, lx, y + 52)
    })
    // 스탬프 + 오삼이
    drawStamp(ctx, input, X + 140, 1030, 140, zone.color, -0.18)
    await drawOsam(ctx, 'love', X + 262, 1176, 220, 'left')
    text(ctx, `${order}번째 스탬프`, lx, 1000, `900 46px ${FONT}`, C.brand)
    text(ctx, `@${input.nick}`, lx, 1052, `700 32px ${FONT}`, C.sub)
    ctx.fillStyle = C.line
    ctx.fillRect(X, 1200, W - X * 2, 2)
    text(ctx, '김천시', X, 1256, `800 30px ${FONT}`, C.brand)
    text(ctx, '산악 완등 인증', W - X, 1256, `700 30px ${FONT}`, C.sub, 'right')
  }
  return cv.toDataURL('image/png')
}

export async function dataUrlToFile(url: string, name: string) {
  const blob = await (await fetch(url)).blob()
  return new File([blob], name, { type: 'image/png' })
}
