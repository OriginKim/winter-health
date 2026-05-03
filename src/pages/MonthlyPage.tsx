import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HealthRecord } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function MonthlyPage() {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [selected, setSelected] = useState<HealthRecord | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('health_records').select('*')
        .gte('date', `${month}-01`)
        .lte('date', `${month}-31`)
        .order('date', { ascending: true })
      setRecords(data ?? [])
      setSelected(null)
    }
    fetchData()
  }, [month])

  const calcWater = (r: HealthRecord) => {
    const mw = Math.max(0, (r.morning_water_given ?? 0) - (r.morning_water_left ?? 0))
    const ew = Math.max(0, (r.evening_water_given ?? 0) - (r.evening_water_left ?? 0))
    const pw = Math.max(0, (r.purifier_water_given ?? 0) - (r.purifier_water_left ?? 0))
    return mw + ew + pw
  }

  const recordMap = Object.fromEntries(records.map((r) => [r.date, r]))
  const [year, mon] = month.split('-').map(Number)
  const daysInMonth = new Date(year, mon, 0).getDate()
  const firstDay = new Date(year, mon - 1, 1).getDay()

  const avg = (fn: (r: HealthRecord) => number | undefined) => {
    const vals = records.map(fn).filter((v) => v !== undefined && v > 0) as number[]
    if (!vals.length) return '-'
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  const chartData = records.map((r) => ({
    date: r.date.slice(8) + '일',
    몸무게: r.weight ?? null,
    음수량: calcWater(r) || null,
  }))

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px' }}>{year}년 {mon}월</p>
        <input
          type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          style={{ border: '1px solid #E5E5EA', borderRadius: 10, padding: '6px 10px', fontSize: 13, color: '#1C1C1E', background: '#fff', fontFamily: 'Pretendard, sans-serif', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: '평균 몸무게', value: avg((r) => r.weight), unit: 'kg', color: '#1565C0' },
          { label: '평균 식사량', value: avg((r) => (r.morning_food ?? 0) + (r.evening_food ?? 0)), unit: 'g', color: '#1C1C1E' },
          { label: '평균 음수량', value: avg((r) => calcWater(r)), unit: 'ml', color: '#2E7D32' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '12px 10px' }}>
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 600, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{value}</p>
            <p style={{ fontSize: 10, color: '#AEAEB2' }}>{unit}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {dayLabels.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#AEAEB2', fontWeight: 600, padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${month}-${String(day).padStart(2, '0')}`
            const rec = recordMap[dateStr]
            const isSelected = selected?.date === dateStr
            const isToday = dateStr === new Date().toISOString().slice(0, 10)
            return (
              <div
                key={day}
                onClick={() => setSelected(rec ? (isSelected ? null : rec) : null)}
                style={{ textAlign: 'center', padding: '6px 2px', borderRadius: 10, cursor: rec ? 'pointer' : 'default', background: isSelected ? '#2E7D32' : isToday ? '#E8F5E9' : 'transparent', transition: 'background 0.15s' }}
              >
                <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isSelected ? '#fff' : isToday ? '#2E7D32' : '#1C1C1E' }}>{day}</p>
                <div style={{ height: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                  {rec && !isSelected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E7D32' }} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E', marginBottom: 12 }}>
            {new Date(selected.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} 기록
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {selected.weight && <div><p style={{ fontSize: 10, color: '#8E8E93' }}>몸무게</p><p style={{ fontSize: 16, fontWeight: 700, color: '#1565C0' }}>{selected.weight} kg</p></div>}
            {((selected.morning_food ?? 0) + (selected.evening_food ?? 0)) > 0 && (
              <div><p style={{ fontSize: 10, color: '#8E8E93' }}>총 식사량</p><p style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E' }}>{(selected.morning_food ?? 0) + (selected.evening_food ?? 0)} g</p></div>
            )}
            {calcWater(selected) > 0 && (
              <div><p style={{ fontSize: 10, color: '#8E8E93' }}>총 음수량</p><p style={{ fontSize: 16, fontWeight: 700, color: '#2E7D32' }}>{calcWater(selected)} ml</p></div>
            )}
          </div>
          {selected.memo && <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 12, paddingTop: 12, borderTop: '1px solid #F2F2F7' }}>{selected.memo}</p>}
          <p style={{ fontSize: 11, color: '#AEAEB2', marginTop: 8 }}>아침: 급여 {selected.morning_food ?? '-'}g / 음수 {Math.max(0, (selected.morning_water_given ?? 0) - (selected.morning_water_left ?? 0))}ml</p>
          <p style={{ fontSize: 11, color: '#AEAEB2' }}>저녁: 급여 {selected.evening_food ?? '-'}g / 음수 {Math.max(0, (selected.evening_water_given ?? 0) - (selected.evening_water_left ?? 0))}ml</p>
        </div>
      )}

      {chartData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 12 }}>이달 몸무게 추이 (kg)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#AEAEB2' }} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} domain={['auto', 'auto']} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F2F2F7', fontSize: 12 }} />
              <Line type="monotone" dataKey="몸무게" stroke="#1565C0" strokeWidth={2} dot={{ r: 3, fill: '#1565C0' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#AEAEB2', textAlign: 'center', paddingBottom: 8 }}>이달 기록 {records.length}일</p>
    </div>
  )
}