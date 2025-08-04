// app/tenant/admin/(protected)/users/page.tsx
import { getTenantContext } from '@/lib/tenant-context'
import { adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import UsersClientPage from './UsersClientPage'

interface User {
  id: string
  companyId: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'manager' | 'viewer'
  isActive: boolean
  lastLogin?: Date | null
  createdAt: Date
  createdBy: string
}

async function checkAccess(companyId: string) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie) {
    return false
  }
  
  try {
    const session = JSON.parse(sessionCookie.value)
    return session.companyId === companyId && ['owner', 'admin'].includes(session.role)
  } catch {
    return false
  }
}

async function getUsers(companyId: string): Promise<User[]> {
  const usersSnapshot = await adminDb
    .collection('users')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .get()
  
  const users: User[] = []
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data()
    
    // Convert Firestore Timestamp to Date
    const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
    const lastLogin = data.lastLogin?.toDate?.() || data.lastLogin || null
    
    users.push({
      id: doc.id,
      companyId: data.companyId,
      email: data.email,
      name: data.name || data.email,
      role: data.role || 'viewer',
      isActive: data.isActive !== false,
      lastLogin: lastLogin,
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      createdBy: data.createdBy || 'system'
    })
  }
  
  return users
}

export default async function UsersPage() {
  const { company } = await getTenantContext()
  if (!company) return null
  
  // Check access permission
  const hasAccess = await checkAccess(company.id)
  if (!hasAccess) {
    redirect(`/${company.slug}/admin`)
  }
  
  let users: User[] = []
  let tenant = company.slug
  
  try {
    users = await getUsers(company.id)
  } catch (error) {
    console.error('Error fetching users:', error)
  }
  
  // Get current user session
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-session')
  const currentUserId = sessionCookie ? JSON.parse(sessionCookie.value).userId : null
  
  // Serialize users data
  const serializedUsers = users.map(user => ({
    ...user,
    lastLogin: user.lastLogin?.toISOString() || null,
    createdAt: user.createdAt.toISOString()
  }))
  
  return (
    <UsersClientPage 
      initialUsers={serializedUsers} 
      tenant={tenant}
      currentUserId={currentUserId}
    />
  )
}