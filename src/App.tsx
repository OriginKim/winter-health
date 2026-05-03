import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import LoginPage from './pages/LoginPage'
import TodayPage from './pages/TodayPage'
import WeeklyPage from './pages/WeeklyPage'
import MonthlyPage from './pages/MonthlyPage'
import SetNamePage from './pages/SetNamePage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setUserName(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
    setUserName(data?.name ?? '')
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2' }}>
      <p style={{ fontSize: 14, color: '#8E8E93', fontFamily: 'Pretendard, sans-serif' }}>로딩 중...</p>
    </div>
  )

  if (!session) return <LoginPage />

  if (userName === '') return (
    <SetNamePage
      userId={session.user.id}
      onComplete={(name) => setUserName(name)}
    />
  )

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#F7F5F2' }}>
        <header style={{ background: '#F7F5F2', padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🐱</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.3px' }}>겨울이</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {userName && (
              <button
              onClick={async () => {
                const newName = prompt('이름을 변경해주세요', userName ?? '')
                if (newName && newName.trim()) {
                  await supabase.from('profiles').upsert({ id: session.user.id, name: newName.trim() })
                  setUserName(newName.trim())
                }
              }}
              style={{ fontSize: 13, color: '#1C1C1E', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {userName}
              <span style={{ fontSize: 11, color: '#AEAEB2' }}>✏️</span>
            </button>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ fontSize: 13, color: '#8E8E93', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard, sans-serif' }}
            >
              로그아웃
            </button>
          </div>
        </header>

        <nav style={{ display: 'flex', padding: '12px 20px 0', gap: 4 }}>
          {[
            { to: '/', label: '오늘' },
            { to: '/weekly', label: '주간' },
            { to: '/monthly', label: '월간' },
          ].map(({ to, label }) => (
            <NavLink
              key={to} to={to} end
              style={({ isActive }) => ({
                flex: 1, textAlign: 'center', padding: '8px 0',
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#2E7D32' : '#8E8E93',
                borderBottom: isActive ? '2px solid #2E7D32' : '2px solid transparent',
                textDecoration: 'none', transition: 'all 0.15s',
                fontFamily: 'Pretendard, sans-serif'
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
          <Routes>
            <Route path="/" element={<TodayPage session={session} />} />
            <Route path="/weekly" element={<WeeklyPage />} />
            <Route path="/monthly" element={<MonthlyPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}