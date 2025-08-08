// app/tenant/admin/(protected)/layout.tsx
// This layout applies authentication check
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTenantContext } from '@/lib/tenant-context'
import { loginUrl } from '@/lib/url-helper'
import AdminLayout from '@/components/admin/AdminLayout'

async function getAuthSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get tenant context
  const { tenant, company } = await getTenantContext()
  
  if (!tenant || !company) {
    redirect('/')
  }
  
  // Check authentication
  const session = await getAuthSession()
  
  if (!session) {
    // Use url-helper to get correct login URL
    const redirectUrl = loginUrl({ 
      tenant,
      isProduction: process.env.NODE_ENV === 'production'
    })
    redirect(redirectUrl)
  }
  
  // Verify user belongs to this company
  if (session.companyId !== company.id) {
    // User is logged in but wrong company - redirect to login
    const redirectUrl = loginUrl({ 
      tenant,
      isProduction: process.env.NODE_ENV === 'production'
    })
    redirect(redirectUrl)
  }
  
  // Prepare data for AdminLayout
  const companyInfo = {
    name: company.name,
    logo: company.logo || undefined
  }
  
  const userInfo = {
    name: session.name || session.email,
    email: session.email,
    role: session.role
  }
  
  return (
    <AdminLayout companyInfo={companyInfo} userInfo={userInfo}>
      {children}
    </AdminLayout>
  )
}