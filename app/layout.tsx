import type { Metadata, Viewport } from 'next'
import { Montserrat, Lato } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _montserrat = Montserrat({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-montserrat" });
const _lato = Lato({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-lato" });

export const metadata: Metadata = {
  title: 'Central MAV - Dashboard Directivo',
  description: 'Sistema de seguimiento de personal MAV',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a257c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${_montserrat.variable} ${_lato.variable} font-sans antialiased text-slate-900`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
