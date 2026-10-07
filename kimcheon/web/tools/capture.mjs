// 제안서용 화면 캡처 – 사용자 앱(폰 목업 / 화면만) + 관리자(노트북 목업 / 전체 화면) + 인증카드 원본
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:5190/'
const OUT = new URL('../../capture', import.meta.url).pathname
const DIRS = { mock: '01_앱_폰목업', screen: '02_앱_화면만', lap: '03_관리자_노트북목업', full: '04_관리자_전체화면', card: '05_인증카드_원본', amob: '06_관리자_모바일' }
fs.rmSync(OUT, { recursive: true, force: true })
for (const d of Object.values(DIRS)) fs.mkdirSync(path.join(OUT, d), { recursive: true })

const index = [] // [구분, 파일, 설명, 관련]
const errs = []
let n = 0
const num = () => String(++n).padStart(3, '0')

const b = await chromium.launch()

// ───────────────────────── 사용자 앱 ─────────────────────────
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 3, locale: 'ko-KR' })
p.on('pageerror', (e) => errs.push('app: ' + e.message))
const wait = (ms) => p.waitForTimeout(ms)
const S = (code) => p.evaluate(code)
const app = async (mode = 'sample') => {
  await p.goto(`${BASE}?capture=1&start=${mode}`)
  await wait(1200)
}
const push = (r) => S(`window.__app.getState().push(${JSON.stringify(r)})`)
const tab = (t) => S(`window.__app.getState().setTab('${t}')`)
const scroll = async (y) => {
  await S(`(() => { const els = [...document.querySelectorAll('.screen .overflow-y-auto')].filter(e => e.offsetParent); const el = els[els.length - 1]; if (el) el.scrollTop = ${y} })()`)
  await wait(450)
}
const tiles = async () => {
  await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await wait(500)
}
const shot = async (section, name, desc, rel = '') => {
  const id = num()
  const file = `${id}_${name}.png`
  await S(`window.__app.setState({ toast: null })`)
  await p.locator('.phone').screenshot({ path: path.join(OUT, DIRS.mock, file), omitBackground: true })
  await p.locator('.screen').screenshot({ path: path.join(OUT, DIRS.screen, file), omitBackground: true })
  index.push([section, file, desc, rel])
}
const step = async (label, fn) => {
  try {
    await fn()
  } catch (e) {
    errs.push(`${label}: ${e.message.split('\n')[0]}`)
  }
}

// A. 시작 · 본인인증
await step('auth', async () => {
  const A = 'A. 시작 · 본인인증'
  await p.goto(`${BASE}?capture=1&start=empty`)
  await wait(500)
  await shot(A, '스플래시', '앱 실행 첫 화면 (오삼이 · 김천 100산)')
  await wait(1300)
  await shot(A, '첫실행안내_1_정상인증', '첫 실행 안내 1 – 정상에서 인증', 'SFR-005')
  await p.locator('.screen').getByRole('button', { name: '다음' }).click()
  await wait(500)
  await shot(A, '첫실행안내_2_스탬프_인증카드', '첫 실행 안내 2 – 스탬프 · 인증카드', '특화 1·2')
  await p.locator('.screen').getByRole('button', { name: '다음' }).click()
  await wait(500)
  await shot(A, '첫실행안내_3_관광연계', '첫 실행 안내 3 – 관광 연계', '특화 3')
  await p.locator('.screen').getByRole('button', { name: '시작하기' }).click()
  await wait(500)
  await shot(A, '로그인_본인인증선택', '김천시 본인인증(휴대폰 · 아이핀) 선택', 'SFR-004 본인인증')
  await p.locator('.screen').getByText('휴대폰 본인인증').click()
  await wait(500)
  await shot(A, '휴대폰본인인증_입력', '휴대폰 본인인증 – 정보 입력', 'SFR-004')
  await p.locator('.screen').getByText('인증번호 받기').click()
  await wait(1300)
  await p.locator('.screen button:has-text("[필수]")').click()
  await wait(300)
  await shot(A, '휴대폰본인인증_인증번호', '인증번호 입력 · 약관 동의', 'SFR-004')
  await p.locator('.screen').getByRole('button', { name: '인증 완료' }).click()
  await wait(500)
  await shot(A, '권한안내', '위치 · 카메라 · 알림 권한 안내', 'SFR-005')
  await p.goto(`${BASE}?capture=1&start=empty`)
  await wait(1900)
  await p.locator('.screen').getByText('건너뛰기').click()
  await wait(400)
  await p.locator('.screen').getByText('아이핀 인증').click()
  await wait(500)
  await shot(A, '아이핀인증', '아이핀 인증', 'SFR-004')
})

// B. 홈
await step('home', async () => {
  const B = 'B. 홈'
  await app('sample')
  await shot(B, '홈_상단', '홈 – 산행여권 요약 · 다음 배지 · 오삼이 안내', '특화 1')
  await scroll(520)
  await shot(B, '홈_특화서비스_배지_가까운산', '홈 – 특화 3종 바로가기 · 완등 배지 · 가까운 미인증 산', '특화 1·2·3')
  await scroll(1050)
  await shot(B, '홈_관광미션_인증카드', '홈 – 진행 중 관광 미션 · 나의 인증카드', '특화 2·3')
  await scroll(1800)
  await shot(B, '홈_산꾼이야기_공지', '홈 – 인증카드 피드 · 공지사항', 'SFR-008')
  await app('thirty')
  await shot(B, '홈_30산달성', '홈 – 30산 달성 회원')
})

// C. 김천 100산
await step('mountains', async () => {
  const C = 'C. 김천 100산'
  await app('sample')
  await tab('mountains')
  await wait(500)
  await shot(C, '100산_목록', '김천 100산 목록 – 거리순 · 인증 여부 표시', 'SFR-005 인증 가능 산 목록')
  await p.locator('.screen button:has-text("금오")').first().click()
  await wait(400)
  await shot(C, '100산_권역필터', '산줄기 권역별 보기 (금오)', 'SFR-005')
  await p.locator('.screen button:has-text("전체 권역")').click()
  await p.locator('.screen button:has-text("지도")').first().click()
  await tiles()
  await shot(C, '100산_지도', '100산 지도 – 실제 정상 좌표, 인증 완료 표시', 'SFR-005')
  await p.locator('.screen button:has-text("목록")').first().click()
  await p.locator('.screen input').first().fill('설악')
  await wait(400)
  await shot(C, '100산_검색결과없음', '검색 결과 없음')
})

// D. 산 상세
await step('detail', async () => {
  const D = 'D. 산 상세'
  await app('sample')
  await push({ name: 'mountain', id: 'hwangak' })
  await wait(700)
  await shot(D, '산상세_황악산_상단', '산 상세 – 사진 · 높이 · 거리 · 인증 반경', 'SFR-008 산 소개')
  await scroll(560)
  await shot(D, '산상세_등산코스', '등산코스 – 들머리 · 거리 · 소요시간 · 난이도', 'SFR-008 등산코스')
  await scroll(980)
  await shot(D, '산상세_교통주차', '교통 · 주차 정보', 'SFR-008 교통·주차')
  await scroll(1320)
  await tiles()
  await shot(D, '산상세_주변관광', '하산 후 들르기 좋은 곳 – 지도 · 음식 · 숙박 · 관광지', 'SFR-007')
  await scroll(9999)
  await shot(D, '산상세_방명록_연계미션', '이 산 방명록 · 연계 관광 미션', 'SFR-008 · 특화 3')
  await push({ name: 'mountain', id: 'geumo' })
  await wait(700)
  await shot(D, '산상세_인증완료', '인증 완료한 산 – 스탬프 · 인증 일시 · 인증카드', 'SFR-005')
})

// E. 정상 인증
await step('certify', async () => {
  const E = 'E. 정상 인증'
  await app('sample')
  await S(`window.__app.getState().showPush({ title: '황악산 정상 근처에 도착했어요', body: '정상석 50m 안이에요. 지금 인증사진을 찍어보세요!', to: { name: 'certify', id: 'hwangak' } })`)
  await wait(600)
  await shot(E, '정상도착_푸시알림', '정상석 반경 진입 시 푸시 알림', 'SFR-005 푸시 알림')
  await S(`window.__app.getState().hidePush()`)
  await S(`window.__app.getState().setCertDemo('ok')`)
  await push({ name: 'certify', id: 'hwangak' })
  await wait(700)
  await shot(E, '인증카메라_촬영가능', '앱 카메라 – 정상석 50m 이내, 촬영 버튼 활성화', 'SFR-005 카메라 활성화')
  await S(`window.__app.getState().setCertDemo('far')`)
  await wait(300)
  await shot(E, '인증카메라_반경밖', '정상석 반경 밖 – 촬영 비활성', 'SFR-005')
  await S(`window.__app.getState().setCertDemo('nogps')`)
  await wait(300)
  await shot(E, '인증카메라_위치수신불가', '위치를 확인할 수 없을 때 안내', 'SFR-005')
  await S(`window.__app.getState().setCertDemo('offline')`)
  await wait(300)
  await shot(E, '인증카메라_인터넷끊김', '인터넷 끊김 – 기기 저장 후 자동 등록 안내', 'SFR-005')
  await p.locator('.screen button[aria-label="촬영"]').click()
  await wait(900)
  await shot(E, '인증_기기저장완료', '오프라인 촬영 – 기기 저장 완료', 'SFR-005')
  await p.locator('.screen').getByRole('button', { name: '확인' }).click()
  await wait(600)
  await S(`window.__app.getState().hidePush()`)
  await wait(300)
  await shot(E, '홈_등록대기', '홈 – 등록 대기 인증 알림', 'SFR-005')
  await app('sample')
  await S(`window.__app.getState().setCertDemo('ok')`)
  await push({ name: 'certify', id: 'hwangak' })
  await wait(600)
  await p.locator('.screen button[aria-label="촬영"]').click()
  await wait(4500)
  await shot(E, '인증완료_스탬프_배지', '인증 완료 – 10번째 스탬프 · 산행 입문 배지 획득', 'SFR-005 · 특화 1')
  await scroll(9999)
  await shot(E, '인증완료_관광추천', '인증 완료 – 연계 미션 · 주변 관광 추천', '특화 3 · SFR-007')
})

// F. 특화 1 – 디지털 산행여권
await step('passport', async () => {
  const F = 'F. 특화 1 · 디지털 산행여권'
  await app('sample')
  await tab('passport')
  await wait(600)
  await shot(F, '산행여권_표지_스탬프', '디지털 산행여권 – 표지 · 권역별 스탬프', '특화 1')
  await scroll(9999)
  await shot(F, '산행여권_관광스탬프', '관광 스탬프 – 우표형, 장소별 그림', '특화 1·3')
  await p.locator('.screen button:has-text("배지")').first().click()
  await wait(400)
  await scroll(330)
  await shot(F, '산행여권_단계별배지', '단계별 완등 배지 5 · 10 · 30 · 50 · 100산', '특화 1')
  await scroll(9999)
  await shot(F, '산행여권_권역_관광배지', '산줄기 권역 배지 · 관광 연계 배지', '특화 1·3')
  await app('thirty')
  await tab('passport')
  await wait(600)
  await scroll(330)
  await shot(F, '산행여권_30산', '30산 달성 회원의 스탬프', '특화 1')
  await p.locator('.screen button:has-text("배지")').first().click()
  await wait(400)
  await scroll(330)
  await shot(F, '산행여권_30산_배지', '30산 달성 회원의 배지', '특화 1')
})

// G. 특화 2 – 인증카드
await step('card', async () => {
  const G = 'G. 특화 2 · 완등 인증카드'
  await app('sample')
  await push({ name: 'card', id: 'geumo' })
  await wait(1800)
  await shot(G, '인증카드_포토스탬프', '완등 인증카드 – 포토 스탬프', '특화 2')
  const page = p.locator('.screen div.z-30').last()
  for (const [i, nm] of [
    [1, '풀사진'],
    [2, '산행여권'],
  ]) {
    await page.locator('.grid-cols-3 > button').nth(i).click()
    await wait(1200)
    await shot(G, `인증카드_${nm}`, `완등 인증카드 – ${nm} 디자인`, '특화 2')
  }
  await p.locator('.screen').getByRole('button', { name: '공유하기' }).click()
  await wait(500)
  await shot(G, '인증카드_공유', '카카오톡 · 인스타그램 · 밴드 공유', '특화 2')
  // 카드 원본 이미지
  for (const id of ['geumo', 'hwangak', 'sudo']) {
    await app('sample')
    if (id === 'hwangak') await S(`window.__app.getState().certify('hwangak')`)
    await push({ name: 'card', id })
    await wait(1500)
    const pg = p.locator('.screen div.z-30').last()
    for (const i of [0, 1, 2]) {
      await pg.locator('.grid-cols-3 > button').nth(i).click()
      await wait(1300)
      const src = await pg.locator('img[alt$="완등 인증카드"]').first().getAttribute('src')
      const f = `${id}_${['포토스탬프', '풀사진', '산행여권'][i]}.png`
      fs.writeFileSync(path.join(OUT, DIRS.card, f), Buffer.from(src.split(',')[1], 'base64'))
    }
  }
})

// H. 특화 3 – 관광 연계 미션
await step('mission', async () => {
  const H = 'H. 특화 3 · 관광 연계 미션'
  await app('sample')
  await tab('missions')
  await wait(500)
  await shot(H, '관광미션_목록', '관광 연계 미션 목록 · 진행 단계', '특화 3')
  await scroll(1150)
  await tiles()
  await shot(H, '관광미션_관광지도', '김천 관광지도 · 관광정보 목록', '특화 3 · SFR-007')
  await push({ name: 'mission', id: 'm-jikji' })
  await wait(500)
  await tiles()
  await shot(H, '미션상세_진행중', '미션 상세 – 산 인증 + 관광지 체크인 단계', '특화 3')
  await push({ name: 'mission', id: 'm-queen' })
  await wait(500)
  await tiles()
  await shot(H, '미션상세_완료', '미션 완료 – 관광 스탬프 획득', '특화 3')
  await app('sample')
  await push({ name: 'place', id: 'jikjisa' })
  await wait(500)
  await shot(H, '관광지상세_직지사', '관광지 상세 – 주소 · 전화 · 운영시간 · 길찾기', 'SFR-007')
  await scroll(9999)
  await tiles()
  await shot(H, '관광지상세_연계미션_주변산', '관광지 상세 – 연계 미션 · 가까운 100산', 'SFR-007 · 특화 3')
  await S(`window.__app.getState().certify('hwangak')`)
  await p.locator('.screen button:has-text("방문 체크인")').click()
  await wait(700)
  await shot(H, '관광스탬프_획득', '관광지 체크인 → 관광 스탬프 획득', '특화 3')
  await app('sample')
  await push({ name: 'place', id: 'jirye' })
  await wait(500)
  await shot(H, '음식점상세_지례흑돼지', '음식 정보 상세', 'SFR-007 음식점')
  await push({ name: 'place', id: 'forest' })
  await wait(500)
  await shot(H, '숙박상세_수도산자연휴양림', '숙박 정보 상세', 'SFR-007 숙박')
})

// I. 마이 · 인증서 · 기념품
await step('my', async () => {
  const I = 'I. 마이 · 인증서 · 기념품'
  await app('sample')
  await push({ name: 'my' })
  await wait(600)
  await shot(I, '마이_상단', '마이 – 요약 · 인증서·기념품 · 메뉴', 'SFR-005 · SFR-006')
  await scroll(9999)
  await shot(I, '마이_인증기록', '완등 인증 기록 – 촬영 일시 · 거리', 'SFR-005 인증 일시')
  await push({ name: 'photos' })
  await wait(500)
  await shot(I, '내인증사진', '내 인증사진 모아보기', 'SFR-005')
  await push({ name: 'photo', id: 'geumo' })
  await wait(500)
  await shot(I, '인증사진_상세', '인증사진 상세 – 촬영 일시 · 위치', 'SFR-005')
  await app('sample')
  await push({ name: 'reward' })
  await wait(500)
  await shot(I, '인증서신청_미완등', '완등 전 – 신청 버튼 비활성', 'SFR-005 신청 버튼 활성화 조건')
  await S(`window.__app.getState().completeAll()`)
  await wait(400)
  await shot(I, '인증서신청_완등', '100산 완등 – 신청서 · 기념품 선택', 'SFR-006')
  await scroll(9999)
  await p.locator('.screen').getByText('기념품 발송을 위한').click()
  await wait(300)
  await shot(I, '인증서신청_받는분정보', '신청서 – 이름 · 생년월일 · 연락처 · 수령일 · 주소 · 동의', 'SFR-006')
  await p.locator('.screen').getByRole('button', { name: '신청하기', exact: true }).click()
  await wait(600)
  await shot(I, '신청현황_신청완료', '신청 현황 – 신청 완료 · 수정 가능', 'SFR-006 본인 확인·수정')
  await S(`window.__app.setState((s) => ({ application: { ...s.application, status: 1 } }))`)
  await wait(300)
  await scroll(0)
  await shot(I, '신청현황_지급준비', '신청 현황 – 지급 준비', 'SFR-006')
  await push({ name: 'my' })
  await wait(500)
  await shot(I, '마이_신청후', '마이 – 신청 현황 표시', 'SFR-006')
})

// J. 게시판 · 알림
await step('board', async () => {
  const J = 'J. 게시판 · 알림'
  await app('sample')
  await push({ name: 'guestbook' })
  await wait(500)
  await shot(J, '방명록_목록', '방명록 – 산별 후기', 'SFR-008 방명록')
  await push({ name: 'guestPost', id: 'gb5' })
  await wait(500)
  await shot(J, '방명록_상세', '방명록 상세 – 본인인증 회원 · 댓글', 'SFR-008')
  await push({ name: 'guestWrite', mountainId: 'hwangak' })
  await wait(500)
  await p.locator('.screen input').first().fill('직지사 코스로 다녀왔어요')
  await p.locator('.screen textarea').first().fill('운수봉까지 완만하고 비로봉 직전이 조금 가파릅니다. 직지사 주차장이 넓어서 편했어요.')
  await wait(300)
  await shot(J, '방명록_글쓰기', '후기 쓰기 – 본인인증 회원만 작성', 'SFR-008 본인인증 후 작성')
  await app('sample')
  await push({ name: 'notices' })
  await wait(500)
  await shot(J, '공지사항_목록', '공지사항 목록', 'SFR-008 공지사항')
  await push({ name: 'notice', id: 'n1' })
  await wait(500)
  await shot(J, '공지사항_상세', '공지사항 상세', 'SFR-008')
  await app('sample')
  await push({ name: 'inbox' })
  await wait(500)
  await shot(J, '알림함', '알림함 – 도착 · 미션 · 공지 · 배지 알림', 'SFR-008 알림 서비스')
})

// K. 이용안내 · 설정 · 정책
await step('etc', async () => {
  const K = 'K. 이용안내 · 설정 · 정책'
  await app('sample')
  await push({ name: 'faq' })
  await wait(500)
  await shot(K, '이용안내_FAQ', '이용안내 · 자주 묻는 질문')
  await push({ name: 'settings' })
  await wait(500)
  await shot(K, '설정_알림권한', '알림 · 위치 · 카메라 권한 설정')
  await push({ name: 'terms', tab: 'service' })
  await wait(400)
  await shot(K, '약관_이용약관', '이용약관')
  await push({ name: 'terms', tab: 'privacy' })
  await wait(400)
  await shot(K, '약관_개인정보처리방침', '개인정보 처리방침', 'SFR-004 개인정보보호')
  await push({ name: 'withdraw' })
  await wait(400)
  await shot(K, '회원탈퇴', '회원 탈퇴')
  await app('closed')
  await shot(K, '인증기간종료_홈', '인증 기간 종료 – 홈 안내', 'SFR-009 기간 외 비활성')
  await push({ name: 'certify' })
  await wait(500)
  await shot(K, '인증기간종료_카메라', '인증 기간 종료 – 인증 비활성', 'SFR-009')
})

// ───────────────────────── 관리자 ─────────────────────────
const a = await b.newPage({ viewport: { width: 1700, height: 1150 }, deviceScaleFactor: 2, locale: 'ko-KR' })
const f = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'ko-KR' })
a.on('pageerror', (e) => errs.push('admin: ' + e.message))
f.on('pageerror', (e) => errs.push('adminfull: ' + e.message))
await a.goto(`${BASE}?capture=1&view=admin`)
await f.goto(`${BASE}?capture=1&view=admin&bare=1`)
await a.waitForTimeout(1000)
await f.waitForTimeout(1000)
let an = 0
const aid = () => String(++an).padStart(3, '0')
const AS = (pg, code) => pg.evaluate(code)
const ashot = async (name, desc, rel = '', opts = {}) => {
  const id = aid()
  const file = `${id}_${name}.png`
  for (const pg of [a, f]) await AS(pg, `window.__admin.setState({ toast: null })`)
  await a.locator('.lap-wrap').screenshot({ path: path.join(OUT, DIRS.lap, file), omitBackground: true })
  await f.screenshot({ path: path.join(OUT, DIRS.full, file), fullPage: !opts.modal })
  index.push(['관리자', file, desc, rel])
}
const both = async (fn) => {
  for (const pg of [a, f]) await fn(pg)
}
const go = async (page) => {
  await both((pg) => AS(pg, `window.__admin.getState().go('${page}')`))
  await both((pg) => pg.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {}))
  await a.waitForTimeout(600)
}
const click = async (fn) => {
  await both(async (pg) => {
    await fn(pg)
  })
  await a.waitForTimeout(500)
}
const scope = (pg) => (pg === a ? pg.locator('.lap-screen') : pg.locator('body'))

await step('admin', async () => {
  await ashot('관리자_로그인', '관리자 로그인 – 접속 주소 제한 · 계정 잠금 안내', 'SFR-002 관리자 권한')
  await both((pg) => AS(pg, `window.__admin.getState().login()`))
  await a.waitForTimeout(800)
  const pages = [
    ['dashboard', '대시보드', '대시보드 – 참여자 · 인증 · 완등자 · 지급 대기 · 방문자 · 인기 산', ''],
    ['rounds', '인증회차관리', '인증 회차 관리 – 회차명 · 인증기간 · 앱 활성 상태', 'SFR-009'],
    ['courses', '인증코스관리', '인증코스 관리 – 인증지점명 · 좌표 · 높이 · 반경 · 순서 정렬 · 지도', 'SFR-010'],
    ['certs', '인증현황관리', '인증현황 관리 – 회차 · 사용자명 · 산 · 인증 일시 · 인증사진 · 검색', 'SFR-011'],
    ['members', '회원관리', '회원 관리 – 본인인증 회원 · 인증 진행', 'SFR-004'],
    ['rewards', '인증물품관리', '인증물품 관리 – 등록 · 수정 · 삭제 · 사용여부 · 검색', 'SFR-012'],
    ['payments', '물품지급현황', '물품 지급 현황 – 물품별 신청자 · 지급 상태 관리 · 검색', 'SFR-013'],
    ['stats', '인증지점별통계', '인증지점별 통계 – 산별 · 연도별 · 권역별', 'SFR-014'],
    ['mountains', '산정보관리', '산 정보 관리 – 소개 · 등산코스 · 교통 · 주차 · 사진', 'SFR-008'],
    ['tourism', '관광정보연계', '관광정보 연계 – 문화관광 누리집 데이터 동기화 · 표시 거리', 'SFR-007'],
    ['missions', '관광미션_스탬프', '관광 미션 · 스탬프 – 미션 노출 · 달성 현황 · 인증카드 공유 통계', '특화 2·3'],
    ['boards', '게시판관리_공지', '게시판 관리 – 공지사항', 'SFR-002 · SFR-008'],
    ['menus', '메뉴콘텐츠관리', '메뉴 · 콘텐츠 관리 – 노출 · 순서 · 수정 이력 복원', 'SFR-002'],
    ['banners', '배너팝업관리', '배너 · 팝업 관리 – 노출 기간 · 노출 여부', 'SFR-002 프로그램 관리'],
    ['push', '푸시알림발송', '푸시 알림 발송 – 대상 · 예약 · 미리보기 · 발송 이력', 'SFR-008 알림 서비스'],
    ['admins', '관리자권한', '관리자 · 권한 – 계정 · 잠금 · 권한 그룹 · 접속 주소 제한', 'SFR-002'],
    ['logs', '접속작업이력', '접속 · 작업 이력', 'SFR-002 접속로그'],
    ['weblog', '웹로그분석', '웹로그 분석 – 일별 · 시간대 · 운영체제 · 메뉴별', 'SFR-003'],
    ['mapstatus', '지도서비스상태', '지도 서비스 상태 – 다중화 · 자동 전환', 'SFR-004 지도 다중화'],
  ]
  for (const [pg, name, desc, rel] of pages) {
    await go(pg)
    await ashot(name, desc, rel)
    try {
    if (pg === 'rounds') {
      await click((x) => scope(x).getByRole('button', { name: /회차 등록/ }).click())
      await ashot('인증회차_등록', '회차 등록 – 회차명 · 인증 시작일 · 종료일', 'SFR-009', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'courses') {
      await click((x) => scope(x).locator('main tbody tr').nth(5).locator('[aria-label="수정"]').click())
      await ashot('인증지점_수정', '인증지점 수정 – 봉우리명 · 위도 · 경도 · 높이 · 반경', 'SFR-010', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'certs') {
      await click((x) => scope(x).locator('main tbody tr').first().click())
      await ashot('인증현황_상세', '인증 상세 – 인증사진 · 촬영 위치 · 위치 검증', 'SFR-011', { modal: true })
      await click((x) => scope(x).getByRole('button', { name: '인증 반려' }).click())
      await ashot('인증현황_반려', '인증 반려 – 사유 선택 · 사용자 알림', 'SFR-011', { modal: true })
      await click(async (x) => {
        await x.locator('[aria-label="닫기"]').last().click()
        await x.waitForTimeout(200)
        await x.locator('[aria-label="닫기"]').first().click()
      })
      await click((x) => scope(x).locator('main').getByRole('button', { name: '사용자별 현황' }).click())
      await ashot('인증현황_사용자별', '사용자별 인증 현황 – 진행률 · 완등 여부', 'SFR-011')
      await click((x) => scope(x).getByRole('button', { name: '엑셀 내려받기' }).click())
      await ashot('개인정보_내려받기사유', '개인정보 내려받기 – 사유 입력 · 이력 기록', '개인정보보호', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'members') {
      await click((x) => scope(x).locator('main tbody tr').nth(2).click())
      await ashot('회원_상세', '회원 상세 – 본인인증 · 인증 이력', 'SFR-004', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'rewards') {
      await click((x) => scope(x).locator('main tbody tr').nth(1).getByRole('button', { name: /수정/ }).click())
      await ashot('인증물품_수정', '인증물품 수정 – 물품명 · 재고 · 사용여부', 'SFR-012', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'mountains') {
      await click((x) => scope(x).locator('main tbody tr').nth(5).click())
      await ashot('산정보_수정', '산 정보 수정 – 사진 · 소개 · 등산코스 · 교통 · 주차', 'SFR-008', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'boards') {
      await click((x) => scope(x).locator('main').getByRole('button', { name: /방명록/ }).click())
      await ashot('게시판관리_방명록', '게시판 관리 – 방명록 공개 · 숨김', 'SFR-008')
    }
    if (pg === 'banners') {
      await click((x) => scope(x).locator('main tbody tr').nth(1).click())
      await ashot('배너_미리보기', '배너 미리보기', 'SFR-002', { modal: true })
      await click((x) => x.locator('[aria-label="닫기"]').first().click())
    }
    if (pg === 'logs') {
      await click((x) => scope(x).locator('main').getByRole('button', { name: /개인정보 내려받기/ }).click())
      await ashot('개인정보_내려받기이력', '개인정보 내려받기 이력 – 관리자 · 사유 · 건수', '개인정보보호')
    }
    } catch (e) {
      errs.push(`admin extra ${pg}: ${e.message.split('\n')[0]}`)
      for (const x of [a, f]) for (let k = 0; k < 3; k++) await x.locator('[aria-label="닫기"]').first().click({ timeout: 800 }).catch(() => {})
    }
  }
})

// 관리자 모바일 웹 (관리 프로그램 – 모바일 웹)
await step('admin-mobile', async () => {
  const m = await b.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 3, locale: 'ko-KR' })
  await m.goto(`${BASE}?capture=1&view=admin`)
  await m.waitForTimeout(800)
  await m.evaluate(`window.__admin.getState().login()`)
  for (const [pg, name] of [
    ['dashboard', '대시보드'],
    ['payments', '물품지급현황'],
    ['certs', '인증현황'],
  ]) {
    await m.evaluate(`window.__admin.getState().go('${pg}')`)
    await m.waitForTimeout(700)
    await m.screenshot({ path: path.join(OUT, DIRS.amob, `관리자_모바일_${name}.png`) })
  }
  index.push(['관리자 모바일 웹', '06_관리자_모바일/*', '관리 프로그램 모바일 웹 화면 (대시보드 · 지급 현황 · 인증현황)', '관리 프로그램(모바일 웹)'])
})

// 목록 파일
const md = ['# 제안서용 화면 캡처 목록', '', '- 01_앱_폰목업: 아이폰 프레임 포함 (배경 투명 PNG, 3배 해상도)', '- 02_앱_화면만: 화면만 (배경 투명 PNG, 3배 해상도)', '- 03_관리자_노트북목업: 노트북 프레임 포함 (배경 투명 PNG, 2배 해상도)', '- 04_관리자_전체화면: 1440px 폭 관리자 화면, 긴 화면은 전체 길이 (2배 해상도)', '- 05_인증카드_원본: 앱이 생성하는 인증카드 원본 (1080×1350)', '- 06_관리자_모바일: 관리 프로그램 모바일 웹', '', '| No. | 구분 | 파일 | 화면 설명 | 관련 요구사항 · 특화 |', '|---|---|---|---|---|']
index.forEach(([s, file, d, r], i) => md.push(`| ${i + 1} | ${s} | ${file} | ${d} | ${r} |`))
fs.writeFileSync(path.join(OUT, '캡처목록.md'), md.join('\n'))
console.log('app', n, 'admin', an)
console.log(errs.join('\n') || 'no errors')
await b.close()
