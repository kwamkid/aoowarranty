// app/tenant/admin/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTenantContext } from '@/lib/tenant-context'
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

export default async function TenantAdminLayout({
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
    redirect(`/${tenant}/admin/login`)
  }
  
  // Verify user belongs to this company
  if (session.companyId !== company.id) {
    redirect(`/${tenant}/admin/login`)
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