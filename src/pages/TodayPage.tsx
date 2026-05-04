import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Props { session: Session }

const today = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

type TabType = '아침' | '저녁' | '정수기'

function Field({ label, unit, value, onChange, error }: {
  label: string; unit?: string; value: string; onChange: (v: string) => void; error?: string
}) {
  return (
    <div style={{ borderBottom: '1px solid #F2F2F7' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
        <label style={{ fontSize: 15, color: '#1C1C1E' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number" min="0" step="0.01" value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            style={{ width: 80, textAlign: 'right', border: 'none', background: 'none', fontSize: 15, color: error ? '#C62828' : '#1C1C1E', fontFamily: 'Pretendard, sans-serif', outline: 'none' }}
          />
          {unit && <span style={{ fontSize: 13, color: '#AEAEB2', width: 24 }}>{unit}</span>}
        </div>
      </div>
      {error && <p style={{ fontSize: 11, color: '#C62828', textAlign: 'right', paddingBottom: 6 }}>{error}</p>}
    </div>
  )
}

function SummaryCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: '#8E8E93', marginBottom: 4, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#AEAEB2' }}>{unit}</p>
    </div>
  )
}

export default function TodayPage({ session }: Props) {
  const [date, setDate] = useState(today())
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const hour = new Date().getHours()
    if (hour < 12) return '아침'
    if (hour < 19) return '저녁'
    return '정수기'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const [recordedBy, setRecordedBy] = useState('')
  const [loading, setLoading] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    weight: '', morning_food: '', morning_water_given: '', morning_water_left: '',
    evening_food: '', evening_water_given: '', evening_water_left: '',
    purifier_water_given: '', purifier_water_left: '', memo: '',
  })

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true)
      const { data } = await supabase.from('health_records').select('*').eq('date', date).maybeSingle()
      if (data) {
        setForm({
          weight: data.weight?.toString() ?? '',
          morning_food: data.morning_food?.toString() ?? '',
          morning_water_given: data.morning_water_given?.toString() ?? '',
          morning_water_left: data.morning_water_left?.toString() ?? '',
          evening_food: data.evening_food?.toString() ?? '',
          evening_water_given: data.evening_water_given?.toString() ?? '',
          evening_water_left: data.evening_water_left?.toString() ?? '',
          purifier_water_given: data.purifier_water_given?.toString() ?? '',
          purifier_water_left: data.purifier_water_left?.toString() ?? '',
          memo: data.memo ?? '',
        })
        if (data.recorded_by) {
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', data.recorded_by).maybeSingle()
          setRecordedBy(profile?.name ?? '')
        } else {
          setRecordedBy('')
        }
      } else {
        setForm({ weight: '', morning_food: '', morning_water_given: '', morning_water_left: '', evening_food: '', evening_water_given: '', evening_water_left: '', purifier_water_given: '', purifier_water_left: '', memo: '' })
        setRecordedBy('')
      }
      setLoading(false)
    }
    fetchRecord()
  }, [date])

  const calcWater = (given: string, left: string): string | null => {
    const g = parseFloat(given), l = parseFloat(left)
    if (!isNaN(g) && !isNaN(l) && g >= l) return (g - l).toFixed(1)
    return null
  }

  const validateWater = (given: string, left: string): string => {
    const g = parseFloat(given), l = parseFloat(left)
    if (!isNaN(g) && !isNaN(l) && l > g) return '남은 물이 준 물보다 많아요'
    return ''
  }

  const totalFood = () => {
    const m = parseFloat(form.morning_food) || 0
    const e = parseFloat(form.evening_food) || 0
    return m + e > 0 ? (m + e).toFixed(0) : '-'
  }

  const totalWater = () => {
    const mw = calcWater(form.morning_water_given, form.morning_water_left)
    const ew = calcWater(form.evening_water_given, form.evening_water_left)
    const pw = calcWater(form.purifier_water_given, form.purifier_water_left)
    const total = (parseFloat(mw ?? '0') || 0) + (parseFloat(ew ?? '0') || 0) + (parseFloat(pw ?? '0') || 0)
    return total > 0 ? total.toFixed(0) : '-'
  }

  const handleSave = async () => {
    setError('')
    const mErr = validateWater(form.morning_water_given, form.morning_water_left)
    const eErr = validateWater(form.evening_water_given, form.evening_water_left)
    const pErr = validateWater(form.purifier_water_given, form.purifier_water_left)
    if (mErr || eErr || pErr) {
      setError('남은 물이 준 물보다 많을 수 없어요.')
      return
    }

    setSaving(true)

    const toNum = (v: string) => v.trim() !== '' ? parseFloat(v) : null

    const payload = {
      date,
      recorded_by: session.user.id,
      weight: toNum(form.weight),
      morning_food: toNum(form.morning_food),
      morning_water_given: toNum(form.morning_water_given),
      morning_water_left: toNum(form.morning_water_left),
      evening_food: toNum(form.evening_food),
      evening_water_given: toNum(form.evening_water_given),
      evening_water_left: toNum(form.evening_water_left),
      purifier_water_given: toNum(form.purifier_water_given),
      purifier_water_left: toNum(form.purifier_water_left),
      memo: form.memo.trim() !== '' ? form.memo.trim() : null,
    }

    const { error: saveError } = await supabase.from('health_records').upsert(payload, { onConflict: 'date' })
    setSaving(false)
    if (saveError) {
      setError('저장 중 오류가 발생했어요. 다시 시도해주세요.')
      return
    }
    setSaved(true)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDelete = async () => {
    const { error: delError } = await supabase.from('health_records').delete().eq('date', date)
    if (delError) { setError('삭제 중 오류가 발생했어요.'); return }
    setForm({ weight: '', morning_food: '', morning_water_given: '', morning_water_left: '', evening_food: '', evening_water_given: '', evening_water_left: '', purifier_water_given: '', purifier_water_left: '', memo: '' })
    setRecordedBy('')
    setDeleteConfirm(false)
  }

  const morningWater = calcWater(form.morning_water_given, form.morning_water_left)
  const eveningWater = calcWater(form.evening_water_given, form.evening_water_left)
  const purifierWater = calcWater(form.purifier_water_given, form.purifier_water_left)
  const morningErr = validateWater(form.morning_water_given, form.morning_water_left)
  const eveningErr = validateWater(form.evening_water_given, form.evening_water_left)
  const purifierErr = validateWater(form.purifier_water_given, form.purifier_water_left)

  const tabs: TabType[] = ['아침', '저녁', '정수기']

  const hasData = (tab: TabType) => {
    if (tab === '아침') return !!(form.morning_food || form.morning_water_given)
    if (tab === '저녁') return !!(form.evening_food || form.evening_water_given)
    if (tab === '정수기') return !!(form.purifier_water_given)
    return false
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const isToday = date === today()

  return (
    <div ref={topRef}>
      {/* 날짜 카드 */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
      <div
  onClick={() => {
    const input = document.querySelector('input[type="date"]') as HTMLInputElement
    if (input?.showPicker) input.showPicker()
  }}
  style={{ background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
>
          <div>
            <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 600, marginBottom: 2 }}>
              {isToday ? '오늘' : '날짜'}
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: isToday ? '#2E7D32' : '#1C1C1E', letterSpacing: '-0.5px' }}>
              {dateLabel}
            </p>
          </div>
          <span style={{ fontSize: 13, color: '#AEAEB2' }}>변경 ›</span>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer',
          }}
        />
        {recordedBy && (
          <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 6, paddingLeft: 4 }}>
            최근 입력: <strong style={{ color: '#2E7D32' }}>{recordedBy}</strong>
          </p>
        )}
      </div>

      {/* 로딩 */}
      {loading ? (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '32px 0', textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 14, color: '#AEAEB2' }}>불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <SummaryCard label="총 식사량" value={totalFood()} unit="g" color="#1C1C1E" />
            <SummaryCard label="총 음수량" value={totalWater()} unit="ml" color="#2E7D32" />
            {form.weight && <SummaryCard label="몸무게" value={form.weight} unit="kg" color="#1565C0" />}
          </div>

          {/* 몸무게 */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '4px 16px 4px', marginBottom: 12 }}>
            <Field label="몸무게" unit="kg" value={form.weight} onChange={set('weight')} />
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: activeTab === tab ? '1.5px solid #2E7D32' : '1.5px solid #F2F2F7',
                  background: activeTab === tab ? '#E8F5E9' : '#fff',
                  fontSize: 14, fontWeight: activeTab === tab ? 700 : 400,
                  color: activeTab === tab ? '#2E7D32' : '#8E8E93',
                  cursor: 'pointer', fontFamily: 'Pretendard, sans-serif',
                  position: 'relative' as const,
                }}
              >
                {tab}
                {hasData(tab) && (
                  <span style={{ position: 'absolute', top: 6, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }} />
                )}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '4px 16px 16px', marginBottom: 12 }}>
            {activeTab === '아침' && (
              <>
                <Field label="급여량" unit="g" value={form.morning_food} onChange={set('morning_food')} />
                <Field label="준 물" unit="ml" value={form.morning_water_given} onChange={set('morning_water_given')} />
                <Field label="남은 물" unit="ml" value={form.morning_water_left} onChange={set('morning_water_left')} error={morningErr} />
                {morningWater && !morningErr && <p style={{ fontSize: 12, color: '#2E7D32', textAlign: 'right', padding: '8px 0 4px' }}>= {morningWater} ml 섭취</p>}
              </>
            )}
            {activeTab === '저녁' && (
              <>
                <Field label="급여량" unit="g" value={form.evening_food} onChange={set('evening_food')} />
                <Field label="준 물" unit="ml" value={form.evening_water_given} onChange={set('evening_water_given')} />
                <Field label="남은 물" unit="ml" value={form.evening_water_left} onChange={set('evening_water_left')} error={eveningErr} />
                {eveningWater && !eveningErr && <p style={{ fontSize: 12, color: '#2E7D32', textAlign: 'right', padding: '8px 0 4px' }}>= {eveningWater} ml 섭취</p>}
              </>
            )}
            {activeTab === '정수기' && (
              <>
                <Field label="넣은 물" unit="ml" value={form.purifier_water_given} onChange={set('purifier_water_given')} />
                <Field label="남은 물" unit="ml" value={form.purifier_water_left} onChange={set('purifier_water_left')} error={purifierErr} />
                {purifierWater && !purifierErr && <p style={{ fontSize: 12, color: '#2E7D32', textAlign: 'right', padding: '8px 0 4px' }}>= {purifierWater} ml 섭취</p>}
              </>
            )}

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F2F2F7' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>메모</p>
              <textarea
                value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="특이사항을 입력해 주세요" rows={2}
                style={{ width: '100%', border: 'none', background: 'none', fontSize: 14, color: '#1C1C1E', fontFamily: 'Pretendard, sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '12px 14px', background: '#FFEBEE', borderRadius: 10, border: '1px solid #FFCDD2' }}>
              <p style={{ fontSize: 13, color: '#C62828' }}>{error}</p>
            </div>
          )}

          {/* 저장 성공 배너 */}
          {saved && (
            <div style={{ marginBottom: 12, padding: '12px 14px', background: '#E8F5E9', borderRadius: 10, border: '1px solid #A5D6A7', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <p style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>저장됐어요!</p>
            </div>
          )}

          <button
            onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '15px 0', background: saving ? '#A5D6A7' : '#2E7D32', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Pretendard, sans-serif', transition: 'background 0.2s' }}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>

          {deleteConfirm ? (
        <div style={{ marginTop: 8, background: '#FFEBEE', borderRadius: 14, border: '1px solid #FFCDD2', padding: '12px 16px' }}>
          <p style={{ fontSize: 13, color: '#C62828', fontWeight: 600, marginBottom: 8 }}>정말 삭제할까요?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{ flex: 1, padding: '10px 0', background: '#fff', border: '1px solid #E5E5EA', borderRadius: 10, fontSize: 14, color: '#8E8E93', cursor: 'pointer', fontFamily: 'Pretendard, sans-serif' }}
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              style={{ flex: 1, padding: '10px 0', background: '#C62828', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'Pretendard, sans-serif' }}
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setDeleteConfirm(true)}
          style={{ width: '100%', marginTop: 8, padding: '12px 0', background: 'none', color: '#AEAEB2', border: '1px solid #F2F2F7', borderRadius: 14, fontSize: 14, cursor: 'pointer', fontFamily: 'Pretendard, sans-serif' }}
        >
          이 날 기록 삭제
        </button>
      )}
        </>
      )}
    </div>
  )
}