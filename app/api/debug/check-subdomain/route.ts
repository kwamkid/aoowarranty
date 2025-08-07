// app/api/debug/check-subdomain/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const xTenant = headersList.get('x-tenant') || ''
  const referer = headersList.get('referer') || ''
  
  // Manual subdomain detection
  let detectedSubdomain = ''
  const parts = host.split('.')
  
  // Different detection strategies
  const detection = {
    // Strategy 1: Simple first part
    firstPart: parts[0],
    
    // Strategy 2: Check if not www
    notWww: parts[0] !== 'www' ? parts[0] : '',
    
    // Strategy 3: Full check
    fullCheck: ''
  }
  
  // Full check logic
  if (parts.length >= 2) {
    const first = parts[0]
    if (first !== 'www' && first !== 'aoowarranty' && first !== 'warrantyhub') {
      detection.fullCheck = first
    }
  }
  
  return NextResponse.json({
    request: {
      url: request.url,
      pathname: request.nextUrl.pathname,
      host: host,
      referer: referer
    },
    headers: {
      'x-tenant': xTenant,
      'host': host,
      'x-original-hostname': headersList.get('x-original-hostname') || ''
    },
    detection: detection,
    hostParts: parts,
    partsCount: parts.length,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN
    }
  })
}