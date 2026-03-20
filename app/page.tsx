'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const TOPICS = [
  { id: 'insight', emoji: '💬', label: '消費 Insight', prompt: '請分析我過去 3 個月的消費習慣，包括每月總花費、消費類別分布、最常去的店家，以及你注意到的消費趨勢和模式。' },
  { id: 'subscription', emoji: '🔄', label: '訂閱費分析', prompt: '請找出我所有的訂閱服務和固定月費（包括 YouTube、ChatGPT、Uber One、電信、App 訂閱、水電瓦斯等），計算每月和年度總成本，並分析哪些可能不值得繼續付費。' },
  { id: 'save', emoji: '💰', label: '省錢建議', prompt: '根據我的消費資料，請給我具體的省錢建議。分析我在外送、外食、訂閱等方面的支出，找出可以優化的地方，並計算如果執行建議每月能省多少。' },
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
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-base">🤖</div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Invos AI 助手</h1>
          <p className="text-[11px] text-gray-400">114/12 ~ 115/02 發票分析</p>
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
              <div className="text-4xl mb-3">🤖</div>
              <h2 className="text-lg font-bold text-gray-800">嗨！我是 Invos AI 助手</h2>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                已載入你 3 個月的發票資料<br/>選一個主題，或直接問我
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
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs mt-0.5 shrink-0">🤖</div>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs mt-0.5 shrink-0">🤖</div>
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
