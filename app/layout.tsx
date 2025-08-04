import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import './globals.css'
import { LoadingProvider } from '@/components/providers/LoadingProvider'

// Import suppress warnings in development
if (process.env.NODE_ENV === 'development') {
  import('./suppress-warnings')
}

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['latin', 'thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans-thai',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ef4444',
}

export const metadata: Metadata = {
  title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
  description: 'ระบบลงทะเบียนรับประกันสินค้าออนไลน์ที่ทันสมัย รองรับ LINE Login และจัดการข้อมูลประกันอย่างมีประสิทธิภาพ',
  keywords: 'warranty, รับประกัน, ลงทะเบียน, LINE Login, ระบบจัดการ',
  authors: [{ name: 'AooWarranty Team' }],
  creator: 'AooWarranty',
  publisher: 'AooWarranty',
  robots: 'index, follow',
  openGraph: {
    title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    description: 'ระบบลงทะเบียนรับประกันสินค้าออนไลน์ที่ทันสมัย',
    url: 'https://aoowarranty.com',
    siteName: 'AooWarranty',
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AooWarranty - ระบบลงทะเบียนรับประกันสินค้า',
    description: 'ระบบลงทะเบียนรับประกันสินค้าออนไลน์ที่ทันสมัย',
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
        {/* Preconnect to Google Fonts for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* iOS Status Bar */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AooWarranty" />
        
        {/* LINE LIFF SDK */}
        <script src="https://static.line-scdn.net/liff/edge/versions/2.22.0/sdk.js" async></script>
      </head>
      <body className={`${ibmPlexSansThai.className} antialiased bg-accent-50 text-secondary-800`}>
        <LoadingProvider>
          <div id="root">
            {children}
          </div>
        </LoadingProvider>
        
        {/* Global Scripts */}
        <div id="modal-root" />
        <div id="toast-root" />
      </body>
    </html>
  )
}