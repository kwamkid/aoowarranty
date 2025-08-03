// lib/tenant.ts - Multi-tenant utilities with Super Admin
import { db } from './firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore'
import { getSubdomain } from './utils'
import type { Company, Brand, Product, Warranty, AdminUser } from '@/types'

export interface TenantContext {
  companyId: string
  companySlug: string
  companyInfo: Company | null
}

export interface UserRole {
  isSuperAdmin: boolean
  companyId?: string
  role?: 'admin' | 'manager' | 'viewer'
}

// ดึง company context จาก subdomain
export async function getTenantContext(host: string): Promise<TenantContext | null> {
  const subdomain = getSubdomain(host)
  
  if (!subdomain) {
    return null // Main site
  }
  
  try {
    // Query company by slug
    const companiesRef = collection(db, 'companies')
    const q = query(companiesRef, where('slug', '==', subdomain), where('isActive', '==', true))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null // Company not found
    }
    
    const companyDoc = snapshot.docs[0]
    const companyInfo = { id: companyDoc.id, ...companyDoc.data() } as Company
    
    return {
      companyId: companyDoc.id,
      companySlug: subdomain,
      companyInfo
    }
  } catch (error) {
    console.error('Error getting tenant context:', error)
    return null
  }
}

// เช็คสิทธิ์ Super Admin
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const superAdminsRef = collection(db, 'superAdmins')
    const docRef = doc(superAdminsRef, userId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() && docSnap.data()?.isActive === true
  } catch {
    return false
  }
}

// เช็คสิทธิ์ Company Admin
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // เช็ค Super Admin ก่อน
    const isSuper = await isSuperAdmin(userId)
    if (isSuper) {
      return { isSuperAdmin: true }
    }
    
    // เช็ค Company Admin
    const usersRef = collection(db, 'users')
    const userDocRef = doc(usersRef, userId)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        isSuperAdmin: false,
        companyId: userData.companyId,
        role: userData.role
      }
    }
    
    return { isSuperAdmin: false }
  } catch {
    return { isSuperAdmin: false }
  }
}

// Firebase Security Rules - Updated with Super Admin
export const firestoreSecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Super Admins collection - only super admins can access
    match /superAdmins/{userId} {
      allow read, write: if isSuperAdmin();
    }
    
    // Companies collection
    match /companies/{companyId} {
      allow read: if true; // Public read for subdomain lookup
      allow write: if isSuperAdmin(); // Only super admin can create/modify companies
      allow delete: if isSuperAdmin(); // Only super admin can delete companies
    }
    
    // Brands collection - company admins only, super admin can see all
    match /brands/{brandId} {
      allow read, write: if isSuperAdmin() 
                          || isCompanyAdmin(resource.data.companyId);
      allow delete: if isSuperAdmin() 
                     || isCompanyAdminRole(resource.data.companyId, 'admin');
    }
    
    // Products collection - company admins only, super admin can see all
    match /products/{productId} {
      allow read, write: if isSuperAdmin() 
                          || isCompanyAdmin(resource.data.companyId);
      allow delete: if isSuperAdmin() 
                     || isCompanyAdminRole(resource.data.companyId, 'admin');
    }
    
    // Warranties collection - isolated by company, super admin can see all
    match /warranties/{warrantyId} {
      allow read: if isSuperAdmin() 
                   || isCustomerOwner(resource.data.companyId, resource.data.customerId) 
                   || isCompanyAdmin(resource.data.companyId);
      allow write: if isSuperAdmin()
                    || isCustomerOwner(resource.data.companyId, resource.data.customerId)
                    || isCompanyAdmin(resource.data.companyId);
      allow delete: if isSuperAdmin() 
                     || isCompanyAdminRole(resource.data.companyId, 'admin');
    }
    
    // Users collection - company admins can only see their company, super admin sees all
    match /users/{userId} {
      allow read: if isSuperAdmin() 
                   || (isAuthenticated() && isCompanyAdmin(resource.data.companyId));
      allow write: if isSuperAdmin() 
                    || isCompanyAdminRole(resource.data.companyId, 'admin');
      allow delete: if isSuperAdmin(); // Only super admin can delete users
    }
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/superAdmins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/superAdmins/$(request.auth.uid)).data.isActive == true;
    }
    
    function isCompanyAdmin(companyId) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    function isCompanyAdminRole(companyId, requiredRole) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == requiredRole;
    }
    
    function isCustomerOwner(companyId, customerId) {
      return isAuthenticated() && 
             request.auth.token.line_user_id == customerId;
    }
  }
}
`

// Service classes with Super Admin support
export class WarrantyService {
  
  // ดึงประวัติประกันของลูกค้าใน company นี้เท่านั้น
  static async getCustomerWarranties(companyId: string, customerId: string): Promise<Warranty[]> {
    const warrantiesRef = collection(db, 'warranties')
    const q = query(
      warrantiesRef,
      where('companyId', '==', companyId), // 🔒 ISOLATED by company
      where('customerId', '==', customerId),
      orderBy('registrationDate', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warranty))
  }
  
  // ดึงข้อมูลการลงทะเบียนทั้งหมดของ company (สำหรับ admin)
  static async getCompanyWarranties(companyId: string, filters?: any): Promise<Warranty[]> {
    const warrantiesRef = collection(db, 'warranties')
    let q = query(
      warrantiesRef,
      where('companyId', '==', companyId), // 🔒 ISOLATED by company
      orderBy('registrationDate', 'desc')
    )
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warranty))
  }
  
  // Super Admin - ดูข้อมูลทุก company
  static async getAllWarranties(filters?: any): Promise<Warranty[]> {
    const warrantiesRef = collection(db, 'warranties')
    let q = query(warrantiesRef, orderBy('registrationDate', 'desc'))
    
    if (filters?.companyId) {
      q = query(q, where('companyId', '==', filters.companyId))
    }
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warranty))
  }
}

export class UserService {
  
  // ดึงผู้ใช้ของ company นี้เท่านั้น
  static async getCompanyUsers(companyId: string): Promise<AdminUser[]> {
    const usersRef = collection(db, 'users')
    const q = query(
      usersRef,
      where('companyId', '==', companyId), // 🔒 ISOLATED by company
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser))
  }
  
  // Super Admin - ดูผู้ใช้ทุก company
  static async getAllUsers(filters?: any): Promise<(AdminUser & { companyName?: string })[]> {
    const usersRef = collection(db, 'users')
    let q = query(usersRef, orderBy('createdAt', 'desc'))
    
    if (filters?.companyId) {
      q = query(q, where('companyId', '==', filters.companyId))
    }
    
    const snapshot = await getDocs(q)
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser))
    
    // เติมชื่อ company
    const companies = await this.getAllCompanies()
    const companyMap = new Map(companies.map(c => [c.id, c.name]))
    
    return users.map(user => ({
      ...user,
      companyName: companyMap.get(user.companyId) || 'Unknown'
    }))
  }
  
  // Super Admin - suspend/unsuspend company
  static async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<void> {
    const companyRef = doc(db, 'companies', companyId)
    await updateDoc(companyRef, { 
      isActive,
      suspendedAt: isActive ? null : new Date()
    })
  }
  
  // Super Admin - delete user
  static async deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId)
    await deleteDoc(userRef)
  }
  
  // Super Admin - get all companies
  static async getAllCompanies(): Promise<Company[]> {
    const companiesRef = collection(db, 'companies')
    const q = query(companiesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company))
  }
}