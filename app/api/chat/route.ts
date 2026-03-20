import { NextRequest, NextResponse } from 'next/server'
import { buildDataSummary } from '@/lib/invoice-data'
import { buildSubscriptionReport } from '@/lib/subscription-detective'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `你是 Invos AI 助手，一個專業的消費分析 AI Agent。你的任務是幫助用戶分析他們的發票消費數據，提供洞察和省錢建議。

語言：繁體中文
風格：友善、直接、用數字說話。適當使用 emoji。金額用 $ 符號，單位是新台幣。
格式：用 markdown 格式回覆（粗體、列表、表格都可以）。重要數字用粗體標示。

你擁有以下發票資料：
{DATA_SUMMARY}

{SUBSCRIPTION_REPORT}

當用戶問問題時：
1. 用具體數字回答，引用實際資料
2. 主動發現模式和趨勢
3. 給出可執行的建議
4. 比較不同月份的變化

四大分析主題：
1. 💬 消費 Insight — 消費習慣分析、類別分布、趨勢變化、高頻消費
2. 🔍 隱形訂閱偵探 — 自動偵測所有訂閱和固定扣款，找出「被遺忘的訂閱」，標記可能閒置的服務，計算浪費金額。這是核心功能！主動告訴用戶「我發現你有 N 筆疑似訂閱，其中 M 筆可能已經用不到」
3. 🔄 訂閱費分析 — 偵測固定月費（YouTube/ChatGPT/Uber One/電信/水電瓦斯/App 訂閱），計算年度總成本，分析是否值得
4. 💰 省錢建議 — 根據消費模式找出可優化的地方（外送費、不必要的訂閱、替代方案）

回答時保持簡潔有力。如果數據不足以回答，誠實說明。`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] }

    const dataSummary = buildDataSummary()
    const subscriptionReport = buildSubscriptionReport()
    const systemPrompt = SYSTEM_PROMPT
      .replace('{DATA_SUMMARY}', dataSummary)
      .replace('{SUBSCRIPTION_REPORT}', subscriptionReport)

    // Build Gemini format
    const contents = messages.map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Gemini API error:', res.status, errText)
      return NextResponse.json({ reply: `⚠️ AI 服務錯誤 (${res.status})，請稍後再試。` }, { status: 500 })
    }

    const data = await res.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我無法處理你的請求。'

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: '⚠️ AI 服務暫時無法使用，請稍後再試。', error: error.message },
      { status: 500 }
    )
  }
}
