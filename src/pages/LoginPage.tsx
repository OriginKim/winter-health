import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) setIsBlocked(true)
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F7F5F2' }}>
      <div className="flex flex-col items-center gap-8 px-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div style={{ width: 140, height: 140, borderRadius: 32, overflow: 'hidden', border: '2px solid #E8F5E9' }}>
            <img src="/geouli-main.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px' }}>겨울이 건강 수첩</h1>
            <p style={{ fontSize: 14, color: '#8E8E93' }}>가족 모두 함께 기록해요</p>
          </div>
        </div>

        {isBlocked && (
          <div style={{ width: '100%', padding: '14px 16px', background: '#FFEBEE', borderRadius: 14, border: '1px solid #FFCDD2' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#C62828', marginBottom: 4 }}>접근이 제한된 이메일입니다.</p>
            <p style={{ fontSize: 13, color: '#E57373', lineHeight: 1.6 }}>
              가족 계정으로만 로그인할 수 있어요.<br />
              접근이 필요하시면 관리자에게 문의해주세요.
            </p>
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '14px 0',
            background: '#fff', border: '1px solid #E5E5EA',
            borderRadius: 14, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10,
            fontSize: 15, fontWeight: 600, color: '#1C1C1E',
            cursor: 'pointer', fontFamily: 'Pretendard, sans-serif'
          }}
        >
          <img src="https://www.google.com/favicon.ico" width={18} height={18} />
          Google로 계속하기
        </button>

        <p style={{ fontSize: 12, color: '#AEAEB2', textAlign: 'center', lineHeight: 1.6 }}>
          비공개 서비스입니다.
        </p>
      </div>
    </div>
  )
}