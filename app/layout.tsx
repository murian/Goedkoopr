import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Receipt Expense Tracker',
  description: 'AI-powered receipt scanning and expense tracking with product price comparison',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
