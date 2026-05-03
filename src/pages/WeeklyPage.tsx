import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HealthRecord } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function WeeklyPage() {
  const [records, setRecords] = useState<HealthRecord[]>([])

  useEffect(() => {
    const fetch = async () => {
      const from = new Date()
      from.setDate(from.getDate() - 6)
      const { data } = await supabase
        .from('health_records').select('*')
        .gte('date', from.toISOString().slice(0, 10))
        .order('date', { ascending: true })
      setRecords(data ?? [])
    }
    fetch()
  }, [])

  const calcWater = (r: HealthRecord) => {
    const mw = (r.morning_water_given ?? 0) - (r.morning_water_left ?? 0)
    const ew = (r.evening_water_given ?? 0) - (r.evening_water_left ?? 0)
    const pw = (r.purifier_water_given ?? 0) - (r.purifier_water_left ?? 0)
    return Math.max(0, mw + ew + pw)
  }

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

  const summaryCards = [
    { label: '평균 몸무게', value: avg('몸무게'), unit: 'kg', color: '#1565C0' },
    { label: '평균 식사량', value: avg('식사량'), unit: 'g', color: '#1C1C1E' },
    { label: '평균 음수량', value: avg('음수량'), unit: 'ml', color: '#2E7D32' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#8E8E93' }}>최근 7일 기준</p>

      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {summaryCards.map(({ label, value, unit, color }) => (
          <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '12px 10px' }}>
            <p style={{ fontSize: 10, color: '#8E8E93', fontWeight: 600, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{value}</p>
            <p style={{ fontSize: 10, color: '#AEAEB2' }}>{unit}</p>
          </div>
        ))}
      </div>

      {/* 몸무게 그래프 */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 12 }}>몸무게 추이 (kg)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#AEAEB2' }} />
            <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} domain={['auto', 'auto']} width={32} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F2F2F7', fontSize: 12 }} />
            <Line type="monotone" dataKey="몸무게" stroke="#1565C0" strokeWidth={2} dot={{ r: 4, fill: '#1565C0' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 식사량/음수량 그래프 */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F2F2F7', padding: '16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 12 }}>식사량 / 음수량</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#AEAEB2' }} />
            <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} width={32} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F2F2F7', fontSize: 12 }} />
            <Bar dataKey="식사량" fill="#E8F5E9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="음수량" fill="#2E7D32" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 날짜별 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93' }}>날짜별 기록</p>
        {records.length === 0 && (
          <p style={{ fontSize: 14, color: '#AEAEB2', textAlign: 'center', padding: '32px 0' }}>기록이 없어요</p>
        )}
        {[...records].reverse().map((r) => {
          const water = calcWater(r)
          const food = (r.morning_food ?? 0) + (r.evening_food ?? 0)
          const d = new Date(r.date + 'T00:00:00')
          const label = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
          return (
            <div key={r.date} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F2F2F7', padding: '14px 16px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E', marginBottom: 8 }}>{label}</p>
              <div style={{ display: 'flex', gap: 16 }}>
                {r.weight && (
                  <div>
                    <p style={{ fontSize: 10, color: '#8E8E93' }}>몸무게</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1565C0' }}>{r.weight} kg</p>
                  </div>
                )}
                {food > 0 && (
                  <div>
                    <p style={{ fontSize: 10, color: '#8E8E93' }}>식사량</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>{food} g</p>
                  </div>
                )}
                {water > 0 && (
                  <div>
                    <p style={{ fontSize: 10, color: '#8E8E93' }}>음수량</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2E7D32' }}>{water} ml</p>
                  </div>
                )}
              </div>
              {r.memo && <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 8, paddingTop: 8, borderTop: '1px solid #F2F2F7' }}>{r.memo}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}