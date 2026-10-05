import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, CircleAlert, CircleCheck, Download, Eye, EyeOff, FileCheck2, FileText, FileUp, Gauge,
  Loader, LockKeyhole, ScanText, ShieldCheck, Sparkles, TextSearch, TriangleAlert, X,
} from 'lucide-react'
import { Card, PageHeader, Stat } from '../components/ui'
import { Anno } from '../proposal'

interface Field {
  key: string
  label: string
  value: string
  conf: number
  pii?: boolean
  validate?: (v: string) => string | null
}

const TEMPLATES = [
  { id: 'entry', name: '선박 입항신고서', desc: '입출항 신고 · PoC 대상', enabled: true },
  { id: 'exit', name: '선박 출항신고서', desc: '2차 사업 예정', enabled: false },
  { id: 'facility', name: '항만시설 사용허가 신청서', desc: '2차 사업 예정', enabled: false },
]

// OCR 추출 결과 목업
const EXTRACTED: Field[] = [
  { key: 'vessel', label: '선박명', value: 'HANA GLORY', conf: 0.99 },
  { key: 'callsign', label: '호출부호', value: 'DSRK7', conf: 0.97 },
  { key: 'imo', label: 'IMO 번호', value: '9412O87', conf: 0.62, validate: (v) => (/^\d{7}$/.test(v) ? null : '숫자 7자리여야 합니다. 문자 O를 숫자 0으로 오인식했을 수 있습니다.') },
  { key: 'flag', label: '국적', value: '대한민국', conf: 0.98 },
  { key: 'gt', label: '총톤수', value: '8,420', conf: 0.95, validate: (v) => (/^[\d,]+$/.test(v) ? null : '숫자만 입력할 수 있습니다.') },
  { key: 'eta', label: '입항 예정일시', value: '2026-09-30 17:00', conf: 0.91 },
  { key: 'lastPort', label: '전출항지', value: 'CNSHA 상하이', conf: 0.88 },
  { key: 'berth', label: '희망 선석', value: '1부두 1선석', conf: 0.79 },
  { key: 'master', label: '선장 성명', value: '홍길동', conf: 0.96, pii: true },
  { key: 'agent', label: '선박대리점', value: '(주)한울해운', conf: 0.93 },
  { key: 'agentTel', label: '대리점 연락처', value: '010-1234-5678', conf: 0.94, pii: true },
  { key: 'cargo', label: '적재화물', value: '철강재 3,200톤', conf: 0.84 },
  { key: 'crew', label: '승무원 수', value: '18', conf: 0.97 },
]

const mask = (f: Field) => (f.key === 'master' ? f.value[0] + '*'.repeat(f.value.length - 1) : f.value.replace(/\d{4}(?=-\d{4}$)/, '****'))
const STEPS = ['서식 업로드', 'AI 추출', '검토·수정', '내보내기']
const PROC = [
  { icon: ScanText, text: '문서 이미지 전처리 및 OCR' },
  { icon: TextSearch, text: '서식 유형 자동 분류 및 항목 인식' },
  { icon: ShieldCheck, text: '개인정보 감지 및 마스킹' },
  { icon: FileCheck2, text: '항목 값 검증' },
]

export default function FormAssistantPage() {
  const [step, setStep] = useState(2)
  const [template, setTemplate] = useState('entry')
  const [file, setFile] = useState<File | null>(() => new File(['sample'], '입항신고서_HANA_GLORY_스캔.pdf'))
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fields, setFields] = useState<Field[]>(EXTRACTED)
  const [active, setActive] = useState<string | null>(null)
  const [showPII, setShowPII] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number>()
  useEffect(() => () => clearInterval(timer.current), [])

  const errors = fields.map((f) => ({ f, msg: f.validate?.(f.value) ?? null })).filter((e) => e.msg)
  const lowConf = fields.filter((f) => f.conf < 0.8)

  function runExtract() {
    setStep(1)
    setProgress(0)
    let p = 0
    timer.current = window.setInterval(() => {
      p += 4
      setProgress(Math.min(100, p))
      if (p >= 100) {
        clearInterval(timer.current)
        setFields(EXTRACTED)
        setStep(2)
      }
    }, 70)
  }

  function downloadExcel() {
    const rows = fields.map((f) => `<tr><th>${f.label}</th><td>${f.pii ? mask(f) : f.value}</td></tr>`).join('')
    const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th colspan="2">선박 입항신고서</th></tr>${rows}</table></body></html>`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' }))
    a.download = '입항신고서_HANA_GLORY.xls'
    a.click()
    URL.revokeObjectURL(a.href)
    setStep(3)
  }

  return (
    <div className="page">
      <PageHeader
        title="항만서식 작성 어시스턴트"
        desc="PDF·이미지 서식을 올리면 AI가 서식을 분류하고 핵심 항목을 추출해 표준 양식으로 정리합니다"
        solves={['서식 수작업 입력', '개인정보 노출 우려']}
        actions={step >= 2 ? <button className="btn" onClick={() => { setStep(0); setFile(null) }}><ArrowLeft size={15} />새 문서</button> : undefined}
      />

      <ol className="stepper" aria-label="진행 단계">
        {STEPS.map((s, i) => (
          <li key={s} className="row" style={{ gap: 10 }}>
            <span className={`step${i < step ? ' done' : i === step ? ' current' : ''}`} aria-current={i === step ? 'step' : undefined}>
              <span className="step-dot">{i < step ? <Check size={13} strokeWidth={2.5} /> : i + 1}</span>
              <span className="lbl">{s}</span>
            </span>
            {i < STEPS.length - 1 && <span className="step-line" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid cols-3">
          <Card title="지원 서식" icon={FileText} sub="올린 문서의 서식은 AI가 자동으로 분류합니다" bodyClass="card-body stack">
            <div className="stack-sm" role="radiogroup" aria-label="서식 템플릿" style={{ gap: 8 }}>
              {TEMPLATES.map((t) => (
                <label key={t.id} className="choice">
                  <input type="radio" name="tpl" value={t.id} checked={template === t.id} disabled={!t.enabled} onChange={() => setTemplate(t.id)} />
                  <span className="choice-text"><b>{t.name}</b><span>{t.desc}</span></span>
                </label>
              ))}
            </div>
          </Card>
          <Card className="span-2" title="문서 업로드" icon={FileUp} bodyClass="card-body stack">
            <div
              className={`dropzone${drag ? ' drag' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="파일을 끌어다 놓거나 선택하세요"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0] ?? null) }}
            >
              <span className="icon-tile tile-blue" style={{ width: 44, height: 44 }}><FileUp size={20} /></span>
              <b>파일을 끌어다 놓거나 클릭해서 선택하세요</b>
              <span>PDF, JPG, PNG, HWP · 최대 20MB · 스캔 문서는 OCR로 인식합니다</span>
              <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.hwp,.hwpx" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {file && (
              <div className="file-chip">
                <span className="icon-tile tile-red"><FileText size={15} /></span>
                <span className="grow">{file.name}</span>
                <span className="muted">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setFile(null)} aria-label="파일 제거"><X size={15} /></button>
              </div>
            )}
            <div className="callout callout-info">
              <LockKeyhole size={16} />
              <span>업로드 문서는 추출 후 즉시 삭제되며, 성명·연락처 같은 개인정보는 외부 AI로 보내기 전에 비식별화됩니다.</span>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setFile(new File(['sample'], '입항신고서_HANA_GLORY_스캔.pdf'))}>샘플 문서 사용</button>
              <button className="btn btn-primary" disabled={!file} onClick={runExtract}><Sparkles size={15} />AI 추출 시작</button>
            </div>
          </Card>
        </div>
      )}

      {step === 1 && (
        <div className="card processing">
          <span className="icon-tile tile-blue"><Loader size={16} className="spin" /></span>
          <h2>문서를 분석하고 있습니다</h2>
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
          <ul className="proc-steps">
            {PROC.map((p, i) => {
              const at = Math.floor(progress / 25)
              const state = i < at ? 'done' : i === at ? 'on' : ''
              const Icon = state === 'done' ? CircleCheck : state === 'on' ? Loader : p.icon
              return <li key={p.text} className={state}><Icon size={16} className={state === 'on' ? 'spin' : ''} />{p.text}</li>
            })}
          </ul>
        </div>
      )}

      {step >= 2 && (
        <>
          <Anno n={1} className="classify mb">
            <span className="icon-tile tile-brand"><TextSearch size={16} /></span>
            <div className="classify-text">
              <b>AI 서식 분류 결과 · 선박 입항신고서</b>
              <span>신뢰도 97% · 다음 후보 선박 출항신고서 2% · 입항신고서 템플릿 13개 항목을 적용했습니다</span>
            </div>
            <Anno n={2} className="classify-steps">
              {PROC.map((p) => <span key={p.text} className="row" style={{ gap: 4 }}><CircleCheck size={13} />{p.text.split(' ')[0]}</span>)}
              <span className="faint">1.8초</span>
            </Anno>
          </Anno>

          <div className="grid cols-4 mb">
            <Stat label="추출 항목" icon={ScanText} value={`${fields.length}개`} foot="선박 입항신고서 템플릿" />
            <Stat label="평균 신뢰도" icon={Gauge} value={`${Math.round((fields.reduce((s, f) => s + f.conf, 0) / fields.length) * 100)}%`} foot="OCR 및 항목 인식 기준" />
            <Stat label="확인 필요" icon={TriangleAlert} value={`${lowConf.length}개`} foot="신뢰도 80% 미만 항목" />
            <Stat label="개인정보 마스킹" icon={ShieldCheck} value={`${fields.filter((f) => f.pii).length}건`} foot="성명, 연락처" />
          </div>

          {errors.length > 0 && (
            <Anno n={3} className="callout callout-danger mb" role="alert">
              <CircleAlert size={16} />
              <div>
                {errors.length}개 항목을 확인해 주세요. 수정하면 내보낼 수 있습니다.
                <ul>{errors.map(({ f, msg }) => <li key={f.key}><a href={`#f-${f.key}`}>{f.label}</a> · {msg}</li>)}</ul>
              </div>
            </Anno>
          )}

          <div className="grid cols-2">
            <Anno n={4}>
            <Card title="원본 문서 대조" icon={FileText} actions={<span className="muted">{file?.name}</span>}>
              <div className="doc-stage">
                <div className="doc-page" aria-label="원본 문서 미리보기">
                  <div className="doc-title">선박입항신고서</div>
                  <table>
                    <tbody>
                      {EXTRACTED.map((f) => (
                        <tr key={f.key}>
                          <td className="h">{f.label}</td>
                          <td><span className={`hl${active === f.key ? ' active' : ''}`}>{f.pii && !showPII ? <span className="redact">{f.value}</span> : f.value}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="doc-foot">2026년 9월 29일 · 신고인 (서명) · 울산항만공사 사장 귀하</p>
                </div>
              </div>
            </Card>
            </Anno>

            <Card
              title="추출 결과 · 항목별 신뢰도"
              icon={ScanText}
              actions={
                <Anno n={5} inline place="right">
                  <button className="btn btn-sm" aria-pressed={showPII} onClick={() => setShowPII((v) => !v)} style={{ fontSize: 'var(--fs-md)' }}>
                    {showPII ? <EyeOff size={14} /> : <Eye size={14} />}개인정보 {showPII ? '숨기기' : '표시 (권한자)'}
                  </button>
                </Anno>
              }
            >
              <div className="table-wrap">
                <table className="table">
                  <caption className="sr-only">추출된 항목과 신뢰도</caption>
                  <thead><tr><th>항목</th><th>값</th><th className="right">신뢰도</th></tr></thead>
                  <tbody>
                    {fields.map((f, i) => {
                      const err = f.validate?.(f.value)
                      const c = f.conf >= 0.9 ? 'high' : f.conf >= 0.8 ? 'mid' : 'low'
                      return (
                        <tr key={f.key} className={`field-row${active === f.key ? ' active' : ''}`}>
                          <td className="lbl">
                            <label htmlFor={`f-${f.key}`} className="row" style={{ gap: 6 }}>
                              {f.label}{f.pii && <LockKeyhole size={13} className="faint" aria-label="개인정보" />}
                            </label>
                          </td>
                          <td style={{ width: '58%' }}>
                            <input
                              id={`f-${f.key}`}
                              className="input"
                              value={f.pii && !showPII ? mask(f) : f.value}
                              readOnly={f.pii && !showPII}
                              aria-invalid={!!err}
                              aria-describedby={err ? `e-${f.key}` : undefined}
                              onFocus={() => setActive(f.key)}
                              onBlur={() => setActive(null)}
                              onChange={(e) => setFields((fs) => fs.map((x, j) => (j === i ? { ...x, value: e.target.value, conf: 1 } : x)))}
                            />
                            {err && <div id={`e-${f.key}`} className="field-error" style={{ marginTop: 4 }}><CircleAlert size={13} />{err}</div>}
                          </td>
                          <td className="right"><span className={`conf ${c}`}>{Math.round(f.conf * 100)}%</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="card-body row between" style={{ borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {step === 3
                  ? <span className="thanks" role="status"><CircleCheck size={15} />내보내기가 완료되었습니다</span>
                  : <span className="muted">수정한 값은 신뢰도 100%로 표시됩니다</span>}
                <Anno n={6} inline className="row">
                  <button className="btn" disabled={errors.length > 0} onClick={() => { setStep(3); window.print() }}><Download size={15} />PDF</button>
                  <button className="btn btn-primary" disabled={errors.length > 0} onClick={downloadExcel}><Download size={15} />Excel 내보내기<ArrowRight size={15} /></button>
                </Anno>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
