// SFR-02 / DAR-12 질병재난 아카이브 목업 데이터

export type ChangeType = '원본' | '개정' | '파생' | '폐지' | '참조'
export type Visibility = '공개' | '내부공개' | '비공개'
export type Relation = { to: string; type: Exclude<ChangeType, '원본'> }

export type Meta = {
  title: string
  version: string
  dept: string
  keywords: string[]
  changeType: ChangeType
  revisedAt: string
}

export type SaveDoc = Meta & {
  id: string
  groupId: string
  order: number
  visibility: Visibility
  isLatest: boolean
  latestManual?: boolean
  fileName: string
  size: string
  hash: string
  uploadedAt: string
  uploader: string
  relations: Relation[] // 이 문서 → 상위(원본) 문서 관계
  metaHistory: Meta[]
}

export type Group = { id: string; name: string; category: string }

export type AuditLog = { id: number; at: string; user: string; docId: string; field: string; before: string; after: string }

export const CHANGE_COLOR: Record<ChangeType, string> = {
  원본: '#0b5cad',
  개정: '#0f8b7e',
  파생: '#6b4bb8',
  폐지: '#c0362c',
  참조: '#e08a1e',
}

export const GROUPS: Group[] = [
  { id: 'g-covid', name: '코로나바이러스감염증-19 대응지침 (지자체용)', category: '감염병 대응지침' },
  { id: 'g-covid-ltc', name: '감염취약시설 코로나19 관리지침', category: '감염병 대응지침' },
  { id: 'g-mpox', name: '엠폭스 대응지침', category: '감염병 대응지침' },
  { id: 'g-mpox-hosp', name: '의료기관 엠폭스 감염관리 안내', category: '의료기관 지침' },
  { id: 'g-flu', name: '신종인플루엔자 대응지침', category: '감염병 대응지침' },
  { id: 'g-tb', name: '국가결핵관리지침', category: '만성감염병 지침' },
]

const h = (seed: string) => {
  // 결정적 가짜 SHA-256 문자열
  let x = 0
  for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0
  let out = ''
  for (let i = 0; i < 64; i++) { x = (x * 1103515245 + 12345) >>> 0; out += (x >>> 24 & 15).toString(16) }
  return out
}

function doc(p: Partial<SaveDoc> & Pick<SaveDoc, 'id' | 'groupId' | 'title' | 'version' | 'revisedAt' | 'changeType'>): SaveDoc {
  return {
    dept: '질병관리청 감염병정책국',
    keywords: [],
    order: 0,
    visibility: '공개',
    isLatest: false,
    fileName: `${p.id}.pdf`,
    size: `${(1 + (p.id.length % 7) * 0.6).toFixed(1)}MB`,
    hash: h(p.id),
    uploadedAt: p.revisedAt,
    uploader: '송규리',
    relations: [],
    metaHistory: [],
    ...p,
  }
}

export const INITIAL_DOCS: SaveDoc[] = [
  doc({ id: 'covid-1', groupId: 'g-covid', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제1판', version: '1', revisedAt: '2020-01-20', changeType: '원본', keywords: ['코로나19', '신종감염병', '지자체'], order: 1 }),
  doc({ id: 'covid-5', groupId: 'g-covid', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제5판', version: '5', revisedAt: '2020-02-07', changeType: '개정', keywords: ['코로나19', '사례정의', '지자체'], order: 2, relations: [{ to: 'covid-1', type: '개정' }] }),
  doc({ id: 'covid-9', groupId: 'g-covid', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제9판', version: '9', revisedAt: '2020-06-25', changeType: '개정', keywords: ['코로나19', '격리해제', '지자체'], order: 3, relations: [{ to: 'covid-5', type: '개정' }] }),
  doc({ id: 'covid-12', groupId: 'g-covid', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제12판', version: '12', revisedAt: '2022-04-25', changeType: '개정', keywords: ['코로나19', '일상회복', '지자체'], order: 4, relations: [{ to: 'covid-9', type: '개정' }] }),
  doc({ id: 'covid-13', groupId: 'g-covid', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제13판', version: '13', revisedAt: '2023-05-31', changeType: '개정', keywords: ['코로나19', '격리권고', '지자체'], order: 5, relations: [{ to: 'covid-12', type: '개정' }] }),
  doc({ id: 'covid-14', groupId: 'g-covid', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제14판', version: '14', revisedAt: '2024-08-01', changeType: '개정', keywords: ['코로나19', '표본감시', '고위험군', '지자체'], order: 6, isLatest: true, relations: [{ to: 'covid-13', type: '개정' }],
    metaHistory: [{ title: '코로나바이러스감염증-19 대응지침 (지자체용) 제14판', version: '14', dept: '질병관리청 감염병정책국', keywords: ['코로나19', '표본감시', '지자체'], changeType: '개정', revisedAt: '2024-07-31' }] }),
  doc({ id: 'ltc-1', groupId: 'g-covid-ltc', title: '감염취약시설 코로나19 관리지침 제1판', version: '1', revisedAt: '2022-06-10', changeType: '파생', keywords: ['요양시설', '감염취약시설'], order: 1, relations: [{ to: 'covid-12', type: '파생' }], dept: '질병관리청 의료감염관리과' }),
  doc({ id: 'ltc-2', groupId: 'g-covid-ltc', title: '감염취약시설 코로나19 관리지침 제2판', version: '2', revisedAt: '2023-06-15', changeType: '개정', keywords: ['요양시설', '감염취약시설', '면회'], order: 2, isLatest: true, relations: [{ to: 'ltc-1', type: '개정' }, { to: 'covid-13', type: '참조' }], dept: '질병관리청 의료감염관리과', visibility: '내부공개' }),
  doc({ id: 'mpox-1', groupId: 'g-mpox', title: '원숭이두창 대응지침 제1판', version: '1', revisedAt: '2022-05-31', changeType: '원본', keywords: ['원숭이두창', '해외유입'], order: 1 }),
  doc({ id: 'mpox-3', groupId: 'g-mpox', title: '엠폭스 대응지침 제3판', version: '3', revisedAt: '2022-11-28', changeType: '개정', keywords: ['엠폭스', '명칭변경'], order: 2, relations: [{ to: 'mpox-1', type: '개정' }] }),
  doc({ id: 'mpox-4', groupId: 'g-mpox', title: '엠폭스 대응지침 제4판', version: '4', revisedAt: '2023-06-01', changeType: '개정', keywords: ['엠폭스', '접촉자', '격리'], order: 3, relations: [{ to: 'mpox-3', type: '개정' }] }),
  doc({ id: 'mpox-5', groupId: 'g-mpox', title: '엠폭스 대응지침 제5판', version: '5', revisedAt: '2025-03-04', changeType: '개정', keywords: ['엠폭스', '접촉자', '노출후접종'], order: 4, isLatest: true, relations: [{ to: 'mpox-4', type: '개정' }] }),
  doc({ id: 'mpoxh-1', groupId: 'g-mpox-hosp', title: '의료기관 엠폭스 감염관리 안내', version: '1', revisedAt: '2025-04-10', changeType: '참조', keywords: ['엠폭스', '의료기관', '감염관리'], order: 1, isLatest: true, relations: [{ to: 'mpox-5', type: '참조' }], dept: '질병관리청 의료감염관리과' }),
  doc({ id: 'flu-1', groupId: 'g-flu', title: '신종인플루엔자 대응지침', version: '1', revisedAt: '2009-05-02', changeType: '원본', keywords: ['신종인플루엔자', 'H1N1'], order: 1 }),
  doc({ id: 'flu-x', groupId: 'g-flu', title: '신종인플루엔자 대응지침 (폐지)', version: '2', revisedAt: '2010-08-31', changeType: '폐지', keywords: ['신종인플루엔자', '폐지'], order: 2, isLatest: true, relations: [{ to: 'flu-1', type: '폐지' }], visibility: '비공개' }),
  doc({ id: 'tb-24', groupId: 'g-tb', title: '2024 국가결핵관리지침', version: '2024', revisedAt: '2024-01-15', changeType: '원본', keywords: ['결핵', '잠복결핵'], order: 1, dept: '질병관리청 결핵정책과' }),
  doc({ id: 'tb-25', groupId: 'g-tb', title: '2025 국가결핵관리지침', version: '2025', revisedAt: '2025-01-20', changeType: '개정', keywords: ['결핵', '잠복결핵', '치료'], order: 2, isLatest: true, relations: [{ to: 'tb-24', type: '개정' }], dept: '질병관리청 결핵정책과' }),
]

export const INITIAL_AUDIT: AuditLog[] = [
  { id: 6, at: '2026-09-30 14:12', user: '송규리', docId: 'ltc-2', field: '공개상태', before: '공개', after: '내부공개' },
  { id: 5, at: '2026-09-28 10:03', user: '송규리', docId: 'covid-14', field: '키워드', before: '코로나19, 표본감시, 지자체', after: '코로나19, 표본감시, 고위험군, 지자체' },
  { id: 4, at: '2026-09-28 10:01', user: '송규리', docId: 'covid-14', field: '개정일자', before: '2024-07-31', after: '2024-08-01' },
  { id: 3, at: '2026-09-21 16:40', user: '정동석', docId: 'flu-x', field: '공개상태', before: '공개', after: '비공개' },
  { id: 2, at: '2026-09-21 16:38', user: '정동석', docId: 'flu-x', field: '변경유형', before: '개정', after: '폐지' },
  { id: 1, at: '2026-09-15 09:20', user: 'system', docId: 'mpox-5', field: '최신판', before: 'false', after: 'true (자동판정)' },
]
