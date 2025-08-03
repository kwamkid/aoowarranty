// app/api/debug/tenant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getTenantFromHeaders, getCompanyBySlug } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  const headersList = await headers()
  const url = request.nextUrl
  
  // Get specific headers we need
  const tenantHeader = headersList.get('x-tenant')
  const tenantHostHeader = headersList.get('x-tenant-host')
  const hostHeader = headersList.get('host')
  
  // Get tenant info
  const { slug, isLocalhost } = await getTenantFromHeaders()
  
  // Try to get company
  let company = null
  if (slug) {
    company = await getCompanyBySlug(slug)
  }
  
  return NextResponse.json({
    debug: {
      url: {
        pathname: url.pathname,
        hostname: url.hostname,
        href: url.href
      },
      tenant: {
        slug,
        isLocalhost,
        found: !!company
      },
      company: company ? {
        id: company.id,
        name: company.name,
        slug: company.slug,
        isActive: company.isActive
      } : null,
      headers: {
        'x-tenant': tenantHeader,
        'x-tenant-host': tenantHostHeader,
        'host': hostHeader
      }
    }
  })
}