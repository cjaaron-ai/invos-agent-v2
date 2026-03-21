'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const TOPICS = [
  { id: 'scan', emoji: '🔍', label: '掃描我的訂閱', prompt: '請掃描我的發票，找出所有訂閱和固定扣款！特別標記那些我可能忘記了或不再使用的服務，告訴我每月被扣了多少、哪些在浪費錢、取消後每年能省多少。' },
  { id: 'cancel', emoji: '✂️', label: '幫我取消訂閱', prompt: '根據掃描結果，列出你建議我取消的訂閱，並提供每一個的完整取消步驟。如果需要寫 Email 就幫我寫好，需要打電話就給我話術腳本。讓我可以直接照著做。' },
  { id: 'cost', emoji: '💰', label: '訂閱花費總覽', prompt: '幫我算一下我每月和每年花了多少錢在訂閱服務上，分類列出（影音/音樂/AI工具/外送/電信/App），並跟合理的水準比較，告訴我花太多的地方。' },
  { id: 'insight', emoji: '💬', label: '消費 Insight', prompt: '請分析我過去 3 個月的整體消費習慣，包括每月總花費、消費類別分布、最常去的店家，以及你注意到的趨勢和省錢機會。' },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStarted(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ 連線失敗，請重試。' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white text-base">✂️</div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Invos 訂閱管家</h1>
          <p className="text-[11px] text-gray-400">掃描訂閱 · 一鍵取消 · 幫你省錢</p>
        </div>
        {started && (
          <button onClick={() => { setMessages([]); setStarted(false) }} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
            重新開始
          </button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {!started ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <div className="text-center">
              <div className="text-4xl mb-3">✂️</div>
              <h2 className="text-lg font-bold text-gray-800">嗨！我是你的訂閱管家</h2>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                我已掃描你 3 個月的發票<br/>幫你找出隱形訂閱，一鍵取消省錢
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => sendMessage(t.prompt)}
                  className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-xs mt-0.5 shrink-0">✂️</div>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div>
                      <ReactMarkdown
                        components={{
                          h3: ({children}) => <h3 style={{fontSize:'0.95rem',fontWeight:700,marginTop:'0.75rem',marginBottom:'0.375rem'}}>{children}</h3>,
                          h4: ({children}) => <h4 style={{fontSize:'0.85rem',fontWeight:700,marginTop:'0.5rem',marginBottom:'0.25rem'}}>{children}</h4>,
                          p: ({children}) => <p style={{margin:'0.375rem 0'}}>{children}</p>,
                          ul: ({children}) => <ul style={{paddingLeft:'1.25rem',margin:'0.375rem 0'}}>{children}</ul>,
                          ol: ({children}) => <ol style={{paddingLeft:'1.25rem',margin:'0.375rem 0'}}>{children}</ol>,
                          li: ({children}) => <li style={{margin:'0.125rem 0'}}>{children}</li>,
                          strong: ({children}) => <strong style={{fontWeight:700,color:'#111827'}}>{children}</strong>,
                          table: ({children}) => <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.75rem',margin:'0.5rem 0'}}>{children}</table>,
                          th: ({children}) => <th style={{textAlign:'left',padding:'0.375rem 0.5rem',borderBottom:'2px solid #e5e7eb',fontWeight:600,color:'#374151',background:'#f9fafb'}}>{children}</th>,
                          td: ({children}) => <td style={{padding:'0.375rem 0.5rem',borderBottom:'1px solid #f3f4f6'}}>{children}</td>,
                          hr: () => <hr style={{margin:'0.75rem 0',borderColor:'#e5e7eb'}} />,
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-xs mt-0.5 shrink-0">✂️</div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick topics */}
      {started && !loading && (
        <div className="px-4 pb-1.5 flex gap-1.5 overflow-x-auto shrink-0">
          {TOPICS.map(t => (
            <button key={t.id} onClick={() => sendMessage(t.prompt)}
              className="shrink-0 px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 transition">
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="問我任何消費相關的問題..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400" disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-30 hover:bg-blue-700 transition shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
