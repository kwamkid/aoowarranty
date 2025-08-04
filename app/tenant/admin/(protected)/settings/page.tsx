// app/tenant/admin/(protected)/settings/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { redirect } from 'next/navigation'
import SettingsClientPage from './SettingsClientPage'

export default async function SettingsPage() {
  const { company, tenant } = await getTenantContext()
  
  if (!company || !tenant) {
    redirect('/')
  }
  
  // Convert company data to plain object for client component
  const companyData = {
    id: company.id,
    name: company.name,
    slug: company.slug,
    logo: company.logo || '',
    address: company.address,
    district: company.district,
    amphoe: company.amphoe,
    province: company.province,
    postcode: company.postcode,
    phone: company.phone,
    email: company.email,
    website: company.website || '',
    lineChannelId: company.lineChannelId || ''
  }
  
  return <SettingsClientPage initialData={companyData} tenant={tenant} />
}