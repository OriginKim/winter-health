import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { HealthRecord } from '../types'

interface Props { session: Session }

const today = () => new Date().toISOString().slice(0, 10)

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
  const [error, setError] = useState('')
  const [recordedBy, setRecordedBy] = useState('')
  const [form, setForm] = useState({
    weight: '', morning_food: '', morning_water_given: '', morning_water_left: '',
    evening_food: '', evening_water_given: '', evening_water_left: '',
    purifier_water_given: '', purifier_water_left: '', memo: '',
  })

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  useEffect(() => {
    const fetchRecord = async () => {
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
        }
      } else {
        setForm({ weight: '', morning_food: '', morning_water_given: '', morning_water_left: '', evening_food: '', evening_water_given: '', evening_water_left: '', purifier_water_given: '', purifier_water_left: '', memo: '' })
        setRecordedBy('')
      }
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
    const existing = await supabase.from('health_records').select('*').eq('date', date).maybeSingle()
    const prev = existing.data ?? {}

    const payload: HealthRecord = {
      date,
      recorded_by: session.user.id,
      weight: form.weight ? parseFloat(form.weight) : (prev.weight ?? undefined),
      morning_food: form.morning_food ? parseFloat(form.morning_food) : (prev.morning_food ?? undefined),
      morning_water_given: form.morning_water_given ? parseFloat(form.morning_water_given) : (prev.morning_water_given ?? undefined),
      morning_water_left: form.morning_water_left ? parseFloat(form.morning_water_left) : (prev.morning_water_left ?? undefined),
      evening_food: form.evening_food ? parseFloat(form.evening_food) : (prev.evening_food ?? undefined),
      evening_water_given: form.evening_water_given ? parseFloat(form.evening_water_given) : (prev.evening_water_given ?? undefined),
      evening_water_left: form.evening_water_left ? parseFloat(form.evening_water_left) : (prev.evening_water_left ?? undefined),
      purifier_water_given: form.purifier_water_given ? parseFloat(form.purifier_water_given) : (prev.purifier_water_given ?? undefined),
      purifier_water_left: form.purifier_water_left ? parseFloat(form.purifier_water_left) : (prev.purifier_water_left ?? undefined),
      memo: form.memo || (prev.memo ?? undefined),
    }

    const { error: saveError } = await supabase.from('health_records').upsert(payload, { onConflict: 'date' })
    setSaving(false)
    if (saveError) {
      setError('저장 중 오류가 발생했어요. 다시 시도해주세요.')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirm('이 날의 기록을 삭제할까요?')) return
    const { error: delError } = await supabase.from('health_records').delete().eq('date', date)
    if (delError) { setError('삭제 중 오류가 발생했어요.'); return }
    setForm({ weight: '', morning_food: '', morning_water_given: '', morning_water_left: '', evening_food: '', evening_water_given: '', evening_water_left: '', purifier_water_given: '', purifier_water_left: '', memo: '' })
    setRecordedBy('')
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

  return (
    <div>
      {/* 날짜 + 입력자 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ border: '1px solid #E5E5EA', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#1C1C1E', background: '#fff', fontFamily: 'Pretendard, sans-serif', outline: 'none' }}
          />
        </div>
        {recordedBy && (
          <span style={{ fontSize: 12, color: '#8E8E93' }}>
            최근: <strong style={{ color: '#2E7D32' }}>{recordedBy}</strong>
          </span>
        )}
      </div>

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
              <span style={{
                position: 'absolute', top: 6, right: 8,
                width: 6, height: 6, borderRadius: '50%',
                background: '#2E7D32', display: 'inline-block'
              }} />
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
            {morningWater && !morningErr && (
              <p style={{ fontSize: 12, color: '#2E7D32', textAlign: 'right', padding: '8px 0 4px' }}>= {morningWater} ml 섭취</p>
            )}
          </>
        )}
        {activeTab === '저녁' && (
          <>
            <Field label="급여량" unit="g" value={form.evening_food} onChange={set('evening_food')} />
            <Field label="준 물" unit="ml" value={form.evening_water_given} onChange={set('evening_water_given')} />
            <Field label="남은 물" unit="ml" value={form.evening_water_left} onChange={set('evening_water_left')} error={eveningErr} />
            {eveningWater && !eveningErr && (
              <p style={{ fontSize: 12, color: '#2E7D32', textAlign: 'right', padding: '8px 0 4px' }}>= {eveningWater} ml 섭취</p>
            )}
          </>
        )}
        {activeTab === '정수기' && (
          <>
            <Field label="넣은 물" unit="ml" value={form.purifier_water_given} onChange={set('purifier_water_given')} />
            <Field label="남은 물" unit="ml" value={form.purifier_water_left} onChange={set('purifier_water_left')} error={purifierErr} />
            {purifierWater && !purifierErr && (
              <p style={{ fontSize: 12, color: '#2E7D32', textAlign: 'right', padding: '8px 0 4px' }}>= {purifierWater} ml 섭취</p>
            )}
          </>
        )}

        {/* 메모는 항상 표시 */}
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

      <button
        onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '15px 0', background: saving ? '#A5D6A7' : '#2E7D32', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Pretendard, sans-serif', transition: 'background 0.2s' }}
      >
        {saving ? '저장 중...' : saved ? '저장됐어요 ✓' : '저장하기'}
      </button>

      <button
        onClick={handleDelete}
        style={{ width: '100%', marginTop: 8, padding: '12px 0', background: 'none', color: '#AEAEB2', border: '1px solid #F2F2F7', borderRadius: 14, fontSize: 14, cursor: 'pointer', fontFamily: 'Pretendard, sans-serif' }}
      >
        이 날 기록 삭제
      </button>
    </div>
  )
}