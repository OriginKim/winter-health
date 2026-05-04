import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HealthRecord } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

interface RecordWithName extends HealthRecord { recorderName?: string }

const localToday = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

export default function WeeklyPage() {
  const [records, setRecords] = useState<RecordWithName[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const from = new Date()
      from.setDate(from.getDate() - 6)
      const fromStr = new Date(from.getTime() - from.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      const { data } = await supabase
        .from('health_records').select('*')
        .gte('date', fromStr)
        .order('date', { ascending: true })
      if (!data) { setLoading(false); return }

      const profileIds = [...new Set(data.map((r) => r.recorded_by).filter(Boolean))]
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds)
      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]))

      setRecords(data.map((r) => ({ ...r, recorderName: profileMap[r.recorded_by ?? ''] ?? '' })))
      setLoading(false)
    }
    fetchData()
  }, [])

  const calcWater = (r: HealthRecord) => {
    const mw = Math.max(0, (r.morning_water_given ?? 0) - (r.morning_water_left ?? 0))
    const ew = Math.max(0, (r.evening_water_given ?? 0) - (r.evening_water_left ?? 0))
    const pw = Math.max(0, (r.purifier_water_given ?? 0) - (r.purifier_water_left ?? 0))
    return mw + ew + pw
  }

  const todayStr = localToday()

  const chartData = records.map((r) => ({
    date: r.date.slice(5),
    몸무게: r.weight ?? null,
    식사량: ((r.morning_food ?? 0) + (r.evening_food ?? 0)) || null,
    음수량: calcWater(r) || null,
  }))

  const avg = (key: '몸무게' | '식사량' | '음수량') => {
    const vals = chartData.map((d) => d[key]).filter((v) => v !== null) as number[]
    if (!vals.length) return '-'
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <p style={{ fontSize: 14, color: '#AEAEB2' }}>불러오는 중...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#8E8E93' }}>최근 7일 기준</p>

      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: '평균 몸무게', value: avg('몸무게'), unit: 'kg', color: '#1565C0' },
          { label: '평균 식사량', value: avg('식사량'), unit: 'g', color: '#1C1C1E' },
          { label: '평균 음수량', value: avg('음수량'), unit: 'ml', color: '#2E7D32' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '12px 10px' }}>
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 600, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{value}</p>
            <p style={{ fontSize: 10, color: '#AEAEB2' }}>{unit}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 12 }}>몸무게 추이 (kg)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#AEAEB2' }} />
            <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} domain={['auto', 'auto']} width={32} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F2F2F7', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line type="monotone" dataKey="몸무게" stroke="#1565C0" strokeWidth={2} dot={{ r: 4, fill: '#1565C0' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 12 }}>식사량 / 음수량</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#AEAEB2' }} />
            <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} width={32} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F2F2F7', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="식사량" fill="#81C784" radius={[4, 4, 0, 0]} />
            <Bar dataKey="음수량" fill="#4CAF50" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93' }}>날짜별 기록</p>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
          const r = records.find((r) => r.date === dateStr)
          const isToday = dateStr === todayStr
          const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

          if (!r) return (
            <div key={dateStr} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '14px 16px', opacity: 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: isToday ? '#2E7D32' : '#AEAEB2' }}>{label}</p>
                {isToday && <span style={{ fontSize: 10, background: '#2E7D32', color: '#fff', padding: '2px 6px', borderRadius: 20, fontWeight: 600 }}>오늘</span>}
              </div>
              <p style={{ fontSize: 12, color: '#AEAEB2', marginTop: 4 }}>기록 없음</p>
            </div>
          )

          const water = calcWater(r)
          const food = (r.morning_food ?? 0) + (r.evening_food ?? 0)
          return (
            <div key={dateStr} style={{ background: '#fff', borderRadius: 14, border: isToday ? '1.5px solid #2E7D32' : '1px solid #F2F2F7', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: isToday ? '#2E7D32' : '#1C1C1E' }}>{label}</p>
                  {isToday && <span style={{ fontSize: 10, background: '#2E7D32', color: '#fff', padding: '2px 6px', borderRadius: 20, fontWeight: 600 }}>오늘</span>}
                </div>
                {r.recorderName && <span style={{ fontSize: 11, color: '#8E8E93', background: '#F7F5F2', padding: '2px 8px', borderRadius: 20 }}>{r.recorderName}</span>}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {r.weight && <div><p style={{ fontSize: 10, color: '#8E8E93' }}>몸무게</p><p style={{ fontSize: 15, fontWeight: 600, color: '#1565C0' }}>{r.weight} kg</p></div>}
                {food > 0 && <div><p style={{ fontSize: 10, color: '#8E8E93' }}>식사량</p><p style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>{food} g</p></div>}
                {water > 0 && <div><p style={{ fontSize: 10, color: '#8E8E93' }}>음수량</p><p style={{ fontSize: 15, fontWeight: 600, color: '#2E7D32' }}>{water} ml</p></div>}
              </div>
              {r.memo && <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 8, paddingTop: 8, borderTop: '1px solid #F2F2F7' }}>{r.memo}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}