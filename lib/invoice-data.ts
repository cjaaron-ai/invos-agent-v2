import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

export interface InvoiceItem {
  date: string       // YYYMMDD (ROC calendar)
  item: string
  unitPrice: number
  qty: number
  subtotal: number
  store: string
}

export interface MonthSummary {
  month: string
  total: number
  itemCount: number
  topStores: { store: string; total: number; count: number }[]
  topCategories: { category: string; total: number }[]
  subscriptions: { name: string; amount: number; store: string; date: string }[]
}

const SUBSCRIPTION_PATTERNS: Record<string, string> = {
  'YouTube': '影音串流',
  'ChatGPT': 'AI 工具',
  'Uber One': '外送平台',
  'Subscription 3rd Party': 'App 訂閱',
  'Google Play 應用程式': 'App 訂閱',
  '電信費': '電信',
  '電費': '公用事業',
  '水費': '公用事業',
  '瓦斯費': '公用事業',
}

const STORE_CATEGORY: Record<string, string> = {
  '優食台灣': '外送 (UberEats)',
  '富胖達': '外送 (Foodpanda)',
  '統一超商': '超商 (7-11)',
  '全家便利商店': '超商 (全家)',
  '全聯實業': '超市 (全聯)',
  '家福股份': '超市 (家樂福)',
  '好市多': '量販 (好市多)',
  '安心食品': '速食 (摩斯)',
  '和德昌': '速食 (麥當勞)',
  '歐特儀': '停車',
  '悠勢科技': '停車/充電',
  '日月亭': '停車',
  'Google Asia': '數位服務',
  'Apple Distribution': '數位服務',
  'OpenAI': '數位服務',
  '台灣大哥大': '電信',
  '中華電信': '電信',
  '網路家庭': '網購 (PChome)',
  '芝生鼓亭': '餐廳',
  '岳香小吃店': '小吃',
  '瑞哥小吃店': '小吃',
  '零七小吃店': '小吃',
  '鼎泰豐': '餐廳',
  '微風': '百貨/餐廳',
  '三創數位': '購物/餐廳',
}

function categorizeStore(store: string): string {
  for (const [key, cat] of Object.entries(STORE_CATEGORY)) {
    if (store.includes(key)) return cat
  }
  if (store.includes('停車')) return '停車'
  if (store.includes('餐飲') || store.includes('餐廳') || store.includes('小吃')) return '餐廳'
  return '其他'
}

function loadCSV(filename: string): InvoiceItem[] {
  const filePath = path.join(process.cwd(), 'public', 'data', filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true })
  
  return (parsed.data as any[]).map(row => ({
    date: row['消費日期'] || '',
    item: row['消費品項'] || '',
    unitPrice: parseFloat(row['單價'] || '0'),
    qty: parseFloat(row['個數'] || '0'),
    subtotal: parseFloat(row['小計'] || '0'),
    store: row['店家名稱'] || '',
  })).filter(r => r.date && r.item)
}

export function getAllInvoices(): InvoiceItem[] {
  const files = ['11412.csv', '11501.csv', '11502.csv']
  return files.flatMap(f => loadCSV(f))
}

export function getMonthInvoices(month: string): InvoiceItem[] {
  return getAllInvoices().filter(i => i.date.startsWith(month.replace('/', '')))
}

export function detectSubscriptions(items: InvoiceItem[]): MonthSummary['subscriptions'] {
  const subs: MonthSummary['subscriptions'] = []
  for (const item of items) {
    for (const [pattern, _type] of Object.entries(SUBSCRIPTION_PATTERNS)) {
      if (item.item.includes(pattern) && item.subtotal > 0) {
        subs.push({ name: item.item, amount: item.subtotal, store: item.store, date: item.date })
      }
    }
  }
  return subs
}

export function buildDataSummary(): string {
  const all = getAllInvoices()
  const positiveItems = all.filter(i => i.subtotal > 0)
  const totalSpend = positiveItems.reduce((s, i) => s + i.subtotal, 0)
  const discounts = all.filter(i => i.subtotal < 0).reduce((s, i) => s + i.subtotal, 0)
  
  // By month
  const months: Record<string, InvoiceItem[]> = {}
  for (const item of all) {
    const m = item.date.substring(0, 5) // YYYMM
    if (!months[m]) months[m] = []
    months[m].push(item)
  }
  
  // By store category
  const catSpend: Record<string, number> = {}
  for (const item of positiveItems) {
    const cat = categorizeStore(item.store)
    catSpend[cat] = (catSpend[cat] || 0) + item.subtotal
  }
  
  // Top stores
  const storeSpend: Record<string, number> = {}
  for (const item of positiveItems) {
    const shortStore = item.store.replace(/股份有限公司.*/, '').replace(/有限公司.*/, '').trim()
    storeSpend[shortStore] = (storeSpend[shortStore] || 0) + item.subtotal
  }
  const topStores = Object.entries(storeSpend).sort((a, b) => b[1] - a[1]).slice(0, 15)
  
  // Subscriptions
  const subs = detectSubscriptions(all)
  
  // Monthly breakdown
  const monthlyData = Object.entries(months).sort().map(([m, items]) => {
    const pos = items.filter(i => i.subtotal > 0)
    const total = pos.reduce((s, i) => s + i.subtotal, 0)
    return `${m.substring(0,3)}年${m.substring(3)}月: $${Math.round(total).toLocaleString()} (${pos.length} 筆消費)`
  }).join('\n')
  
  // Category breakdown
  const catData = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => 
    `${cat}: $${Math.round(amount).toLocaleString()} (${(amount/totalSpend*100).toFixed(1)}%)`
  ).join('\n')
  
  // Store breakdown
  const storeData = topStores.map(([store, amount]) => 
    `${store}: $${Math.round(amount).toLocaleString()}`
  ).join('\n')
  
  // Subscription breakdown  
  const subData = subs.map(s => `${s.name}: $${s.amount} (${s.store}, ${s.date})`).join('\n')
  
  // Frequent items
  const itemFreq: Record<string, { count: number; total: number }> = {}
  for (const item of positiveItems) {
    if (item.item.includes('優惠') || item.item.includes('折') || item.item.includes('印花') || item.item === '其他') continue
    const key = item.item
    if (!itemFreq[key]) itemFreq[key] = { count: 0, total: 0 }
    itemFreq[key].count += item.qty
    itemFreq[key].total += item.subtotal
  }
  const topItems = Object.entries(itemFreq).sort((a, b) => b[1].count - a[1].count).slice(0, 20)
  const topItemsData = topItems.map(([item, d]) => `${item}: ${d.count}次, $${Math.round(d.total).toLocaleString()}`).join('\n')

  return `
## 發票資料摘要（114年12月 ~ 115年2月，共 3 個月）

### 總覽
- 總消費筆數: ${positiveItems.length} 筆
- 總消費金額: $${Math.round(totalSpend).toLocaleString()}
- 折扣/優惠: $${Math.round(discounts).toLocaleString()}
- 淨支出: $${Math.round(totalSpend + discounts).toLocaleString()}

### 月度支出
${monthlyData}

### 消費類別分布
${catData}

### Top 15 店家
${storeData}

### 偵測到的訂閱服務
${subData}

### 高頻消費品項 (Top 20)
${topItemsData}

### 原始資料欄位: 消費日期, 消費品項, 單價, 個數, 小計, 店家名稱
用戶可以詢問任何關於這些資料的問題。
`
}
