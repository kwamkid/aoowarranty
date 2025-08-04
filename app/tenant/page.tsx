// app/tenant/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { getCustomerSession } from '@/lib/customer-auth'
import CustomerHomePage from './CustomerHomePage'

export default async function TenantHomePage() {
  const { company, tenant } = await getTenantContext()
  
  if (!company || !tenant) return null
  
  // Check if customer is logged in
  const session = await getCustomerSession()
  const isLoggedIn = !!(session && session.tenant === tenant)
  
  // Convert company data to plain object (serialize Date objects)
  const companyData = {
    id: company.id,
    name: company.name,
    slug: company.slug,
    email: company.email,
    phone: company.phone,
    address: company.address,
    district: company.district,
    amphoe: company.amphoe,
    province: company.province,
    postcode: company.postcode,
    website: company.website || '',
    logo: company.logo || '',
    isActive: company.isActive,
    // Convert Date to string
    createdAt: company.createdAt instanceof Date 
      ? company.createdAt.toISOString() 
      : (typeof company.createdAt === 'string' ? company.createdAt : new Date().toISOString()),
    createdBy: company.createdBy,
    totalUsers: company.totalUsers || 0,
    totalWarranties: company.totalWarranties || 0
  }
  
  // Convert session to plain object if exists
  const sessionData = session ? {
    customerId: session.customerId,
    lineUserId: session.lineUserId,
    displayName: session.displayName,
    pictureUrl: session.pictureUrl || '',
    email: session.email || '',
    companyId: session.companyId,
    tenant: session.tenant
  } : null
  
  return (
    <CustomerHomePage 
      company={companyData}
      tenant={tenant}
      isLoggedIn={isLoggedIn}
      session={sessionData}
    />
  )
}