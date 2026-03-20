import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildDataSummary, getAllInvoices } from '@/lib/invoice-data'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

const SYSTEM_PROMPT = `你是 Invos AI 助手，一個專業的消費分析 AI Agent。你的任務是幫助用戶分析他們的發票消費數據，提供洞察和省錢建議。

語言：繁體中文
風格：友善、直接、用數字說話。適當使用 emoji。金額用 $ 符號，單位是新台幣。

你擁有以下發票資料：
{DATA_SUMMARY}

當用戶問問題時：
1. 用具體數字回答，引用實際資料
2. 主動發現模式和趨勢
3. 給出可執行的建議
4. 比較不同月份的變化

三大分析主題：
1. 💬 消費 Insight — 消費習慣分析、類別分布、趨勢變化、高頻消費
2. 🔄 訂閱費分析 — 偵測固定月費（YouTube/ChatGPT/Uber One/電信/水電瓦斯/App 訂閱），計算年度總成本，分析是否值得
3. 💰 省錢建議 — 根據消費模式找出可優化的地方（外送費、不必要的訂閱、替代方案）

回答時保持簡潔有力，重點用粗體。如果數據不足以回答，誠實說明。`

export async function POST(req: NextRequest) {
  try {
    const { messages, topic } = await req.json()
    
    const dataSummary = buildDataSummary()
    const systemPrompt = SYSTEM_PROMPT.replace('{DATA_SUMMARY}', dataSummary)
    
    // If topic is provided, add a pre-prompt
    let userMessages = [...messages]
    if (topic && messages.length === 1 && messages[0].role === 'user') {
      // First message with topic context
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...userMessages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })
    
    const reply = completion.choices[0]?.message?.content || '抱歉，我無法處理你的請求。'
    
    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: '⚠️ AI 服務暫時無法使用，請稍後再試。', error: error.message },
      { status: 500 }
    )
  }
}
