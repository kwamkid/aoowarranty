import type { Metadata } from 'next'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import { LoadingProvider } from '@/components/providers/LoadingProvider'

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-ibm-plex-sans-thai',
})

export const metadata: Metadata = {
  title: {
    default: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    template: '%s | AooWarranty'
  },
  description: 'ระบบจัดการการรับประกันสินค้าออนไลน์ ง่าย สะดวก ปลอดภัย สำหรับธุรกิจทุกขนาด',
  keywords: [
    'ระบบรับประกัน',
    'ลงทะเบียนประกัน',
    'warranty system',
    'product warranty',
    'การรับประกันสินค้า',
    'ระบบจัดการประกัน'
  ],
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
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: 'https://aoowarranty.com',
    siteName: 'AooWarranty',
    title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    description: 'ระบบจัดการการรับประกันสินค้าออนไลน์ ง่าย สะดวก ปลอดภัย',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AooWarranty'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    description: 'ระบบจัดการการรับประกันสินค้าออนไลน์ ง่าย สะดวก ปลอดภัย',
    images: ['/twitter-image.png'],
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
        {/* Additional meta tags for PWA */}
        <meta name="application-name" content="AooWarranty" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AooWarranty" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#DC2626" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#DC2626" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Prevent zoom on mobile */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className={`${ibmPlexSansThai.className} antialiased bg-white text-secondary-900`}>
        {/* Providers wrapper */}
        <QueryProvider>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </QueryProvider>
        
        {/* No script fallback */}
        <noscript>
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-2xl font-bold text-secondary-900 mb-4">
                JavaScript Required
              </h1>
              <p className="text-secondary-600">
                กรุณาเปิดใช้งาน JavaScript ในเบราว์เซอร์ของคุณเพื่อใช้งานเว็บไซต์นี้
              </p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  )
}