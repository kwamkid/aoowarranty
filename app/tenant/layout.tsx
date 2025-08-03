// app/tenant/layout.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getTenantContext()
  
  return {
    title: company?.name || 'WarrantyHub',
    description: `ระบบลงทะเบียนรับประกันสินค้าของ ${company?.name || 'WarrantyHub'}`,
  }
}

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenant, company } = await getTenantContext()
  
  // ถ้าไม่มี tenant หรือ company ไม่ active
  if (!tenant || !company) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-accent-50">
      {/* Company Context Provider */}
      <div data-tenant={tenant} data-company-id={company.id}>
        {children}
      </div>
    </div>
  )
}