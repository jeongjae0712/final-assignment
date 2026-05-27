'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  is_read: boolean
}

interface Props {
  matchId: string
  otherUserId: string
  otherUserName: string
  currentUserId: string
  currentUserName: string  // 알림 메시지용
}

export default function MatchChat({
  matchId, otherUserId, otherUserName, currentUserId, currentUserName,
}: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('match_chats')
        .select('*')
        .eq('match_id', matchId)
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true })
      if (data) setMessages(data)

      // 읽음 처리
      await supabase
        .from('match_chats')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .eq('sender_id', otherUserId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false)
    }
    load()

    const channel = supabase
      .channel(`chat-${matchId}-${[currentUserId, otherUserId].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_chats', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message
          const isRelevant =
            (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
          if (isRelevant) setMessages(prev => [...prev, msg])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, currentUserId, otherUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')

    // 1) 채팅 메시지 저장
    await supabase.from('match_chats').insert({
      match_id:    matchId,
      sender_id:   currentUserId,
      receiver_id: otherUserId,
      message:     text,
    })

    // 2) 수신자에게 알림 (5분 내 중복 스킵은 DB 함수가 처리)
    await supabase.rpc('send_chat_notification', {
      p_receiver_id: otherUserId,
      p_match_id:    matchId,
      p_preview:     `${currentUserName}: ${text.length > 40 ? text.slice(0, 40) + '...' : text}`,
    })

    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-center">
              아직 메시지가 없습니다.<br />먼저 인사를 건네보세요!
            </p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mb-4">
                  {otherUserName[0]}
                </div>
              )}
              <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                  isMe
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  {msg.message}
                </div>
                <span className="text-xs text-gray-400 px-1">
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1 text-sm"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="btn-primary px-3 py-2 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
