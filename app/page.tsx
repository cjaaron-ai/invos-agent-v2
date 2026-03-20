'use client'
import { useState, useRef, useEffect } from 'react'

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

  const handleTopic = (prompt: string) => sendMessage(prompt)

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">🤖</div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Invos AI 助手</h1>
          <p className="text-xs text-gray-500">分析你的 3 個月消費資料</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {!started && (
          <div className="flex flex-col items-center justify-center h-full gap-8 pb-10">
            <div className="text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-gray-800">嗨！我是 Invos AI 助手</h2>
              <p className="text-sm text-gray-500 mt-2">我已分析你 114/12 ~ 115/02 的發票資料<br/>選一個主題開始，或直接問我任何問題</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTopic(t.prompt)}
                  className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left shadow-sm"
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="font-semibold text-gray-800">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-2 mt-1 shrink-0">🤖</div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-2 mt-1 shrink-0">🤖</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick topics (shown after started) */}
      {started && !loading && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTopic(t.prompt)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition"
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-5 pt-2 bg-gray-50">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex items-center gap-2 bg-white border border-gray-300 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="問我任何消費相關的問題..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-30 hover:bg-blue-700 transition shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
