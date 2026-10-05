// SFR-04 / DAR-11 MeSH 자동색인 목업 데이터

export type TermKind = 'major' | 'minor' | 'pubtype' | 'check' | 'geo'
export type MeshTerm = {
  ui: string
  name: string
  qualifiers: string[]
  kind: TermKind
  star?: boolean // 핵심주제(주요 표목)
  conf: number
  evidence: string[] // 원문 내 근거 표현
  refs: string[] // 참조 정답셋(유사 기색인 논문)
}
export type ReviewStatus = '검수대기' | '승인' | '반려' | '최종확정'
export type Paper = {
  id: string
  koms: string
  journal: string
  year: number
  title: string
  abstract: string
  indexedAt: string
  procSec: number
  terms: MeshTerm[]
  status: ReviewStatus
}

export const KIND_LABEL: Record<TermKind, string> = {
  major: '주표목 (Descriptor)', minor: '부가 표목', pubtype: 'Publication Type', check: 'Check Tag', geo: 'Geographic',
}

export const PAPERS: Paper[] = [
  {
    id: 'p1', koms: 'KOMS-2026-104512', journal: 'Osong Public Health Res Perspect', year: 2026, indexedAt: '2026-10-05 08:12', procSec: 3.2, status: '검수대기',
    title: 'Clinical characteristics and duration of isolation among patients with mpox in the Republic of Korea, 2023–2025',
    abstract: 'We retrospectively analyzed 182 laboratory-confirmed mpox cases reported in Korea. The median time from symptom onset to crusting of all skin lesions was 21 days. Immunocompromised patients, including people living with HIV infection, showed a significantly longer duration. Viral culture was negative in all specimens collected after lesion healing. Contact tracing identified 1,204 contacts, and post-exposure vaccination was provided to high-risk contacts. These findings support the current isolation criteria based on lesion healing.',
    terms: [
      { ui: 'D000096782', name: 'Mpox (Monkeypox)', qualifiers: ['epidemiology', 'prevention & control'], kind: 'major', star: true, conf: 0.97, evidence: ['mpox'], refs: ['KOMS-2024-088120', 'KOMS-2025-091733'] },
      { ui: 'D007539', name: 'Patient Isolation', qualifiers: ['standards'], kind: 'major', star: true, conf: 0.91, evidence: ['isolation criteria', 'duration of isolation'], refs: ['KOMS-2023-071002'] },
      { ui: 'D015334', name: 'Contact Tracing', qualifiers: [], kind: 'major', conf: 0.88, evidence: ['Contact tracing', 'contacts'], refs: ['KOMS-2022-052219'] },
      { ui: 'D016867', name: 'Immunocompromised Host', qualifiers: [], kind: 'minor', conf: 0.74, evidence: ['Immunocompromised patients'], refs: [] },
      { ui: 'D015658', name: 'HIV Infections', qualifiers: ['complications'], kind: 'minor', conf: 0.69, evidence: ['HIV infection'], refs: ['KOMS-2024-088120'] },
      { ui: 'D014611', name: 'Vaccination', qualifiers: [], kind: 'minor', conf: 0.66, evidence: ['post-exposure vaccination'], refs: [] },
      { ui: 'D012189', name: 'Retrospective Studies', qualifiers: [], kind: 'minor', conf: 0.93, evidence: ['retrospectively analyzed'], refs: [] },
      { ui: 'D016428', name: 'Journal Article', qualifiers: [], kind: 'pubtype', conf: 0.99, evidence: [], refs: [] },
      { ui: 'D006801', name: 'Humans', qualifiers: [], kind: 'check', conf: 0.99, evidence: ['patients'], refs: [] },
      { ui: 'D056910', name: 'Republic of Korea', qualifiers: [], kind: 'geo', conf: 0.96, evidence: ['Korea'], refs: [] },
    ],
  },
  {
    id: 'p2', koms: 'KOMS-2026-104533', journal: 'Diabetes Metab J', year: 2026, indexedAt: '2026-10-05 08:13', procSec: 2.8, status: '검수대기',
    title: 'Polygenic risk score improves prediction of incident type 2 diabetes in Korean adults: a community-based cohort study',
    abstract: 'Using data from a prospective community-based cohort of 8,840 Korean adults, we constructed a polygenic risk score from genome-wide association study summary statistics. During a median follow-up of 12 years, participants in the top decile had a 2.4-fold higher risk of type 2 diabetes. Adding the score to clinical risk factors improved discrimination, especially in adults younger than 50 years. East Asian-specific variants contributed substantially to risk prediction.',
    terms: [
      { ui: 'D003924', name: 'Diabetes Mellitus, Type 2', qualifiers: ['genetics', 'epidemiology'], kind: 'major', star: true, conf: 0.98, evidence: ['type 2 diabetes'], refs: ['KOMS-2025-090211'] },
      { ui: 'D000090502', name: 'Multifactorial Inheritance', qualifiers: [], kind: 'major', conf: 0.71, evidence: ['polygenic risk score'], refs: ['KOMS-2024-083377'] },
      { ui: 'D055106', name: 'Genome-Wide Association Study', qualifiers: [], kind: 'major', star: true, conf: 0.89, evidence: ['genome-wide association study'], refs: ['KOMS-2025-090211'] },
      { ui: 'D015995', name: 'Prevalence', qualifiers: [], kind: 'minor', conf: 0.41, evidence: [], refs: [] },
      { ui: 'D011446', name: 'Prospective Studies', qualifiers: [], kind: 'minor', conf: 0.9, evidence: ['prospective'], refs: [] },
      { ui: 'D015331', name: 'Cohort Studies', qualifiers: [], kind: 'minor', conf: 0.87, evidence: ['cohort'], refs: [] },
      { ui: 'D044466', name: 'Asian People', qualifiers: ['genetics'], kind: 'minor', conf: 0.63, evidence: ['East Asian-specific'], refs: [] },
      { ui: 'D016428', name: 'Journal Article', qualifiers: [], kind: 'pubtype', conf: 0.99, evidence: [], refs: [] },
      { ui: 'D006801', name: 'Humans', qualifiers: [], kind: 'check', conf: 0.99, evidence: ['adults'], refs: [] },
      { ui: 'D000328', name: 'Adult', qualifiers: [], kind: 'check', conf: 0.92, evidence: ['adults'], refs: [] },
      { ui: 'D056910', name: 'Republic of Korea', qualifiers: [], kind: 'geo', conf: 0.95, evidence: ['Korean'], refs: [] },
    ],
  },
  {
    id: 'p3', koms: 'KOMS-2026-104560', journal: 'Public Health Wkly Rep', year: 2026, indexedAt: '2026-10-05 08:15', procSec: 3.9, status: '검수대기',
    title: 'Trends in carbapenem resistance among Enterobacterales from the national antimicrobial resistance surveillance system, 2020–2025',
    abstract: 'The national antimicrobial resistance surveillance system collects blood and urine isolates from participating hospitals according to WHO GLASS methodology. Between 2020 and 2025, carbapenem resistance in Klebsiella pneumoniae increased from 4.1% to 9.8%, while Escherichia coli remained below 1%. Continued surveillance and antimicrobial stewardship programs are needed.',
    terms: [
      { ui: 'D000073182', name: 'Carbapenem-Resistant Enterobacteriaceae', qualifiers: ['isolation & purification'], kind: 'major', star: true, conf: 0.93, evidence: ['carbapenem resistance', 'Enterobacterales'], refs: ['KOMS-2025-090877'] },
      { ui: 'D062486', name: 'Population Surveillance', qualifiers: ['methods'], kind: 'major', conf: 0.86, evidence: ['surveillance system'], refs: [] },
      { ui: 'D007711', name: 'Klebsiella pneumoniae', qualifiers: ['drug effects'], kind: 'minor', conf: 0.84, evidence: ['Klebsiella pneumoniae'], refs: [] },
      { ui: 'D004926', name: 'Escherichia coli', qualifiers: ['drug effects'], kind: 'minor', conf: 0.8, evidence: ['Escherichia coli'], refs: [] },
      { ui: 'D000076206', name: 'Antimicrobial Stewardship', qualifiers: [], kind: 'minor', conf: 0.72, evidence: ['antimicrobial stewardship'], refs: [] },
      { ui: 'D016428', name: 'Journal Article', qualifiers: [], kind: 'pubtype', conf: 0.99, evidence: [], refs: [] },
      { ui: 'D006801', name: 'Humans', qualifiers: [], kind: 'check', conf: 0.97, evidence: [], refs: [] },
      { ui: 'D056910', name: 'Republic of Korea', qualifiers: [], kind: 'geo', conf: 0.82, evidence: ['national'], refs: [] },
    ],
  },
  {
    id: 'p4', koms: 'KOMS-2026-104571', journal: 'Tuberc Respir Dis', year: 2026, indexedAt: '2026-10-05 08:16', procSec: 2.5, status: '승인',
    title: 'Completion rate of latent tuberculosis infection treatment among healthcare workers',
    abstract: 'We evaluated treatment completion among healthcare workers diagnosed with latent tuberculosis infection. Short-course rifamycin-based regimens showed higher completion rates than 9-month isoniazid.',
    terms: [
      { ui: 'D000071997', name: 'Latent Tuberculosis', qualifiers: ['drug therapy'], kind: 'major', star: true, conf: 0.96, evidence: ['latent tuberculosis infection'], refs: [] },
      { ui: 'D006282', name: 'Health Personnel', qualifiers: [], kind: 'major', conf: 0.9, evidence: ['healthcare workers'], refs: [] },
      { ui: 'D055118', name: 'Medication Adherence', qualifiers: [], kind: 'minor', conf: 0.78, evidence: ['treatment completion'], refs: [] },
      { ui: 'D016428', name: 'Journal Article', qualifiers: [], kind: 'pubtype', conf: 0.99, evidence: [], refs: [] },
    ],
  },
  {
    id: 'p5', koms: 'KOMS-2026-104588', journal: 'Epidemiol Health', year: 2026, indexedAt: '2026-10-05 08:17', procSec: 4.1, status: '반려',
    title: 'Seasonal influenza vaccine effectiveness among older adults, 2025–2026 season',
    abstract: 'A test-negative design was used to estimate influenza vaccine effectiveness among adults aged 65 years and older.',
    terms: [
      { ui: 'D007252', name: 'Influenza Vaccines', qualifiers: ['administration & dosage'], kind: 'major', star: true, conf: 0.95, evidence: ['influenza vaccine'], refs: [] },
      { ui: 'D007251', name: 'Influenza, Human', qualifiers: ['prevention & control'], kind: 'major', conf: 0.93, evidence: ['influenza'], refs: [] },
      { ui: 'D000368', name: 'Aged', qualifiers: [], kind: 'check', conf: 0.94, evidence: ['65 years and older'], refs: [] },
    ],
  },
]

export const MESH_DICT: { ui: string; name: string; tree: string }[] = [
  { ui: 'D000096782', name: 'Mpox (Monkeypox)', tree: 'C01.925.256.743.615' },
  { ui: 'D007539', name: 'Patient Isolation', tree: 'E02.760.611' },
  { ui: 'D015334', name: 'Contact Tracing', tree: 'N06.850.490.250' },
  { ui: 'D017445', name: 'Quarantine', tree: 'N06.850.780.680' },
  { ui: 'D015994', name: 'Incidence', tree: 'E05.318.308.985.525.375' },
  { ui: 'D012307', name: 'Risk Factors', tree: 'E05.318.740.872' },
  { ui: 'D018570', name: 'Risk Assessment', tree: 'E05.318.740.500' },
  { ui: 'D003924', name: 'Diabetes Mellitus, Type 2', tree: 'C18.452.394.750.149' },
  { ui: 'D020022', name: 'Genetic Predisposition to Disease', tree: 'G05.380.355' },
  { ui: 'D000090502', name: 'Multifactorial Inheritance', tree: 'G05.380.574' },
  { ui: 'D014611', name: 'Vaccination', tree: 'E05.478.550.870' },
  { ui: 'D064449', name: 'Post-Exposure Prophylaxis', tree: 'E02.800.500' },
  { ui: 'D016867', name: 'Immunocompromised Host', tree: 'G12.425.500' },
  { ui: 'D024881', name: 'Drug Resistance, Bacterial', tree: 'G06.225.500' },
  { ui: 'D062486', name: 'Population Surveillance', tree: 'N06.850.520.308.940.718' },
  { ui: 'D000368', name: 'Aged', tree: 'M01.060.116.100' },
]

export const DAILY = {
  labels: ['9/29', '9/30', '10/1', '10/2', '10/3', '10/4', '10/5'],
  approved: [41, 38, 46, 22, 0, 0, 12],
  rejected: [4, 6, 3, 2, 0, 0, 1],
  pending: [0, 0, 0, 0, 0, 0, 18],
  auto: [412, 380, 455, 230, 0, 0, 318],
}
