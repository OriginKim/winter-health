import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  userId: string
  onComplete: (name: string) => void
}

export default function SetNamePage({ userId, onComplete }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('이름을 입력해주세요'); return }
    setSaving(true)
    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: userId, name: name.trim() })
    setSaving(false)
    if (err) { setError('저장 중 오류가 발생했어요'); return }
    onComplete(name.trim())
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2', padding: '0 32px' }}>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🐱</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px', textAlign: 'center' }}>이름을 설정해주세요</h1>
          <p style={{ fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 1.6 }}>겨울이 기록에 표시될 이름이에요{'\n'}가족들이 알아볼 수 있게 설정해주세요</p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['엄마', '아빠', '누나', '오빠', '기원'].map((preset) => (
              <button
                key={preset}
                onClick={() => setName(preset)}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  border: name === preset ? '1.5px solid #2E7D32' : '1.5px solid #E5E5EA',
                  background: name === preset ? '#E8F5E9' : '#fff',
                  fontSize: 14, fontWeight: name === preset ? 600 : 400,
                  color: name === preset ? '#2E7D32' : '#8E8E93',
                  cursor: 'pointer', fontFamily: 'Pretendard, sans-serif'
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder="직접 입력"
            maxLength={10}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: '1.5px solid #E5E5EA', fontSize: 15, color: '#1C1C1E',
              fontFamily: 'Pretendard, sans-serif', outline: 'none',
              boxSizing: 'border-box' as const, background: '#fff'
            }}
          />
          {error && <p style={{ fontSize: 13, color: '#C62828' }}>{error}</p>}
        </div>

        <button
          onClick={handleSave} disabled={saving || !name.trim()}
          style={{
            width: '100%', padding: '15px 0',
            background: !name.trim() ? '#E5E5EA' : '#2E7D32',
            color: !name.trim() ? '#AEAEB2' : '#fff',
            border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600,
            cursor: name.trim() ? 'pointer' : 'default',
            fontFamily: 'Pretendard, sans-serif'
          }}
        >
          {saving ? '저장 중...' : '시작하기'}
        </button>
      </div>
    </div>
  )
}