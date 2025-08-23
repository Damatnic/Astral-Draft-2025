import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Astral Draft V4',
  description: 'The next generation fantasy football platform',
  keywords: ['fantasy football', 'draft', 'sports', 'analytics'],
  authors: [{ name: 'Astral Projects' }],
  creator: 'Astral Projects',
  publisher: 'Astral Projects',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Astral Draft V4',
    description: 'The next generation fantasy football platform',
    url: '/',
    siteName: 'Astral Draft',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Astral Draft V4',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astral Draft V4',
    description: 'The next generation fantasy football platform',
    images: ['/og-image.png'],
    creator: '@astraldraft',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.variable}>
        <div id='root'>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}