import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import TargetCursor from '@/components/TargetCursor'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AetherCall AI Video Conference',
  description: 'AI-powered engagement and secure linkless meetings platform.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          {children}
          <TargetCursor
            spinDuration={2}
            hideDefaultCursor
            parallaxOn
            hoverDuration={0.2}
            targetSelector="button, a, input, select, textarea, .cursor-target"
          />
        </ClerkProvider>
      </body>
    </html>
  )
}
