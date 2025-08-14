'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AdminUser } from '@/types'

interface AuthContextType {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string, companyId: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        // Load admin user data
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setAdminUser({
              id: userDoc.id,
              ...userDoc.data()
            } as AdminUser)
          }
        } catch (error) {
          console.error('Error loading admin user:', error)
        }
      } else {
        setUser(null)
        setAdminUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string, companyId: string) => {
    try {
      // First, check if user exists in our database
      const usersRef = collection(db, 'users')
      const q = query(usersRef, 
        where('email', '==', email),
        where('companyId', '==', companyId),
        where('isActive', '==', true)
      )
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        throw new Error('ไม่พบผู้ใช้งานในระบบ')
      }
      
      const userData = snapshot.docs[0].data()
      
      // Check password (in production, this should be hashed)
      if (userData.password !== password) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      }
      
      // For now, we'll use a mock authentication
      // In production, use Firebase Auth properly
      setUser({ uid: snapshot.docs[0].id, email } as any)
      setAdminUser({
        id: snapshot.docs[0].id,
        ...userData
      } as AdminUser)
      
      // Update last login
      await updateDoc(doc(db, 'users', snapshot.docs[0].id), {
        lastLogin: new Date()
      })
      
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setAdminUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    adminUser,
    loading,
    signIn,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Simple auth check for server components
import { cookies } from 'next/headers'
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore'

export async function getServerAuth() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth-token')
  
  if (!authToken) {
    return { user: null, adminUser: null }
  }
  
  // In production, verify JWT token
  // For now, return mock data
  return {
    user: null,
    adminUser: null
  }
}