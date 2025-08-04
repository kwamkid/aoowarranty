// app/tenant/admin/(protected)/users/[id]/edit/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import EditUserClientPage from './EditUserClientPage'

interface User {
  id: string
  companyId: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'manager' | 'viewer'
  isActive: boolean
}

async function getUser(userId: string, companyId: string): Promise<User | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return null
    }
    
    const data = userDoc.data()
    if (!data || data.companyId !== companyId) {
      return null
    }
    
    return {
      id: userDoc.id,
      companyId: data.companyId,
      email: data.email,
      name: data.name || data.email,
      role: data.role || 'viewer',
      isActive: data.isActive !== false
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export default async function EditUserPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { company } = await getTenantContext()
  if (!company) {
    notFound()
  }
  
  // Await params
  const { id: userId } = await params
  
  // Fetch user data
  const user = await getUser(userId, company.id)
  
  if (!user) {
    notFound()
  }
  
  return (
    <EditUserClientPage
      initialUser={user}
      tenant={company.slug}
      userId={userId}
    />
  )
}