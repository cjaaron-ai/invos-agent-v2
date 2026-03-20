import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Invos AI Agent',
  description: '你的智慧消費分析助手',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
