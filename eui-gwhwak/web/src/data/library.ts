// SFR-03 통합전자도서관 목업 데이터

export type BookType = '단행본' | '보고서' | '연속간행물' | '비도서' | '전자자료'
export type Book = {
  id: string
  type: BookType
  title: string
  author: string
  publisher: string
  year: number
  subject: string
  callNo: string
  location: string
  status: '대출가능' | '대출중' | '열람전용' | '원문제공'
  due?: string
  lang: '국문' | '영문'
}

export const BOOKS: Book[] = [
  { id: 'b1', type: '단행본', title: '감염병 역학의 이해', author: '김정연', publisher: '보건의학사', year: 2023, subject: '감염병', callNo: '614.4 김74ㄱ', location: '제1자료실', status: '대출가능', lang: '국문' },
  { id: 'b2', type: '보고서', title: '국가 감염병 위기대응 체계 개선 연구', author: '국립보건연구원', publisher: '국립보건연구원', year: 2024, subject: '감염병', callNo: 'R 614.4 국12', location: '보고서실', status: '원문제공', lang: '국문' },
  { id: 'b3', type: '연속간행물', title: '주간 건강과 질병 제18권', author: '질병관리청', publisher: '질병관리청', year: 2025, subject: '공중보건', callNo: 'P 610.5 주15', location: '연속간행물실', status: '열람전용', lang: '국문' },
  { id: 'b4', type: '단행본', title: 'Principles of Epidemiology in Public Health Practice', author: 'Dicker, R.', publisher: 'Public Health Press', year: 2022, subject: '감염병', callNo: '614.4 D554p', location: '제2자료실', status: '대출중', due: '2026-10-14', lang: '영문' },
  { id: 'b5', type: '단행본', title: '유전체 역학과 정밀의료', author: '박선영', publisher: '의학서원', year: 2024, subject: '유전체', callNo: '616.042 박54ㅇ', location: '제1자료실', status: '대출가능', lang: '국문' },
  { id: 'b6', type: '보고서', title: '한국인 2형 당뇨병 유전체 코호트 기반 위험 유전변이 발굴', author: '국립보건연구원', publisher: '국립보건연구원', year: 2025, subject: '유전체', callNo: 'R 616.462 국294', location: '보고서실', status: '원문제공', lang: '국문' },
  { id: 'b7', type: '비도서', title: '감염관리 실무 교육 영상 (DVD)', author: '대한감염관리간호사회', publisher: '대한감염관리간호사회', year: 2021, subject: '감염관리', callNo: 'AV 614.44 대92', location: '멀티미디어실', status: '대출가능', lang: '국문' },
  { id: 'b8', type: '전자자료', title: 'The Lancet Infectious Diseases (전자저널)', author: 'Elsevier', publisher: 'Elsevier', year: 2026, subject: '감염병', callNo: 'E-Journal', location: '온라인', status: '원문제공', lang: '영문' },
  { id: 'b9', type: '단행본', title: '항생제 내성의 과학', author: '이민호', publisher: '생명과학사', year: 2022, subject: '항생제 내성', callNo: '615.329 이38ㅎ', location: '제1자료실', status: '대출중', due: '2026-10-09', lang: '국문' },
  { id: 'b10', type: '보고서', title: '국가 항생제 내성균 감시체계 운영 결과 보고', author: '질병관리청', publisher: '질병관리청', year: 2025, subject: '항생제 내성', callNo: 'R 615.329 질47', location: '보고서실', status: '원문제공', lang: '국문' },
  { id: 'b11', type: '단행본', title: 'Genomic Medicine: Principles and Practice', author: 'Kumar, D.', publisher: 'Oxford Medical', year: 2023, subject: '유전체', callNo: '616.042 K96g', location: '제2자료실', status: '대출가능', lang: '영문' },
  { id: 'b12', type: '연속간행물', title: 'Osong Public Health and Research Perspectives Vol.16', author: '질병관리청', publisher: '질병관리청', year: 2025, subject: '공중보건', callNo: 'P 610.5 O82', location: '연속간행물실', status: '열람전용', lang: '영문' },
]

export const TYPE_COLOR: Record<BookType, string> = {
  단행본: '#0b5cad', 보고서: '#0f8b7e', 연속간행물: '#e08a1e', 비도서: '#6b4bb8', 전자자료: '#c0362c',
}

export const MY_LOANS = [
  { id: 'b4', loanedAt: '2026-09-23', due: '2026-10-14', extended: 0 },
  { id: 'b9', loanedAt: '2026-09-18', due: '2026-10-09', extended: 1 },
]
export const MY_RESERVES = [{ id: 'b5', reservedAt: '2026-10-01', rank: 1 }]

export const MODULES = ['수서', '정리', '계속자료관리', '대출반납', '이용자관리', '콘텐츠관리', '전자자료관리', '신청관리', '이용자서비스관리', '경영지원서비스', '시스템관리']
