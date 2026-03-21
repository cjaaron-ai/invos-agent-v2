import { NextRequest, NextResponse } from 'next/server'
import { buildDataSummary } from '@/lib/invoice-data'
import { buildSubscriptionReport } from '@/lib/subscription-detective'
import { buildCancelDatabaseContext } from '@/lib/cancel-database'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `你是 Invos AI 助手，一個專業的消費分析 AI Agent。你的任務是幫助用戶分析他們的發票消費數據，提供洞察和省錢建議。

語言：繁體中文
風格：友善、直接、用數字說話。適當使用 emoji。金額用 $ 符號，單位是新台幣。
格式：用 markdown 格式回覆（粗體、列表、表格都可以）。重要數字用粗體標示。

你擁有以下發票資料：
{DATA_SUMMARY}

{SUBSCRIPTION_REPORT}

{CANCEL_DATABASE}

當用戶問問題時：
1. 用具體數字回答，引用實際資料
2. 主動發現模式和趨勢
3. 給出可執行的建議
4. 比較不同月份的變化

四大分析主題：
1. 🔍 掃描我的訂閱 — 核心功能！自動偵測所有訂閱和固定扣款，找出「被遺忘的訂閱」，標記閒置服務，計算浪費金額。主動告訴用戶發現了什麼。
2. ✂️ 幫我取消訂閱 — 超級核心功能！列出建議取消的訂閱，提供完整取消步驟、代寫取消 Email、產出客服話術腳本。讓取消變得超簡單。
3. 💰 我每月花多少在訂閱 — 訂閱支出摘要、年度成本、與建議的對比
4. 💬 消費 Insight — 整體消費習慣分析、類別分布、趨勢

當用戶想取消某個服務時，你要：
- 提供該服務的完整取消步驟（參考取消訂閱資料庫）
- 如果是需要寫 Email 的，直接產出一封可以複製貼上的取消信
- 如果是需要打電話的，產出一份話術腳本（包含常見推銷話術的應對方式）
- 提醒注意事項（違約金、預告期、資料備份等）
- 取消連結用粗體標示，方便點擊

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
    const cancelDatabase = buildCancelDatabaseContext()
    const systemPrompt = SYSTEM_PROMPT
      .replace('{DATA_SUMMARY}', dataSummary)
      .replace('{SUBSCRIPTION_REPORT}', subscriptionReport)
      .replace('{CANCEL_DATABASE}', cancelDatabase)

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
