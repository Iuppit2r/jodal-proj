import type { Performance } from '../../data/types'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const d = (s: string) => ({ y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)) - 1, day: Number(s.slice(8, 10)) })

/** 2026-10-16 ~ 2026-11-08 → Oct 16 – Nov 8, 2026 */
export function enRange(a: string, b: string) {
  const x = d(a), y = d(b)
  if (x.y !== y.y) return `${MON[x.m]} ${x.day}, ${x.y} – ${MON[y.m]} ${y.day}, ${y.y}`
  return `${MON[x.m]} ${x.day} – ${MON[y.m]} ${y.day}, ${y.y}`
}

export const enGenre: Record<Performance['genre'], string> = {
  연극: 'Theatre', 음악극: 'Music Theatre', 인형극: 'Puppetry', 무용극: 'Dance Theatre', 렉처퍼포먼스: 'Lecture Performance',
}
export const enTarget: Record<Performance['target'], string> = { 어린이: 'Children', 청소년: 'Youth', 가족: 'Family' }

export function enAge(a: string) {
  const m = a.match(/만\s*(\d+)세/)
  if (m) return `Ages ${m[1]}+`
  const mo = a.match(/(\d+)개월/)
  if (mo) return `${mo[1]} months+`
  return a
}

/** 영문 소개 (국문 원문의 번역본 — 시연용) */
export const enCopy: Record<string, { summary: string; body: string }> = {
  p1: {
    summary: 'A street cat named Bori sets out on a musical journey to find the moon that keeps disappearing at night.',
    body: 'One night, the moon vanishes from above the rooftops. Without moonlight, the neighborhood children cannot fall asleep — so Bori, a curious street cat, goes looking for it. Live music and shadow play come together in this 70-minute music theatre piece that gently invites children who are afraid of the dark to discover the beauty of the night.',
  },
  p2: {
    summary: 'Five fifteen-year-olds left behind on a deserted-island camp instead of their school trip.',
    body: 'A typhoon strands five middle-school students on a small island. With no phones and no adults, they call each other by their real names for the very first time. Developed from our youth playwriting workshop and refined together with teenage audiences, this is our 2026 youth repertoire production. Korean surtitles at every performance.',
  },
  p3: {
    summary: 'A 45-minute bus ride for babies, toddlers and the grown-ups who love them.',
    body: 'A red bus made of cardboard boxes travels around the neighborhood. At every stop, little friends are waiting to play with sounds and rhythms. Designed so that our youngest audience members can move, respond and feel at home, every performance is a relaxed performance.',
  },
  p4: {
    summary: 'A child who decides never to move again — and the dance of the four seasons.',
    body: 'A child who no longer wants to speak stands in the middle of a park and decides to become a tree. The changing seasons unfold through the dancers’ bodies in this wordless dance theatre piece, presented in partnership with Forest Dance Company.',
  },
  p5: {
    summary: 'Thirty birds set out on a great journey in search of their king.',
    body: 'A classic fable retold for young audiences. The audience becomes the voices of the birds and joins the journey in this interactive family play.',
  },
}
export const enFallback = { summary: 'A new production for young audiences and families.', body: 'Details for this production will be announced soon.' }
