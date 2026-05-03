import { supabase } from '../lib/supabase'

export default function LoginPage() {
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
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#E8F5E9', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 36
          }}>🐱</div>
          <div className="flex flex-col items-center gap-1">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px' }}>겨울이 건강 수첩</h1>
            <p style={{ fontSize: 14, color: '#8E8E93' }}>가족 모두 함께 기록해요</p>
          </div>
        </div>

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
          가족만 접근할 수 있는 비공개 서비스예요
        </p>
      </div>
    </div>
  )
}