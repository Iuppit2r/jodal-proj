/* 제안서용 노트북 목업 생성기.
   1) 콘솔 화면을 상태까지 맞춰 캡처하고
   2) 노트북 프레임에 합성해 PNG 로 떨어뜨린다.
   실행: node shots.mjs   (개발 서버가 BASE 에 떠 있어야 한다) */

import puppeteer from 'puppeteer-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE ?? 'http://localhost:5179'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const RAW = resolve(HERE, 'raw')
const OUT = resolve(HERE, 'out')
const W = 1600, H = 1000

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* 화면 안에서 쓰는 도우미들. 브라우저 쪽에서 실행된다. */
const helpers = {
  /* 글자로 요소를 찾아 누른다. 선택자가 흔들려도 버티게 하려는 것. */
  async clickText(page, text, sel = 'button, .tab, summary, .nav-sub-item, .nav-item, .pipe-card, a') {
    const ok = await page.evaluate((t, s) => {
      const el = [...document.querySelectorAll(s)].find(x => x.textContent.trim().includes(t))
      if (!el) return false
      el.scrollIntoView({ block: 'center' })
      el.click()
      return true
    }, text, sel)
    if (!ok) {
      const n = await page.evaluate(sl => document.querySelectorAll(sl).length, sel)
      const u = page.url()
      console.warn('  (못 찾음) clickText:', text, '| 후보', n, '|', u)
    }
    await sleep(450)
    return ok
  },
  /* 접힌 영역 펼치기 */
  async openFold(page, title) {
    const ok = await page.evaluate(t => {
      const d = [...document.querySelectorAll('details.fold')]
        .find(x => x.querySelector('summary')?.textContent.includes(t))
      if (!d) return false
      d.open = true
      d.scrollIntoView({ block: 'center' })
      return true
    }, title)
    if (!ok) {
      const t = await page.evaluate(() => [...document.querySelectorAll('details.fold summary b')].map(x => x.textContent))
      console.warn('  (못 찾음) openFold:', title, '| 있는 것', JSON.stringify(t), '|', page.url())
    }
    await sleep(350)
    return ok
  },
  async scrollTo(page, y) {
    await page.evaluate(v => window.scrollTo(0, v))
    await sleep(250)
  },
  /* 화면 안 스크롤 영역(.content)을 내린다 */
  async scrollContent(page, y) {
    await page.evaluate(v => { const c = document.querySelector('.content'); if (c) c.scrollTop = v }, y)
    await sleep(300)
  },
}

/* ---------- 목업 목록. RFP 배점 항목에 맞춰 고른다. ---------- */
const SHOTS = [
  {
    id: '00-login', title: '기관 통합 인증 로그인 (SER-002)',
    score: '보안 · SSO (8점)',
    path: '/',
    async act(page) {
      await page.evaluate(() => document.querySelector('button[title="로그아웃"]')?.click())
      await sleep(700)
    },
  },
  {
    id: '01-home', title: '통합 콘솔 홈',
    score: '사업 이해도 · UI/UX 일관성',
    path: '/',
  },
  {
    id: '02-fast', title: '빠른 실행 (SFR-001)',
    score: 'UI/UX 및 운영 편의성',
    path: '/fast',
  },
  {
    id: '03-setup-wizard', title: '고급 설정 (SFR-002~007)',
    score: '기능 구현 · UI/UX',
    path: '/setup',
  },
  {
    id: '04-setup-expert', title: '전문가 파라미터와 잔기 선택 (SFR-003, SFR-005)',
    score: '기능 구현방안',
    path: '/setup',
    async act(page, h) {
      await h.clickText('전문가', '.step')
      await h.scrollContent(900)
      await h.scrollContent(420)
    },
  },
  {
    id: '05-dag', title: '흐름 설계 자유형 DAG (SFR-011)',
    score: 'SFR-011 자유형 DAG · 워크플로 자유도 (10점)',
    path: '/dag',
  },
  {
    id: '06-dag-inspector', title: 'DAG 노드 설정 (SFR-011)',
    score: 'SFR-011 조건 분기 · 사용자 정의 평가',
    path: '/dag',
    async act(page) {
      await page.evaluate(() => {
        const n = [...document.querySelectorAll('.dag-node')].find(x => x.textContent.includes('SoluProt'))
        n?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        n?.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
        n?.click()
      })
      await sleep(500)
    },
  },
  {
    id: '07-workflow-studio', title: '단계별 실행 (SFR-010)',
    score: 'SFR-010 체크포인트 실행 제어',
    path: '/workflow/ws_0421_a',
  },
  {
    id: '08-monitor-detail', title: '실행 모니터 상세와 검토 게이트 (SFR-010)',
    score: 'SFR-010 검토 게이트 · SFR-023 모니터링',
    path: '/monitor/run_0421',
  },
  {
    id: '09-monitor-graph', title: '실행 그래프',
    score: '워크플로 실행 상태 표시',
    path: '/monitor/run_0421',
    async act(page, h) {
      await h.scrollContent(900)
    },
  },
  {
    id: '10-monitor-agent', title: 'Agent Panel 자동 해석 (SFR-020)',
    score: 'SFR-020 Agent Panel 후속 조치 추천',
    path: '/monitor/run_0421',
    async act(page, h) {
      await h.clickText('Evidence Agent Panel', '.tab')
      await h.scrollContent(900)
    },
  },
  {
    id: '11-analyze-hits', title: '후보 선별 Hit List (SFR-015)',
    score: 'SFR-015 Hit List (8점)',
    path: '/analyze',
  },
  {
    id: '12-analyze-compare', title: '구조 · 서열 비교 (SFR-008, SFR-015)',
    score: 'SFR-008 WT Diff · SFR-015 Compare (8점)',
    path: '/analyze/compare',
  },
  {
    id: '13-analyze-report', title: '보고서 작성과 내보내기 (SFR-009, SFR-019)',
    score: 'SFR-009 자동 리포트 · SFR-019 다운로드 (8점)',
    path: '/analyze/report',
  },
  {
    id: '14-copilot', title: 'Copilot 자연어 제어 (SFR-014)',
    score: 'SFR-014 Copilot (8점)',
    path: '/monitor/run_0421',
    copilot: true,
    async act(page, h) {
      await h.clickText('지금 실행 결과를 해석해줘', '.chip')
      await sleep(1200)
    },
  },
  {
    role: 'admin',
    id: '16-models', title: '모델 레지스트리 등록 모델 (SFR-012)',
    score: '모델 관리 및 확장성 (10점)',
    path: '/models',
  },
  {
    role: 'admin',
    id: '17-model-detail', title: '모델 버전 이력과 입출력 스키마',
    score: '버전관리 · 재현성',
    path: '/models/rfdiffusion3',
  },
  {
    role: 'admin',
    id: '18-providers', title: '실행 제공자 교체 (SFR-012, SIR-003)',
    score: '모델 교체 · 확장방안 (10점)',
    path: '/models/providers',
  },
  {
    id: '19-mcp', title: 'MCP 연결 (SFR-013, SIR-001)',
    score: '연계 아키텍처 (10점)',
    path: '/mcp',
  },
  {
    id: '20-mcp-tools', title: 'MCP 도구 목록 (SFR-013)',
    score: '외부 도구 확장방안',
    path: '/mcp/tools',
  },
  {
    role: 'admin',
    id: '21-runpod', title: 'RunPod GPU 운영 (SFR-016)',
    score: '운영도구 편의성 (7점)',
    path: '/gpu',
  },
  {
    role: 'admin',
    id: '22-runpod-usage', title: 'GPU 사용량과 지출 (SFR-016)',
    score: '운영 관제',
    path: '/gpu/usage',
  },
  {
    role: 'admin',
    id: '23-admin-users', title: '사용자 승인과 역할 부여 (SER-001, SER-008)',
    score: '보안 및 접근통제 (8점)',
    path: '/admin',
  },
  {
    role: 'admin',
    id: '24-admin-roles', title: '역할 기반 접근제어 (SER-001)',
    score: 'RBAC (8점)',
    path: '/admin/roles',
  },
  {
    role: 'admin',
    id: '25-admin-audit', title: '감사 로그 (SER-007, DAR-008)',
    score: '감사로그 (8점)',
    path: '/admin/audit',
  },
  {
    id: '26-projects', title: '프로젝트 · 라운드 (SFR-018)',
    score: '품질 · 재현성 (7점)',
    path: '/projects/prj_gfp',
  },
  {
    role: 'viewer',
    id: '27-role-viewer', title: '역할별 접근 제한 (SER-001)',
    score: 'RBAC 실제 적용 (8점)',
    path: '/',
  },
  {
    id: '28-round-versions', title: '라운드 결과 버전과 재현 정보 (SFR-025, DAR-001)',
    score: '형상 · 버전관리 · 재현성 (7점)',
    path: '/projects/prj_gfp/rounds/rnd_gfp_3',
    async act(page, h) {
      await h.scrollContent(1500)
    },
  },
  {
    id: '29-project-access', title: '프로젝트 조회 권한 (SER-001)',
    score: '접근통제 · 품질 기준 관리',
    path: '/projects/prj_gfp',
    async act(page, h) {
      await h.scrollContent(700)
    },
  },
  /* ---------- 목차 섹션을 채우기 위해 추가한 컷 ---------- */
  {
    role: 'admin',
    id: '31-data-store', title: '데이터 저장소와 스키마 (DAR-004, DAR-009)',
    score: 'III-2 데이터 구조 및 마이그레이션',
    path: '/admin/data',
  },
  {
    role: 'admin',
    id: '32-migration', title: '레거시 마이그레이션 (DAR-007)',
    score: 'III-2 데이터 구조 및 마이그레이션',
    path: '/admin/migration',
  },
  {
    id: '33-binding', title: '결합 예측 결과 (SFR-021)',
    score: 'III-9 안정화 · 결합 예측 파이프라인',
    path: '/analyze/binding',
  },
  {
    role: 'admin',
    id: '34-jobs', title: '작업 큐와 스케줄링 (SFR-022)',
    score: 'III-12 운영 도구 및 모니터링',
    path: '/jobs',
  },
  {
    role: 'admin',
    id: '35-perf', title: '동시접속 안정화 (SFR-024)',
    score: 'IV-3 품질보증 및 테스트 방안',
    path: '/perf',
  },
  {
    id: '36-tutorial', title: '단계별 사용 교육 (PSR-001)',
    score: 'V-1 교육 및 기술이전',
    path: '/',
    async act(page) {
      await page.evaluate(() => document.querySelector('button[title="튜토리얼"]')?.click())
      await sleep(900)
    },
  },

  /* ---------- 같은 화면을 다른 섹션에서 쓸 때를 위한 상태 변형 ---------- */
  {
    role: 'admin',
    id: '37-provider-edit', title: 'provider 종류 교체',
    score: 'III-6 모델 교체 · 확장 (18번과 다른 상태)',
    path: '/models/providers',
    async act(page, h) {
      await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.tbl tbody tr')]
        rows.find(r => r.textContent.includes('colabfold'))?.click()
      })
      await sleep(600)
      await h.scrollContent(420)
    },
  },
  {
    role: 'admin',
    id: '38-runpod-detail', title: '엔드포인트 설정 패치',
    score: 'III-6 실행 환경 최적화 (21번과 다른 상태)',
    path: '/gpu/ep_rfd3_a100',
    async act(page, h) {
      await h.scrollContent(1200)
      await h.scrollContent(900)
    },
  },
  {
    id: '39-home-context', title: '프로젝트 단위 작업 맥락',
    score: 'III-11 통합 콘솔 UI/UX (01번과 다른 상태)',
    path: '/',
    async act(page, h) {
      await h.scrollContent(500)
    },
  },
  {
    role: 'admin',
    id: '40-models-register', title: '신규 모델 등록 (SER-008)',
    score: 'III-5 모델 등록 (16번과 다른 상태)',
    path: '/models',
    async act(page, h) {
      await h.clickText('모델 등록', '.btn')
      await sleep(600)
    },
  },
  /* ---------- RFP 요구사항 중 아직 컷이 없던 화면 ---------- */
  {
    id: '41-security', title: '보안 운영 기준 (SER-003~006)',
    role: 'admin',
    score: 'SER-003 저장 암호화 · SER-004 전송 암호화 · SER-005 시크릿 · SER-006 실행 노드 격리',
    path: '/admin/security',
  },
  {
    id: '42-rest-api', title: 'REST API 경로와 인증 (SIR-002)',
    score: 'SIR-002 HTTP Tool API · OpenAPI 제공',
    path: '/rest',
  },
  {
    id: '43-api-keys', title: 'API 키와 연계 계정 (SIR-005)',
    score: 'SIR-005 외부 AI · 에이전트 접근 인증',
    path: '/keys',
  },
  {
    id: '44-tasks', title: '라운드 태스크와 피드백 (SFR-018)',
    score: 'SFR-018 프로젝트 · 라운드 · 태스크 · 피드백',
    path: '/projects/prj_gfp/rounds/rnd_gfp_3',
  },
  {
    id: '45-dataset', title: '파생 데이터셋 추출 (DAR-005, DAR-006)',
    score: 'DAR-005 비교 · 피드백 축적 · DAR-006 AI 학습용 데이터셋',
    path: '/projects/prj_gfp',
    async act(page, h) {
      await h.scrollContent(1400)
    },
  },
  {
    id: '46-records', title: '피드백 · 실험 기록 (DAR-005)',
    score: 'DAR-005 비교 · 랭킹 · 피드백 · 실험 데이터셋',
    path: '/analyze/records',
  },
  {
    id: '47-run-meta', title: '실행 파라미터와 모델 버전 (DAR-002)',
    score: 'DAR-002 입력 · 파라미터 · 모델 버전 메타데이터',
    path: '/monitor/run_0421',
    async act(page, h) {
      await h.clickText('실행 파라미터', '.tab')
      await h.scrollContent(600)
    },
  },
  {
    id: '48-fork', title: 'fork 실행 분기 (SFR-017)',
    score: 'SFR-017 Fork 실행 제어',
    path: '/projects/prj_gfp/rounds/rnd_gfp_3',
    async act(page, h) {
      await h.scrollContent(800)
    },
  },
  {
    id: '49-stage-gate', title: '단계 점검과 재실행 판단 (SFR-006, SFR-007)',
    score: 'SFR-006 SoluProt 필터 · SFR-007 AF2 신뢰도 검증',
    path: '/workflow/ws_0421_a',
    async act(page, h) {
      await h.scrollContent(1100)
    },
  },
  {
    id: '50-backbone', title: '백본 생성 설정 (SFR-004)',
    score: 'SFR-004 입력 백본 관리 · 다중 백본 생성',
    path: '/setup',
    async act(page, h) {
      await h.clickText('기준', '.step')
      await h.scrollContent(500)
    },
  },
  {
    id: '51-schema', title: '모델 입출력 스키마 (DAR-003, SIR-004)',
    role: 'admin',
    score: 'DAR-003 Model Registry 저장소 · SIR-004 외부 자원 연계',
    path: '/models/colabfold',
    async act(page, h) {
      await h.scrollContent(900)
    },
  },
  {
    id: '52-cath', title: 'CATH 벤치마크 검증',
    role: 'admin',
    score: 'QUR-001 재현성 · TER-001 시나리오 테스트',
    path: '/cath',
  },
  {
    id: '53-templates', title: '워크플로 템플릿 재사용 (SFR-011)',
    score: 'SFR-011 템플릿 저장과 재사용',
    path: '/templates',
  },
  {
    id: '54-overview', title: '기관 전체 운영 현황 (SFR-023)',
    role: 'admin',
    score: 'SFR-023 시스템 모니터링 및 관측성',
    path: '/overview',
  },
]

async function main() {
  await mkdir(RAW, { recursive: true })
  await mkdir(OUT, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    defaultViewport: { width: W, height: H, deviceScaleFactor: 2 },
    args: ['--hide-scrollbars', '--force-device-scale-factor=2'],
  })

  const page = await browser.newPage()
  const h = {
    clickText: (t, s) => helpers.clickText(page, t, s),
    openFold: t => helpers.openFold(page, t),
    scrollTo: y => helpers.scrollTo(page, y),
    scrollContent: y => helpers.scrollContent(page, y),
  }

  const index = []
  const problems = []

  for (const s of SHOTS) {
    process.stdout.write(`· ${s.id} ${s.title}\n`)
    const url = s.role && s.role !== 'researcher'
      ? `${BASE}/#${s.path}${s.path.includes('?') ? '&' : '?'}role=${s.role}`
      : `${BASE}/#${s.path}`
    await page.goto(url, { waitUntil: 'networkidle2' })
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(1500)
    /* Copilot 은 기본으로 닫혀 있으므로 필요한 컷에서만 연다 */
    await page.evaluate(open => {
      const btn = [...document.querySelectorAll('.topbar .btn')].find(b => b.textContent.includes('Copilot'))
      const isOpen = document.querySelector('.shell')?.classList.contains('copilot-open')
      if (btn && isOpen !== open) btn.click()
    }, Boolean(s.copilot))
    await sleep(400)
    if (s.act) await s.act(page, h)
    /* 주소나 권한이 어긋나면 안내 화면이 찍힌다. 조용히 넘어가지 않도록 여기서 막는다. */
    const bad = await page.evaluate(() => {
      /* 화면 전체가 안내로 대체된 경우만 문제로 본다.
         본문 안의 경고 문구(예: 없는 엔드포인트 알림)는 정상 화면이므로 거르지 않는다. */
      const t = document.querySelector('.main')?.textContent ?? ''
      if (t.includes('접근 권한이 없습니다')) return '권한 부족 (role 지정 필요)'
      const empty = document.querySelector('.main .empty')?.textContent ?? ''
      if (/찾을 수 없습니다|찾지 못했습니다/.test(empty)) return '주소의 항목 없음'
      const head = document.querySelector('.main .page-head-main p')?.textContent ?? ''
      if (/찾을 수 없습니다|찾지 못했습니다/.test(head)) return '주소의 항목 없음'
      return null
    })
    if (bad) { problems.push(`${s.id} · ${bad} · ${s.path}`); console.warn(`  (문제) ${bad}`) }
    const raw = resolve(RAW, `${s.id}.png`)
    await page.screenshot({ path: raw })
    index.push({ ...s, raw })
  }

  /* 노트북 프레임 합성 */
  const frame = await browser.newPage()
  await frame.setViewport({ width: 2000, height: 1300, deviceScaleFactor: 1.5 })
  for (const s of index) {
    await frame.goto(`file://${resolve(HERE, 'frame.html')}`, { waitUntil: 'load' })
    await frame.evaluate(p => { document.getElementById('shot').src = 'file://' + p }, s.raw)
    await frame.evaluate(() => new Promise(r => {
      const img = document.getElementById('shot')
      if (img.complete) r(); else img.onload = r
    }))
    await sleep(200)
    await frame.screenshot({ path: resolve(OUT, `${s.id}.png`) })
  }

  await browser.close()

  /* 자동 생성 목록. 사람이 쓴 배치표(제안서-이미지-배치표.md)는 건드리지 않는다. */
  const md = ['# 촬영 목록 (자동 생성)', '',
    '배치와 설명은 제안서-이미지-배치표.md 를 보세요.', '',
    '| No. | 파일 | 화면 | 대응 평가 항목 |', '|---|---|---|---|',
    ...index.map((s, i) => `| ${i + 1} | ${s.id}.png | ${s.title} | ${s.score} |`)].join('\n')
  await writeFile(resolve(OUT, 'INDEX.md'), md + '\n')
  console.log(`\n완료: ${index.length}장 → ${OUT}`)
  if (problems.length) {
    console.warn(`\n확인 필요 ${problems.length}건:`)
    for (const p of problems) console.warn('  ·', p)
    process.exitCode = 1
  }
}

main().catch(e => { console.error(e); process.exit(1) })
