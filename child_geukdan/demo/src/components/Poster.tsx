import type { Performance } from '../data/types'

/** 이미지 없이 공연 팔레트·모티프로 생성하는 시연용 포스터 */
export default function Poster({ title, palette, motif, sub, className = '', showText = true }: {
  title: string; palette: [string, string, string]; motif: Performance['motif']; sub?: string; className?: string; showText?: boolean
}) {
  const [bg, a, b] = palette
  const id = 'g' + Math.abs([...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))
  return (
    <svg viewBox="0 0 300 420" className={className} role="img" aria-label={`${title} 포스터`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg} stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <rect width="300" height="420" fill={`url(#${id})`} />
      {motif === 'moon' && (<>
        <circle cx="200" cy="120" r="70" fill={a} />
        <circle cx="228" cy="104" r="62" fill={bg} />
        {[...Array(14)].map((_, i) => <circle key={i} cx={(i * 53) % 290 + 5} cy={(i * 37) % 200 + 20} r={i % 3 ? 1.6 : 2.6} fill={a} opacity=".8" />)}
        <path d="M60 330 q20 -60 40 -40 q10 -30 22 0 q22 -10 26 30 v40 h-90z" fill={b} />
        <circle cx="96" cy="300" r="3" fill={bg} /><circle cx="116" cy="300" r="3" fill={bg} />
      </>)}
      {motif === 'wave' && (<>
        <circle cx="220" cy="90" r="40" fill={b} opacity=".9" />
        {[0, 1, 2, 3].map(i => <path key={i} d={`M0 ${250 + i * 30} q37 -25 75 0 t75 0 t75 0 t75 0 v200 h-300z`} fill={a} opacity={0.35 + i * 0.18} />)}
        <path d="M110 250 l30 -60 l30 60z" fill={b} />
      </>)}
      {motif === 'bus' && (<>
        <rect x="50" y="170" width="200" height="110" rx="22" fill={a} />
        {[0, 1, 2, 3].map(i => <rect key={i} x={68 + i * 45} y="188" width="34" height="34" rx="6" fill={b} />)}
        <circle cx="95" cy="285" r="20" fill="#222" /><circle cx="205" cy="285" r="20" fill="#222" />
        <circle cx="95" cy="285" r="8" fill={a} /><circle cx="205" cy="285" r="8" fill={a} />
        <rect x="0" y="305" width="300" height="10" fill={b} opacity=".5" />
      </>)}
      {motif === 'bird' && (<>
        {[...Array(9)].map((_, i) => <path key={i} transform={`translate(${30 + (i * 67) % 240} ${60 + (i * 43) % 220}) scale(${0.6 + (i % 3) * 0.3})`} d="M0 10 q15 -18 30 0 q15 -18 30 0" stroke={i % 2 ? a : b} strokeWidth="5" fill="none" strokeLinecap="round" />)}
        <circle cx="150" cy="140" r="34" fill={a} opacity=".9" />
      </>)}
      {motif === 'tree' && (<>
        <rect x="140" y="200" width="20" height="120" fill={b} />
        <circle cx="150" cy="170" r="70" fill={b} />
        <circle cx="110" cy="200" r="45" fill={a} opacity=".85" />
        <circle cx="195" cy="190" r="40" fill={a} opacity=".7" />
      </>)}
      {(motif === 'box' || motif === 'star') && (<>
        <rect x="80" y="160" width="140" height="120" fill="none" stroke={a} strokeWidth="6" transform="rotate(-8 150 220)" />
        {[...Array(18)].map((_, i) => <circle key={i} cx={(i * 47) % 280 + 10} cy={(i * 59) % 300 + 30} r={i % 4 ? 1.8 : 3.4} fill={i % 2 ? a : b} />)}
        <path d="M150 100 l10 22 24 2 -18 16 6 24 -22 -13 -22 13 6 -24 -18 -16 24 -2z" fill={b} />
      </>)}
      {showText && (
        <g>
          <text x="22" y="372" fill="#fff" fontSize="22" fontWeight="800" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>{title.length > 13 ? title.slice(0, 12) + '…' : title}</text>
          {sub && <text x="22" y="398" fill="#fff" opacity=".8" fontSize="12" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>{sub}</text>}
        </g>
      )}
    </svg>
  )
}
