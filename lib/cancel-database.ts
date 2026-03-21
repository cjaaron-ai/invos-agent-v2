// Cancel method database for Taiwan subscription services

export interface CancelMethod {
  service: string
  patterns: string[]          // match store name or item name
  category: string
  method: 'appstore' | 'playstore' | 'website' | 'email' | 'phone' | 'chat' | 'in_person'
  cancelUrl?: string
  cancelEmail?: string
  cancelPhone?: string
  steps: string[]
  emailTemplate?: string
  phoneScript?: string
  tips: string[]
}

export const CANCEL_DATABASE: CancelMethod[] = [
  // ─── 影音串流 ───
  {
    service: 'YouTube Premium',
    patterns: ['YouTube'],
    category: '影音串流',
    method: 'website',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
    steps: [
      '登入 YouTube → 點右上角頭像',
      '選「購買內容與會員資格」',
      '找到 YouTube Premium → 點「管理會員資格」',
      '點「停用」→ 確認取消',
    ],
    tips: ['取消後仍可使用到當期結束', '如果是透過 Apple/Google 訂閱的，需從 App Store/Google Play 取消'],
  },
  {
    service: 'Netflix',
    patterns: ['Netflix'],
    category: '影音串流',
    method: 'website',
    cancelUrl: 'https://www.netflix.com/cancelplan',
    steps: [
      '登入 Netflix → 點右上角頭像',
      '選「帳戶」',
      '在「會員資格與帳款」區點「取消會員資格」',
      '確認取消',
    ],
    tips: ['取消後可看到當期結束', '重新訂閱隨時可以，不會失去觀看紀錄'],
  },
  {
    service: 'Disney+',
    patterns: ['Disney'],
    category: '影音串流',
    method: 'website',
    cancelUrl: 'https://www.disneyplus.com/account',
    steps: [
      '登入 Disney+ → 頭像 → 帳號',
      '選「訂閱方案」',
      '點「取消訂閱」→ 確認',
    ],
    tips: ['如果透過電信業者訂閱（如台灣大哥大），需聯繫電信客服取消'],
  },
  // ─── 音樂串流 ───
  {
    service: 'Spotify',
    patterns: ['Spotify'],
    category: '音樂串流',
    method: 'website',
    cancelUrl: 'https://www.spotify.com/account/subscription/',
    steps: [
      '登入 Spotify 官網（非 App）',
      '前往「帳戶」→「訂閱方案」',
      '點「變更方案」→ 選「取消 Premium」',
      '確認取消',
    ],
    tips: ['取消後降為免費版（有廣告）', '播放清單和收藏不會消失'],
  },
  {
    service: 'KKBOX',
    patterns: ['KKBOX'],
    category: '音樂串流',
    method: 'appstore',
    steps: [
      'iPhone：設定 → Apple ID → 訂閱項目 → KKBOX → 取消訂閱',
      'Android：Google Play → 付款與訂閱 → 訂閱 → KKBOX → 取消',
      '如果是官網訂閱：登入 KKBOX → 會員中心 → 取消自動續費',
    ],
    tips: ['取消後可用到到期日', '離線下載的歌會在到期後移除'],
  },
  // ─── AI 工具 ───
  {
    service: 'ChatGPT Plus',
    patterns: ['ChatGPT'],
    category: 'AI 工具',
    method: 'website',
    cancelUrl: 'https://chat.openai.com/',
    steps: [
      '登入 ChatGPT → 左下角頭像',
      '選「我的方案」(My Plan)',
      '點「管理我的訂閱」(Manage my subscription)',
      '選「取消方案」(Cancel plan)',
    ],
    tips: ['取消後降回免費版（GPT-3.5）', '對話紀錄不會消失'],
  },
  // ─── 外送平台 ───
  {
    service: 'Uber One',
    patterns: ['Uber One'],
    category: '外送平台',
    method: 'website',
    cancelUrl: 'https://www.ubereats.com/',
    steps: [
      '開啟 Uber/UberEats App',
      '點「帳戶」→「Uber One」',
      '點「管理會員資格」',
      '選「取消 Uber One」→ 確認',
    ],
    tips: ['取消後失去免外送費和折扣', '計算一下你每月外送次數，低於 3 次就不划算'],
  },
  {
    service: 'Foodpanda Pro',
    patterns: ['Foodpanda Pro', 'pandapro'],
    category: '外送平台',
    method: 'website',
    steps: [
      '開啟 Foodpanda App',
      '點「我的」→「pandapro」',
      '選「管理訂閱」',
      '點「取消訂閱」→ 確認',
    ],
    tips: ['取消後單筆運費約 $39-59', '月叫不到 3 次就不需要 Pro'],
  },
  // ─── App 訂閱 ───
  {
    service: 'Apple 第三方訂閱',
    patterns: ['Subscription 3rd Party', 'Apple Distribution'],
    category: 'App 訂閱',
    method: 'appstore',
    steps: [
      'iPhone：設定 → 最上方 Apple ID → 訂閱項目',
      '找到要取消的 App → 點進去',
      '選「取消訂閱」→ 確認',
    ],
    tips: ['很多人不知道的小訣竅：直接在「設定」裡就能管理所有訂閱', '不確定是哪個 App？看訂閱名稱和金額比對'],
  },
  {
    service: 'Google Play 訂閱',
    patterns: ['Google Play 應用程式', 'Google Asia'],
    category: 'App 訂閱',
    method: 'playstore',
    cancelUrl: 'https://play.google.com/store/account/subscriptions',
    steps: [
      '開啟 Google Play App',
      '點右上角頭像 →「付款與訂閱」→「訂閱」',
      '找到要取消的訂閱 → 點進去',
      '選「取消訂閱」→ 確認',
    ],
    tips: ['$657/月的 Google Play 費用很高，建議仔細檢查是哪些 App 在扣款', '可能是多個 App 加總'],
  },
  // ─── 電信 ───
  {
    service: '台灣大哥大（降資/退租）',
    patterns: ['台灣大哥大'],
    category: '電信',
    method: 'phone',
    cancelPhone: '188（免費客服）',
    steps: [
      '撥打 188 → 按 0 轉客服人員',
      '說明要「降資」或「退租」',
      '客服會查詢合約狀態',
      '如果有合約違約金，請先確認金額',
    ],
    phoneScript: '你好，我想查詢我目前的月租方案，以及如果要降到更低資費或退租，有沒有違約金？我的門號是 ___。',
    tips: [
      '合約期內退租有違約金，建議先降資而非退租',
      '可以先問有沒有「優惠續約方案」，通常比原價便宜',
      '去門市也可以辦，但電話比較快',
    ],
  },
  {
    service: '中華電信（降資/退租）',
    patterns: ['中華電信'],
    category: '電信',
    method: 'phone',
    cancelPhone: '800（免費客服）',
    steps: [
      '撥打 800 → 按 0 轉客服人員',
      '說明要「降資」或查詢方案',
      '客服會查詢合約和最低資費方案',
    ],
    phoneScript: '你好，我想了解我目前的資費方案，以及有沒有更便宜的方案可以轉？我的門號是 ___。',
    tips: ['中華電信的 4G 吃到飽通常可以降到 $299/月', '合約到期前可以提前談續約優惠'],
  },
  // ─── 健身 ───
  {
    service: '健身工廠',
    patterns: ['健身工廠'],
    category: '健身運動',
    method: 'in_person',
    cancelPhone: '0800-888-123',
    steps: [
      '攜帶身分證到「原辦卡分館」',
      '填寫退會申請書',
      '注意：需在扣款日前 15 天提出',
      '退會需要 30 天預告期',
    ],
    phoneScript: '你好，我想辦理退會，請問需要帶什麼文件？我的會員編號是 ___。需要到哪個分館辦理？',
    tips: [
      '⚠️ 健身房是最難取消的訂閱之一',
      '一定要親自到場，不接受電話/線上退會',
      '退會後通常還會再扣一個月（預告期）',
      '如果只是暫時不去，可以先問「休會」（暫停 1-3 個月）',
    ],
  },
  {
    service: 'World Gym',
    patterns: ['World Gym', 'WorldGym'],
    category: '健身運動',
    method: 'in_person',
    cancelPhone: '各分館電話',
    steps: [
      '攜帶身分證到分館',
      '填寫終止合約申請',
      '合約內可能需付違約金',
    ],
    phoneScript: '你好，我想了解終止會籍的流程和費用，我的會員編號是 ___。',
    tips: ['違約金通常是剩餘月費的一定比例', '建議先打電話問清楚再去'],
  },
  // ─── 雲端/軟體 ───
  {
    service: 'Canva Pro',
    patterns: ['Canva'],
    category: '設計工具',
    method: 'website',
    cancelUrl: 'https://www.canva.com/settings/billing',
    steps: [
      '登入 Canva → 右上角齒輪 → 帳單與方案',
      '點「取消方案」',
      '確認取消',
    ],
    tips: ['取消後降為免費版，大部分設計功能還是能用', '付費素材會無法使用'],
  },
  {
    service: 'Adobe Creative Cloud',
    patterns: ['Adobe'],
    category: '設計工具',
    method: 'website',
    cancelUrl: 'https://account.adobe.com/plans',
    cancelEmail: 'support@adobe.com',
    steps: [
      '登入 Adobe 帳號 → 方案與付款',
      '選擇要取消的方案 → 點「取消方案」',
      '⚠️ 年約提前取消會有「提前終止費」（剩餘月費的 50%）',
    ],
    tips: [
      'Adobe 是出了名的難取消',
      '年約中途取消要付 50% 違約金',
      '建議在年約到期前取消，選「不自動續約」',
    ],
  },
  {
    service: 'iCloud+',
    patterns: ['iCloud'],
    category: '雲端儲存',
    method: 'appstore',
    steps: [
      'iPhone：設定 → Apple ID → iCloud → 管理儲存空間',
      '或：設定 → Apple ID → 訂閱項目 → iCloud+',
      '選「降級儲存空間」→ 選免費 5GB',
    ],
    tips: ['降級前請確認 iCloud 已用空間', '超過 5GB 的資料需要先備份或刪除'],
  },
]

// Build cancel guide for a specific service
export function getCancelGuide(serviceName: string): CancelMethod | undefined {
  return CANCEL_DATABASE.find(c => 
    c.service.toLowerCase().includes(serviceName.toLowerCase()) ||
    c.patterns.some(p => serviceName.toLowerCase().includes(p.toLowerCase()))
  )
}

// Build email template for cancellation
export function generateCancelEmail(service: CancelMethod, userName?: string): string {
  return `Subject: 取消訂閱申請 — ${service.service}

您好，

我是${userName || '___（請填入姓名）'}，來信申請取消 ${service.service} 的訂閱服務。

訂閱帳號/Email：___（請填入）

請協助處理取消事宜，並確認：
1. 取消生效日期
2. 是否有任何未結費用
3. 確認後續不會再有自動扣款

感謝您的協助。

${userName || '___'}
${new Date().toISOString().split('T')[0]}`
}

// Build complete cancel report string for AI context
export function buildCancelDatabaseContext(): string {
  const services = CANCEL_DATABASE.map(c => {
    const methodLabel = {
      'appstore': 'App Store 管理',
      'playstore': 'Google Play 管理',
      'website': '官網取消',
      'email': 'Email 取消',
      'phone': '電話取消',
      'chat': '線上客服',
      'in_person': '需親自到場',
    }[c.method]
    
    return `- ${c.service}（${c.category}）: ${methodLabel}${c.cancelUrl ? ` | ${c.cancelUrl}` : ''}${c.cancelPhone ? ` | 📞 ${c.cancelPhone}` : ''}`
  }).join('\n')
  
  return `
## 取消訂閱資料庫（${CANCEL_DATABASE.length} 個服務）

${services}

你可以：
1. 提供完整的取消步驟指引
2. 代寫取消 Email（用戶確認後寄出）
3. 產出客服電話話術腳本
4. 提醒取消注意事項（違約金、預告期等）
`
}
