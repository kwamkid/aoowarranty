// lib/services/product.ts
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore'
import type { Brand, Product } from '@/types'

export class ProductService {
  
  // ดึงแบรนด์ของ company นี้เท่านั้น
  static async getCompanyBrands(companyId: string): Promise<Brand[]> {
    const brandsRef = collection(db, 'brands')
    const q = query(
      brandsRef,
      where('companyId', '==', companyId), // 🔒 ISOLATED by company
      where('isActive', '==', true),
      orderBy('name')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand))
  }
  
  // ดึงสินค้าของแบรนด์และ company นี้เท่านั้น
  static async getBrandProducts(companyId: string, brandId: string): Promise<Product[]> {
    const productsRef = collection(db, 'products')
    const q = query(
      productsRef,
      where('companyId', '==', companyId), // 🔒 ISOLATED by company
      where('brandId', '==', brandId),
      where('isActive', '==', true),
      orderBy('name')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
  }
}