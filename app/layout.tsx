import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RealtimeProvider } from '@/components/realtime/realtime-provider'
import { ThemeProvider } from '@/components/theme/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vici Peptides Dashboard',
  description: 'Vici Peptides analytics dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RealtimeProvider>{children}</RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
