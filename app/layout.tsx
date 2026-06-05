import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import SplashCursor from '@/components/SplashCursor'

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
          <SplashCursor
            SIM_RESOLUTION={160}
            DYE_RESOLUTION={166}
            DENSITY_DISSIPATION={3.5}
            VELOCITY_DISSIPATION={2}
            PRESSURE={0.3}
            CURL={6}
            SPLAT_RADIUS={0.4}
            SPLAT_FORCE={6000}
            COLOR_UPDATE_SPEED={10}
          />
        </ClerkProvider>
      </body>
    </html>
  )
}
