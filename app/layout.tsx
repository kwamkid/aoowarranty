import type { Metadata } from 'next'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import './globals.css'
import { LoadingProvider } from '@/components/providers/LoadingProvider'

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans-thai',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
  description: 'ระบบลงทะเบียนรับประกันสินค้าออนไลน์ ให้ลูกค้าลงทะเบียนผ่าน LINE ไม่ต้องกังวลใบรับประกันหาย จัดการข้อมูลลูกค้าและสินค้าอัตโนมัติ',
  keywords: 'ระบบรับประกัน, ลงทะเบียนประกัน, LINE Login, warranty system, ระบบจัดการลูกค้า',
  authors: [{ name: 'AooWarranty Team' }],
  creator: 'AooWarranty',
  publisher: 'AooWarranty',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/favicon.png',
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    description: 'ระบบลงทะเบียนรับประกันสินค้าออนไลน์ ให้ลูกค้าลงทะเบียนผ่าน LINE ไม่ต้องกังวลใบรับประกันหาย',
    url: 'https://aoowarranty.com',
    siteName: 'AooWarranty',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    description: 'ระบบลงทะเบียนรับประกันสินค้าออนไลน์ ให้ลูกค้าลงทะเบียนผ่าน LINE',
    images: ['/og-image.png'],
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
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={ibmPlexSansThai.variable}>
      <head>
        {/* Additional meta tags for better compatibility */}
        <meta name="theme-color" content="#ef4444" />
        <meta name="msapplication-TileColor" content="#ef4444" />
        <link rel="mask-icon" href="/favicon.png" color="#ef4444" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className={`${ibmPlexSansThai.className} antialiased`}>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  )
}