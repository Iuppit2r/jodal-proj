import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, Download, FileUp, PlayCircle, UploadCloud } from 'lucide-react'
import { useStore, useSeatState, venueOf } from '../../../store'
import * as M from '../../../data/mock'
import { cx, downloadCsv, won } from '../../../lib/format'
import { Card, Field, Note, Segmented, Status, ask, errMsg, usePII } from '../../ui'
import { TODAY, roundLabel } from '../../lib'
import { fmtPhone, parseCsv, phoneOk, ttPrice, useGradeFn } from './shared'

type Vendor = '인터파크' | '예스24' | '네이버'
const VENDORS: Vendor[] = ['인터파크', '예스24', '네이버']
const HEADER = ['예매처예매번호', '예매자명', '휴대폰', '좌석', '권종', '금액']

interface Row { line: number; extId: string; name: string; phone: string; seat: string; ttName: string; price: number; err?: string; doneId?: string }

/** 외부예매처 예매 업로드 (SFR-TC-014) */
export default function ExternalUpload() {
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const pii = usePII()
  const [vendor, setVendor] = useState<Vendor>('인터파크')
  const [perfId, setPerfId] = useState('p1')
  const [roundId, setRoundId] = useState('')
  const [fileName, setFileName] = useState('')
  const [raw, setRaw] = useState<string[][] | null>(null)
  const [done, setDone] = useState<Record<number, string>>({})
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const perf = perfs.find(p => p.id === perfId)
  const salePerfs = perfs.filter(p => p.status === '판매중' || p.status === '선예매중' || p.status === '매진')
  const perfRounds = useMemo(() => rounds.filter(r => r.perfId === perfId && r.active && r.date >= TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [rounds, perfId])
  const round = rounds.find(r => r.id === roundId)
  const seatState = useSeatState(roundId || undefined)
  const gradeOf = useGradeFn(perf)

  const venueSeats = useMemo(() => new Set(perf ? M.seatIds(venueOf(perf)) : []), [perf])

  // 파싱 + 검증 (등록된 행은 오류 검사 제외)
  const rows: Row[] = useMemo(() => {
    if (!raw) return []
    const body = raw[0]?.[0]?.includes('예매') ? raw.slice(1) : raw
    const seen = new Set<string>()
    return body.map((c, i) => {
      const [extId = '', name = '', phone = '', seat = '', ttName = '일반'] = c
      const seatU = seat.toUpperCase()
      const tt = M.ticketTypes.find(t => t.name === ttName) ?? M.ticketTypes[0]
      const g = venueSeats.has(seatU) ? gradeOf(seatU) : 'S'
      const price = perf ? ttPrice(perf.prices[g] ?? perf.prices.S ?? 0, tt.discountRate) : 0
      const r: Row = { line: i + 2, extId, name, phone, seat: seatU, ttName: tt.name, price, doneId: done[i] }
      if (!done[i]) {
        if (!extId || !name) r.err = errMsg('E-TC-424', '필수값(예매처예매번호·예매자명) 누락')
        else if (!phoneOk(phone)) r.err = errMsg('E-TC-423', '휴대폰 형식 오류')
        else if (!venueSeats.has(seatU)) r.err = errMsg('E-TC-421', '존재하지 않는 좌석')
        else if (seen.has(seatU)) r.err = errMsg('E-TC-422', '파일 내 중복 좌석')
        else if (seatState.sold.has(seatU) || seatState.held.has(seatU)) r.err = errMsg('E-TC-420', '이미 판매된 좌석')
      }
      seen.add(seatU)
      return r
    })
  }, [raw, done, venueSeats, gradeOf, perf, seatState])

  const valid = rows.filter(r => !r.err && !r.doneId)
  const errors = rows.filter(r => r.err)

  const needRound = () => { if (!round) { setErr(errMsg('E-TC-410', '공연과 회차를 먼저 선택해 주세요')); return true } return false }

  const sampleRows = (): string[][] => {
    const free = perf ? M.seatIds(venueOf(perf)).filter(s => !seatState.sold.has(s) && !seatState.held.has(s) && gradeOf(s) !== 'W') : []
    const taken = [...seatState.sold][0] ?? 'A-1'
    const prefix = vendor === '인터파크' ? 'IP' : vendor === '예스24' ? 'Y24' : 'NV'
    return [
      HEADER,
      [`${prefix}${TODAY.replace(/-/g, '')}0011`, '한지민', '010-3412-7781', free[0] ?? 'B-5', '일반', ''],
      [`${prefix}${TODAY.replace(/-/g, '')}0012`, '오세훈', '010-5521-0932', free[1] ?? 'B-6', '어린이 할인', ''],
      [`${prefix}${TODAY.replace(/-/g, '')}0013`, '권나래', '010-7720-4410', free[2] ?? 'B-7', '청소년 할인', ''],
      [`${prefix}${TODAY.replace(/-/g, '')}0014`, '서준호', '010-9083-1157', taken, '일반', ''],
      [`${prefix}${TODAY.replace(/-/g, '')}0015`, '임하늘', '010-2280-36', free[3] ?? 'B-8', '일반', ''],
    ]
  }

  const downloadTemplate = () => {
    downloadCsv(`외부예매_업로드양식_${vendor}.csv`, [HEADER, ['IP202610050001', '홍길동', '010-1234-5678', 'C-5', '일반', '30000']])
    useStore.getState().log('외부예매 업로드 양식 다운로드', vendor)
  }
  const loadDemo = () => {
    if (needRound()) return
    setErr(''); setDone({}); setFileName(`${vendor}_정산예매_${TODAY}.csv (샘플)`)
    setRaw(sampleRows())
  }
  const onFile = (f: File | undefined) => {
    if (!f) return
    if (needRound()) { if (fileRef.current) fileRef.current.value = ''; return }
    if (!/\.csv$/i.test(f.name)) { setErr(errMsg('E-TC-401', 'CSV 파일만 업로드할 수 있습니다')); return }
    const fr = new FileReader()
    fr.onload = () => {
      const parsed = parseCsv(String(fr.result ?? ''))
      if (!parsed.length) { setErr(errMsg('E-TC-402', '파일에 데이터가 없습니다')); return }
      setErr(''); setDone({}); setFileName(f.name); setRaw(parsed)
    }
    fr.onerror = () => setErr(errMsg('E-TC-403', '파일을 읽을 수 없습니다'))
    fr.readAsText(f, 'utf-8')
    if (fileRef.current) fileRef.current.value = ''
  }

  const register = async () => {
    if (!perf || !round || !valid.length) return
    const ok = await ask({
      title: '외부예매 등록', confirmText: `${valid.length}건 등록`,
      message: <>{vendor} 예매 <b>{valid.length}건</b>을 <b>{perf.title} {roundLabel(round)}</b> 회차에 등록합니다.{errors.length > 0 && <><br /><span className="text-xs text-coral-500">오류 {errors.length}건은 제외됩니다.</span></>}</>,
    })
    if (ok === null) return
    const st = useStore.getState()
    const map: Record<number, string> = { ...done }
    for (const r of valid) {
      const g = gradeOf(r.seat)
      const tt = M.ticketTypes.find(t => t.name === r.ttName) ?? M.ticketTypes[0]
      const b = st.createBooking({
        perfId: perf.id, roundId: round.id, channel: '외부예매처', payMethod: '신용카드', fee: 0,
        bookerName: r.name, bookerPhone: fmtPhone(r.phone), seats: [{ seatId: r.seat, grade: g, ticketTypeId: tt.id, price: r.price }],
      })
      st.patchBooking(b.id, { userId: undefined }, `외부예매처 연동 (${vendor} ${r.extId})`)
      map[r.line - 2] = b.id
    }
    setDone(map)
    st.log('외부예매처 예매 업로드', `${vendor} ${perf.title} ${roundLabel(round)} / ${valid.length}건`)
    st.toast(`${vendor} 예매 ${valid.length}건 등록 완료${errors.length ? ` · 오류 ${errors.length}건 제외` : ''}`)
  }

  return (
    <div className="space-y-4">
      <Card title="업로드 설정" sub="외부 예매처에서 판매된 예매 내역(CSV)을 업로드하여 좌석을 점유하고 통합 정산에 반영합니다.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="예매처" required>
            <Segmented options={VENDORS.map(v => ({ value: v, label: v }))} value={vendor} onChange={v => setVendor(v)} />
          </Field>
          <Field label="공연" required>
            <select className="input" value={perfId} onChange={e => { setPerfId(e.target.value); setRoundId(''); setRaw(null) }}>
              {salePerfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field label="회차" required>
            <select className="input" value={roundId} onChange={e => { setRoundId(e.target.value); setRaw(null); setErr('') }}>
              <option value="">회차 선택</option>
              {perfRounds.map(r => <option key={r.id} value={r.id}>{roundLabel(r)}</option>)}
            </select>
          </Field>
          <Field label="양식">
            <button className="btn-outline btn-sm w-full" onClick={downloadTemplate}><Download size={14} />샘플 CSV 다운로드</button>
          </Field>
        </div>

        <div
          className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-paper px-4 py-6 text-center"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
        >
          <UploadCloud size={28} className="text-muted" />
          <div className="text-sm font-semibold">CSV 파일을 끌어다 놓거나 선택하세요</div>
          <div className="text-xs text-muted">열 순서: {HEADER.join(' · ')} (금액은 공연 가격표 기준 자동 계산)</div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button className="btn-primary btn-sm" onClick={() => { if (!needRound()) fileRef.current?.click() }}><FileUp size={14} />파일 선택</button>
            <button className="btn-accent btn-sm" onClick={loadDemo}><PlayCircle size={14} />샘플 데이터로 시연</button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          {fileName && <div className="text-xs text-brand-600">{fileName}</div>}
        </div>
        {err && <Note tone="err" className="mt-3">{err}</Note>}
      </Card>

      {raw && (
        <Card
          title="업로드 미리보기 · 검증 결과"
          sub={<>전체 {rows.length}건 · <span className="text-emerald-600">정상 {valid.length}건</span> · <span className="text-coral-500">오류 {errors.length}건</span>{Object.keys(done).length > 0 && <> · 등록 {Object.keys(done).length}건</>}</>}
          bodyClass="p-3"
          actions={<button className="btn-primary btn-sm" disabled={!valid.length} onClick={register}><CheckCircle2 size={14} />정상 {valid.length}건 등록</button>}
        >
          <div className="tbl-wrap overflow-x-auto rounded-lg border border-line">
            <table className="tbl">
              <thead><tr><th>행</th><th>예매처예매번호</th><th>예매자</th><th>휴대폰</th><th>좌석</th><th>권종</th><th className="text-right">금액</th><th>검증</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.line} className={cx(r.err && 'bg-red-50/60')}>
                    <td className="text-muted">{r.line}</td>
                    <td className="font-mono text-xs">{r.extId}</td>
                    <td>{pii.name(r.name)}</td>
                    <td className="tabular-nums">{phoneOk(r.phone) ? pii.phone(fmtPhone(r.phone)) : r.phone}</td>
                    <td className="font-semibold">{r.seat}</td>
                    <td>{r.ttName}</td>
                    <td className="text-right tabular-nums">{won(r.price)}</td>
                    <td>{r.doneId ? <span className="text-xs text-emerald-700"><Status s="성공" /> {r.doneId}</span> : r.err ? <span className="text-xs font-semibold text-coral-500">{r.err}</span> : <Status s="정상" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted">등록된 예매는 채널 ‘외부예매처’, 결제수단 ‘신용카드’로 저장되며 해당 좌석은 홈페이지·현장 판매에서 즉시 판매완료로 표시됩니다.</p>
        </Card>
      )}
    </div>
  )
}
