import { getAllInvoices, type InvoiceItem } from './invoice-data'

// ─── Known Subscription Services ───

interface KnownService {
  name: string
  patterns: string[]       // match against item name or store name
  category: string
  relatedStores?: string[] // stores that indicate "usage" of the subscription
}

const KNOWN_SERVICES: KnownService[] = [
  // 影音串流
  { name: 'YouTube Premium', patterns: ['YouTube'], category: '影音串流', relatedStores: [] },
  { name: 'Netflix', patterns: ['Netflix'], category: '影音串流', relatedStores: [] },
  { name: 'Disney+', patterns: ['Disney'], category: '影音串流', relatedStores: [] },
  { name: 'HBO GO', patterns: ['HBO'], category: '影音串流', relatedStores: [] },
  // 音樂串流
  { name: 'Spotify', patterns: ['Spotify'], category: '音樂串流', relatedStores: [] },
  { name: 'KKBOX', patterns: ['KKBOX'], category: '音樂串流', relatedStores: [] },
  { name: 'Apple Music', patterns: ['Apple Music'], category: '音樂串流', relatedStores: [] },
  // AI 工具
  { name: 'ChatGPT Plus', patterns: ['ChatGPT'], category: 'AI 工具', relatedStores: ['OpenAI'] },
  // 外送平台
  { name: 'Uber One', patterns: ['Uber One'], category: '外送平台', relatedStores: ['優食台灣', 'UberEats'] },
  { name: 'Foodpanda Pro', patterns: ['Foodpanda Pro', 'pandapro'], category: '外送平台', relatedStores: ['富胖達'] },
  // App 訂閱
  { name: 'Apple 訂閱', patterns: ['Subscription 3rd Party'], category: 'App 訂閱', relatedStores: ['Apple Distribution'] },
  { name: 'Google Play 訂閱', patterns: ['Google Play 應用程式'], category: 'App 訂閱', relatedStores: ['Google Asia'] },
  // 電信
  { name: '台灣大哥大', patterns: ['電信費'], category: '電信', relatedStores: ['台灣大哥大'] },
  { name: '中華電信', patterns: ['行動電話預付卡', '電信'], category: '電信', relatedStores: ['中華電信'] },
  { name: '遠傳電信', patterns: ['電信費'], category: '電信', relatedStores: ['遠傳電信'] },
  // 公用事業
  { name: '電費', patterns: ['電費'], category: '公用事業', relatedStores: ['台灣電力'] },
  { name: '水費', patterns: ['水費'], category: '公用事業', relatedStores: ['自來水'] },
  { name: '瓦斯費', patterns: ['瓦斯費'], category: '公用事業', relatedStores: ['瓦斯'] },
  // 其他
  { name: 'Canva', patterns: ['Canva'], category: '設計工具', relatedStores: [] },
  { name: 'Adobe', patterns: ['Adobe'], category: '設計工具', relatedStores: [] },
  { name: 'Microsoft 365', patterns: ['Microsoft 365', 'Office 365'], category: '生產力工具', relatedStores: [] },
  { name: 'iCloud+', patterns: ['iCloud'], category: '雲端儲存', relatedStores: [] },
  { name: 'Google One', patterns: ['Google One'], category: '雲端儲存', relatedStores: [] },
  { name: 'Dropbox', patterns: ['Dropbox'], category: '雲端儲存', relatedStores: [] },
]

// ─── Types ───

export interface DetectedSubscription {
  name: string
  category: string
  store: string
  monthlyAmount: number
  frequency: string                  // '每月' | '每季' | '每年' | '不定期'
  occurrences: { date: string; amount: number }[]
  detectionMethod: 'known' | 'pattern' | 'trial_convert'
  status: 'active' | 'possibly_idle' | 'trial_converted'
  lastRelatedUsage?: string          // date of last related consumption
  daysSinceLastUsage?: number
  totalSpent: number
  monthsTracked: number
  estimatedAnnualCost: number
  savingsIfCancelled?: number        // only for idle ones
}

export interface SubscriptionReport {
  totalMonthly: number
  totalAnnual: number
  activeCount: number
  idleCount: number
  possibleSavingsMonthly: number
  possibleSavingsAnnual: number
  subscriptions: DetectedSubscription[]
}

// ─── Detection Engine ───

function matchesService(item: InvoiceItem, service: KnownService): boolean {
  const text = `${item.item} ${item.store}`.toLowerCase()
  return service.patterns.some(p => text.includes(p.toLowerCase()))
}

function findRelatedUsage(items: InvoiceItem[], service: KnownService): string | undefined {
  if (!service.relatedStores || service.relatedStores.length === 0) return undefined
  
  // Find the latest consumption at related stores (excluding the subscription itself)
  const related = items
    .filter(i => {
      if (i.subtotal <= 0) return false
      const isSubscription = service.patterns.some(p => 
        i.item.toLowerCase().includes(p.toLowerCase())
      )
      if (isSubscription) return false
      return service.relatedStores!.some(s => i.store.includes(s))
    })
    .sort((a, b) => b.date.localeCompare(a.date))
  
  return related[0]?.date
}

function detectKnownSubscriptions(items: InvoiceItem[]): DetectedSubscription[] {
  const results: DetectedSubscription[] = []
  
  for (const service of KNOWN_SERVICES) {
    const matches = items.filter(i => matchesService(i, service) && i.subtotal > 0)
    if (matches.length === 0) continue
    
    // Group by month to find recurring pattern
    const byMonth: Record<string, { date: string; amount: number }[]> = {}
    for (const m of matches) {
      const month = m.date.substring(0, 5)
      if (!byMonth[month]) byMonth[month] = []
      byMonth[month].push({ date: m.date, amount: m.subtotal })
    }
    
    const months = Object.keys(byMonth).sort()
    const amounts = matches.map(m => m.subtotal)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    
    const lastRelated = findRelatedUsage(items, service)
    const today = '1150220' // approximate latest date in data
    let daysSinceLastUsage: number | undefined
    if (lastRelated) {
      // Simple approximation: parse YYYMMDD
      const toNum = (d: string) => parseInt(d.substring(0, 3)) * 365 + parseInt(d.substring(3, 5)) * 30 + parseInt(d.substring(5, 7))
      daysSinceLastUsage = toNum(today) - toNum(lastRelated)
    }
    
    const totalSpent = amounts.reduce((a, b) => a + b, 0)
    const isIdle = daysSinceLastUsage !== undefined && daysSinceLastUsage > 60
    
    results.push({
      name: service.name,
      category: service.category,
      store: matches[0].store,
      monthlyAmount: Math.round(avgAmount),
      frequency: months.length >= 2 ? '每月' : '不定期',
      occurrences: matches.map(m => ({ date: m.date, amount: m.subtotal })),
      detectionMethod: 'known',
      status: isIdle ? 'possibly_idle' : 'active',
      lastRelatedUsage: lastRelated,
      daysSinceLastUsage,
      totalSpent: Math.round(totalSpent),
      monthsTracked: months.length,
      estimatedAnnualCost: Math.round(avgAmount * 12),
      savingsIfCancelled: isIdle ? Math.round(avgAmount * 12) : undefined,
    })
  }
  
  return results
}

function detectUnknownSubscriptions(items: InvoiceItem[], knownStores: Set<string>): DetectedSubscription[] {
  const results: DetectedSubscription[] = []
  
  // Group by store
  const byStore: Record<string, InvoiceItem[]> = {}
  for (const item of items) {
    if (item.subtotal <= 0) continue
    if (knownStores.has(item.store)) continue // skip already detected
    const key = item.store
    if (!byStore[key]) byStore[key] = []
    byStore[key].push(item)
  }
  
  for (const [store, storeItems] of Object.entries(byStore)) {
    // Group by approximate amount (±10%)
    const amountGroups: { amount: number; items: InvoiceItem[] }[] = []
    
    for (const item of storeItems) {
      const existing = amountGroups.find(g => 
        Math.abs(g.amount - item.subtotal) / g.amount < 0.10
      )
      if (existing) {
        existing.items.push(item)
      } else {
        amountGroups.push({ amount: item.subtotal, items: [item] })
      }
    }
    
    // Check for recurring patterns (same amount, ≥2 months)
    for (const group of amountGroups) {
      if (group.items.length < 2) continue
      
      const months = new Set(group.items.map(i => i.date.substring(0, 5)))
      if (months.size < 2) continue
      
      const avgAmount = group.items.reduce((s, i) => s + i.subtotal, 0) / group.items.length
      const shortStore = store.replace(/股份有限公司.*/, '').replace(/有限公司.*/, '').trim()
      
      results.push({
        name: `${shortStore} (疑似訂閱)`,
        category: '待確認',
        store,
        monthlyAmount: Math.round(avgAmount),
        frequency: '每月',
        occurrences: group.items.map(i => ({ date: i.date, amount: i.subtotal })),
        detectionMethod: 'pattern',
        status: 'active',
        totalSpent: Math.round(group.items.reduce((s, i) => s + i.subtotal, 0)),
        monthsTracked: months.size,
        estimatedAnnualCost: Math.round(avgAmount * 12),
      })
    }
  }
  
  return results
}

// ─── Main Detection ───

export function runSubscriptionDetective(): SubscriptionReport {
  const allItems = getAllInvoices()
  
  // Step 1: Detect known subscriptions
  const known = detectKnownSubscriptions(allItems)
  const knownStores = new Set(known.map(k => k.store))
  
  // Step 2: Detect unknown subscriptions via pattern
  const unknown = detectUnknownSubscriptions(allItems, knownStores)
  
  // Combine and sort
  const all = [...known, ...unknown].sort((a, b) => b.monthlyAmount - a.monthlyAmount)
  
  const activeCount = all.filter(s => s.status === 'active').length
  const idleCount = all.filter(s => s.status === 'possibly_idle').length
  const totalMonthly = all.reduce((s, sub) => s + sub.monthlyAmount, 0)
  const possibleSavingsMonthly = all
    .filter(s => s.status === 'possibly_idle')
    .reduce((s, sub) => s + sub.monthlyAmount, 0)
  
  return {
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    activeCount,
    idleCount,
    possibleSavingsMonthly,
    possibleSavingsAnnual: possibleSavingsMonthly * 12,
    subscriptions: all,
  }
}

// ─── Build Report String for AI ───

export function buildSubscriptionReport(): string {
  const report = runSubscriptionDetective()
  
  const subLines = report.subscriptions.map(s => {
    const statusEmoji = s.status === 'possibly_idle' ? '⚠️' : s.status === 'trial_converted' ? '🆕' : '✅'
    const usageNote = s.daysSinceLastUsage !== undefined 
      ? `(最後相關使用: ${s.daysSinceLastUsage} 天前)` 
      : ''
    return `${statusEmoji} ${s.name} | $${s.monthlyAmount}/月 | ${s.category} | ${s.detectionMethod === 'known' ? '確認' : '疑似'} | ${s.status === 'possibly_idle' ? '⚠️可能閒置' + usageNote : '使用中'} | 累計花費 $${s.totalSpent} | 追蹤 ${s.monthsTracked} 個月`
  }).join('\n')
  
  return `
## 🔍 訂閱偵測結果

### 總覽
- 偵測到訂閱/固定扣款: ${report.subscriptions.length} 筆
- 每月訂閱總額: $${report.totalMonthly.toLocaleString()}
- 年度預估: $${report.totalAnnual.toLocaleString()}
- 使用中: ${report.activeCount} 筆
- ⚠️ 可能閒置: ${report.idleCount} 筆
- 💰 每月可省: $${report.possibleSavingsMonthly.toLocaleString()}
- 💰 每年可省: $${report.possibleSavingsAnnual.toLocaleString()}

### 詳細清單
${subLines}
`
}
