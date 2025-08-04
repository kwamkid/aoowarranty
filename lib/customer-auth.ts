// lib/customer-auth.ts
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface CustomerSession {
  customerId: string
  lineUserId: string
  displayName: string
  pictureUrl?: string
  email?: string
  companyId: string
  tenant: string
  accessToken: string
}

// Get customer session (for Server Components)
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('line-session')
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

// Require customer authentication (for Server Components)
export async function requireCustomerAuth(tenant: string) {
  const session = await getCustomerSession()
  
  if (!session || session.tenant !== tenant) {
    redirect(`/${tenant}`)
  }
  
  return session
}

// Check if customer can access warranty
export async function canAccessWarranty(
  session: CustomerSession,
  warrantyCustomerId: string
): Promise<boolean> {
  return session.customerId === warrantyCustomerId
}

// Check if customer is logged in (for conditional rendering)
export async function isCustomerLoggedIn(tenant: string): Promise<boolean> {
  const session = await getCustomerSession()
  return !!(session && session.tenant === tenant)
}