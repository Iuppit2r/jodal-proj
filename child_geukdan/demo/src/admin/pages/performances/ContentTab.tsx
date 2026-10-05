import { useState } from 'react'
import { ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react'
import { useStore } from '../../../store'
import Poster from '../../../components/Poster'
import { cx } from '../../../lib/format'
import { Card, Field, Note, errMsg } from '../../ui'
import { MOTIFS, type TabProps } from './shared'
import { ChipInput, RichEditor } from './widgets'

const OK_TYPES = ['image/jpeg', 'image/png']
const OK_EXT = /\.(jpe?g|png)$/i
const MAX = 5 * 1024 * 1024

function readFile(f: File): Promise<string> {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.readAsDataURL(f)
  })
}
function check(f: File): string | null {
  if (!OK_TYPES.includes(f.type) || !OK_EXT.test(f.name)) return errMsg('E-PM-301', 'jpg, jpeg, png 파일만 등록 가능합니다')
  if (f.size > MAX) return errMsg('E-PM-302', `파일 용량은 최대 5MB까지 등록 가능합니다 (${(f.size / 1024 / 1024).toFixed(1)}MB)`)
  return null
}

export default function ContentTab({ p, set, errors, ex, setEx }: TabProps) {
  const toast = useStore(s => s.toast)
  const [imgErr, setImgErr] = useState('')
  const [subErr, setSubErr] = useState('')

  const onMain = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    const e = check(f)
    if (e) { setImgErr(e); toast(e, 'err'); return }
    setImgErr('')
    setEx({ mainImage: await readFile(f), mainImageName: f.name })
  }
  const onSubs = async (files: FileList | null) => {
    if (!files?.length) return
    const ok: { url: string; name: string }[] = []
    const bad: string[] = []
    for (const f of Array.from(files)) {
      if (check(f)) bad.push(f.name)
      else ok.push({ url: await readFile(f), name: f.name })
    }
    if (bad.length) {
      const m = errMsg('E-PM-301', `jpg, jpeg, png 파일만 등록 가능합니다 (5MB 이하) – 제외: ${bad.join(', ')}`)
      setSubErr(m); toast(m, 'err')
    } else setSubErr('')
    if (ok.length) setEx({ images: [...ex.images, ...ok] })
  }

  const setPal = (i: number, c: string) => {
    const pal = [...p.palette] as typeof p.palette
    pal[i] = c
    set({ palette: pal })
  }

  return (
    <div className="space-y-4">
      <Card title="대표 이미지 (포스터)" sub="jpg·jpeg·png / 최대 5MB · 권장 600×840px (5:7)">
        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            {ex.mainImage
              ? <img src={ex.mainImage} alt="대표 이미지 미리보기" className="aspect-[5/7] w-full rounded-xl object-cover shadow" />
              : <Poster title={p.title || '공연명'} sub={p.subtitle} palette={p.palette} motif={p.motif} className="aspect-[5/7] w-full rounded-xl shadow" />}
            <div className="mt-2 truncate text-center text-[11px] text-muted">{ex.mainImage ? ex.mainImageName : '자동 생성 포스터 (이미지 미등록)'}</div>
          </div>
          <div className="space-y-4">
            <Field label="이미지 업로드" error={imgErr}>
              <div className="flex flex-wrap gap-2">
                <label className="btn-outline btn-sm cursor-pointer">
                  <Upload size={14} />파일 선택
                  <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" onChange={e => { onMain(e.target.files); e.target.value = '' }} />
                </label>
                {ex.mainImage && <button type="button" className="btn-ghost btn-sm" onClick={() => setEx({ mainImage: undefined, mainImageName: undefined })}><X size={14} />이미지 삭제</button>}
              </div>
            </Field>
            <div className={cx('space-y-3 rounded-lg border border-line p-3', ex.mainImage && 'opacity-50')}>
              <div className="text-xs font-semibold text-muted">이미지 미등록 시 자동 생성 포스터 설정</div>
              <div className="flex flex-wrap gap-4">
                {['배경', '포인트 1', '포인트 2'].map((l, i) => (
                  <label key={l} className="flex items-center gap-2 text-xs">
                    <input type="color" value={p.palette[i]} onChange={e => setPal(i, e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-line" aria-label={`${l} 색상`} />
                    <span><span className="block font-semibold">{l}</span><span className="font-mono text-muted">{p.palette[i]}</span></span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MOTIFS.map(m => (
                  <button key={m.value} type="button" onClick={() => set({ motif: m.value })}
                    className={cx('flex flex-col items-center gap-1 rounded-lg border p-1.5 text-[11px] font-semibold transition', p.motif === m.value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-muted hover:border-brand-500')}>
                    <Poster title={m.label} palette={p.palette} motif={m.value} showText={false} className="h-12 w-9 rounded" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title={`추가 이미지 (${ex.images.length}장)`} sub="상세 페이지 갤러리에 노출됩니다. 공연 사진 최소 3장 등록을 권장합니다."
        actions={
          <label className="btn-outline btn-sm cursor-pointer">
            <ImagePlus size={14} />이미지 추가
            <input type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" onChange={e => { onSubs(e.target.files); e.target.value = '' }} />
          </label>
        }>
        {subErr && <Note tone="err" className="mb-3">{subErr}</Note>}
        {ex.images.length < 3 && <Note tone="warn" className="mb-3">최소 3장 등록 권장 (현재 {ex.images.length}장)</Note>}
        {ex.images.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {ex.images.map((im, i) => (
              <li key={im.url.slice(-24) + i} className="group relative overflow-hidden rounded-lg border border-line">
                <img src={im.url} alt={im.name} className="aspect-square w-full object-cover" />
                <div className="truncate px-1.5 py-1 text-[10px] text-muted">{i + 1}. {im.name}</div>
                <button type="button" aria-label={`${im.name} 삭제`} onClick={() => setEx({ images: ex.images.filter((_, j) => j !== i) })}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-80 hover:bg-coral-500"><X size={12} /></button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid place-items-center rounded-lg border-2 border-dashed border-line py-8 text-xs text-muted">
            <ImagePlus size={22} className="mb-1 text-gray-300" />등록된 추가 이미지가 없습니다
          </div>
        )}
      </Card>

      <Card title="공연 소개">
        <div className="space-y-4">
          <Field label="줄거리 (요약)" required error={errors.summary} hint="메인·목록 카드에 노출 (100자 내외 권장)">
            <RichEditor value={p.summary} onChange={v => set({ summary: v })} rows={3} invalid={!!errors.summary} placeholder="한두 문장으로 공연을 소개해 주세요" />
          </Field>
          <Field label="상세 설명" hint="공연 상세 페이지 '작품 소개' 영역">
            <RichEditor value={p.description} onChange={v => set({ description: v })} rows={8} placeholder="작품 소개, 기획 의도, 관람 포인트 등" />
          </Field>
        </div>
      </Card>

      <Card title="출연 · 제작진" actions={<button type="button" className="btn-outline btn-sm" onClick={() => set({ credits: [...p.credits, { role: '', name: '' }] })}><Plus size={13} />제작진 추가</button>}>
        <div className="space-y-2">
          {p.credits.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="input w-36 py-2" placeholder="역할 (예: 연출)" value={c.role} aria-label="역할"
                onChange={e => set({ credits: p.credits.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} />
              <input className="input py-2" placeholder="이름" value={c.name} aria-label="이름"
                onChange={e => set({ credits: p.credits.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <button type="button" className="btn-ghost btn-sm px-2 hover:text-coral-500" aria-label="제작진 삭제" onClick={() => set({ credits: p.credits.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
          {!p.credits.length && <p className="text-xs text-muted">등록된 제작진이 없습니다.</p>}
        </div>
        <Field label="출연진" hint="Enter 또는 쉼표로 구분하여 입력" className="mt-4">
          <ChipInput value={p.cast} onChange={v => set({ cast: v })} placeholder="배우 이름" />
        </Field>
      </Card>
    </div>
  )
}
