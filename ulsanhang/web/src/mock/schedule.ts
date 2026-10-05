// 스케줄 예측 대시보드 목업 데이터 (실데이터 아님)

export const PORTS = ['울산본항', '온산항', '미포항', '울산신항'] as const
export type Port = (typeof PORTS)[number]

export type BarKind = 'actual' | 'pred' | 'delay'

export interface Vessel {
  id: string
  name: string
  callSign: string
  type: string
  gt: number
  loa: number
  flag: string
  /** 타임라인 시작(00시) 기준 시간(h) */
  start: number
  end: number
  kind: BarKind
  planEta: string
  predEta: string
  predEtd: string
  confidence: number
}

export interface Berth {
  id: string
  name: string
  cargo: string
  vessels: Vessel[]
}

const v = (id: string, name: string, type: string, gt: number, start: number, end: number, kind: BarKind, planEta: string, predEta: string, predEtd: string, confidence = 0.86): Vessel => ({
  id, name, callSign: `D${id.toUpperCase()}${gt % 97}`, type, gt, loa: Math.round(80 + gt / 450), flag: gt % 3 ? 'KOR' : 'PAN', start, end, kind, planEta, predEta, predEtd, confidence,
})

export const BERTHS: Record<Port, Berth[]> = {
  울산본항: [
    { id: 'b1', name: '1부두 1선석', cargo: '일반잡화', vessels: [v('a1', 'SEA DRAGON', '일반화물선', 12450, 0, 9, 'actual', '09-29 22:00', '09-29 22:15', '09-30 09:10'), v('a2', 'HANA GLORY', '일반화물선', 8420, 18.5, 24, 'pred', '09-30 17:00', '09-30 18:30', '10-01 06:00', 0.81)] },
    { id: 'b2', name: '2부두 2선석', cargo: '철강', vessels: [v('a3', 'POSCO PIONEER', '벌크선', 32100, 2, 15, 'actual', '09-30 01:30', '09-30 02:00', '09-30 15:20')] },
    { id: 'b3', name: '3부두 1선석', cargo: '컨테이너', vessels: [v('a4', 'KMTC ULSAN', '컨테이너선', 18800, 4, 12.5, 'actual', '09-30 04:00', '09-30 04:00', '09-30 12:30'), v('a5', 'DONGBANG No.7', '일반화물선', 5230, 21, 24, 'delay', '09-30 16:00', '09-30 21:10', '10-01 08:40', 0.72)] },
    { id: 'b4', name: '3부두 2선석', cargo: '컨테이너', vessels: [v('a6', 'SINOKOR BUSAN', '컨테이너선', 16700, 8, 19, 'actual', '09-30 07:30', '09-30 08:00', '09-30 19:00'), v('a7', 'PACIFIC STAR', '컨테이너선', 9870, 20, 24, 'pred', '09-30 23:00', '10-01 02:40', '10-01 14:00', 0.78)] },
    { id: 'b5', name: '4부두 1선석', cargo: '자동차', vessels: [v('a8', 'GLOVIS SUNRISE', '자동차운반선', 59200, 11, 22, 'pred', '09-30 10:00', '09-30 11:00', '09-30 22:00', 0.9)] },
    { id: 'b6', name: '6부두 1선석', cargo: '양곡', vessels: [v('a9', 'OCEAN HARVEST', '벌크선', 28400, 0, 6, 'actual', '09-29 12:00', '09-29 12:00', '09-30 06:00')] },
  ],
  온산항: [
    { id: 'o1', name: '온산 1선석', cargo: '액체화물', vessels: [v('c1', 'SK ENERGY 3', '석유제품운반선', 11200, 1, 13, 'actual', '09-30 00:30', '09-30 01:00', '09-30 13:00'), v('c2', 'CHEMROAD HOPE', '케미컬운반선', 8900, 16, 24, 'pred', '09-30 15:00', '09-30 16:10', '10-01 04:30', 0.84)] },
    { id: 'o2', name: '온산 5선석', cargo: '액체화물', vessels: [v('c3', 'GOLDEN TIDE', '케미컬운반선', 6400, 5, 11, 'actual', '09-30 05:00', '09-30 05:00', '09-30 11:00'), v('c4', 'NORDIC ACE', '유조선', 42100, 13, 24, 'delay', '09-30 09:00', '09-30 13:20', '10-01 10:00', 0.69)] },
    { id: 'o3', name: '온산 7선석', cargo: '비철금속', vessels: [v('c5', 'KOREA ZINC 1', '벌크선', 22300, 3, 17, 'actual', '09-30 03:00', '09-30 03:00', '09-30 17:00')] },
  ],
  미포항: [
    { id: 'm1', name: '미포 1선석', cargo: '조선기자재', vessels: [v('d1', 'HD MIPO CARRIER', '특수선', 7300, 6, 14, 'actual', '09-30 06:00', '09-30 06:00', '09-30 14:00')] },
    { id: 'm2', name: '미포 2선석', cargo: '일반잡화', vessels: [v('d2', 'EAST WAVE', '일반화물선', 4100, 15, 23, 'pred', '09-30 14:00', '09-30 15:00', '09-30 23:00', 0.88)] },
  ],
  울산신항: [
    { id: 'n1', name: '신항 남항 1선석', cargo: '액체화물(LNG)', vessels: [v('e1', 'SK SPICA', 'LNG운반선', 98700, 0, 20, 'actual', '09-29 20:00', '09-29 20:00', '09-30 20:00')] },
    { id: 'n2', name: '신항 북항 2선석', cargo: '컨테이너', vessels: [v('e2', 'JJ NAGOYA', '컨테이너선', 13200, 9, 18, 'actual', '09-30 09:00', '09-30 09:30', '09-30 18:00'), v('e3', 'HEUNG-A JANICE', '컨테이너선', 9600, 19.5, 24, 'pred', '09-30 19:00', '09-30 19:30', '10-01 05:00', 0.83)] },
  ],
}

export const NOW_HOUR = 14

/** 최근 14일 평균 대기시간: 예측 vs 실제 */
export const WAIT_HISTORY = Array.from({ length: 14 }, (_, i) => {
  const actual = +(4 + Math.sin(i / 2) * 1.6 + (i % 4) * 0.35).toFixed(1)
  const pred = +(actual + (((i * 7) % 5) - 2) * 0.28).toFixed(1)
  return { day: `9/${17 + i}`, actual, pred, error: +Math.abs(actual - pred).toFixed(2) }
})

/** 향후 72시간 혼잡도(대기선박 수) 예측 + 신뢰구간 */
export const CONGESTION_FORECAST = Array.from({ length: 25 }, (_, i) => {
  const h = i * 3
  const base = 3 + Math.sin((h + 6) / 8) * 2.2 + (h > 36 && h < 54 ? 2 : 0)
  return {
    t: h === 0 ? '현재' : `+${h}h`,
    pred: +base.toFixed(1),
    band: [+(Math.max(0, base - 0.6 - h / 60)).toFixed(1), +(base + 0.6 + h / 60).toFixed(1)] as [number, number],
  }
})

export const ANOMALIES = [
  { level: 'danger' as const, title: 'AIS 신호 두절', desc: 'NORDIC ACE (MMSI 440123450) · 42분간 AIS 미수신, 최종 위치 온산 E-3 정박지', time: '13:48' },
  { level: 'warn' as const, title: '항로 이탈 의심', desc: 'EAST WAVE · 지정 항로에서 0.8해리 이탈, 속력 11.2kn', time: '13:21' },
  { level: 'warn' as const, title: '예측 오차 임계치 초과', desc: 'DONGBANG No.7 · 계획 ETA 대비 +5.2시간 지연 예측 (임계 3시간)', time: '12:55' },
  { level: 'info' as const, title: '데이터 수집 재시도 성공', desc: 'PortWise 선석배정 API · 2회 재시도 후 정상 수집 (13:00 배치)', time: '13:02' },
]

export const MODEL_METRICS = [
  { name: 'TFT (운영)', mae: 0.74, rmse: 1.02, mape: 11.8, active: true },
  { name: 'LSTM', mae: 0.91, rmse: 1.25, mape: 14.6, active: false },
  { name: 'GRU', mae: 0.88, rmse: 1.19, mape: 13.9, active: false },
]
