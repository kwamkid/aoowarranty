// app/api/test/create-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // ป้องกันไม่ให้ใช้ใน production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        message: 'This endpoint is disabled in production'
      }, { status: 403 })
    }

    console.log('🚀 Creating test data...')
    
    // Test Companies
    const companies = [
      {
        id: generateId(),
        name: 'ABC Baby Shop',
        slug: 'abc-shop',
        email: 'admin@abcshop.com',
        phone: '02-234-5678',
        address: '123 ถนนสุขุมวิท',
        district: 'คลองเตย',
        amphoe: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postcode: '10110',
        website: 'https://abcbabyshop.com',
        logo: '', // จะใส่ทีหลัง
        isActive: true,
        createdAt: new Date(),
        createdBy: 'system',
        totalUsers: 0,
        totalWarranties: 0
      },
      {
        id: generateId(),
        name: 'XYZ Electronics Store',
        slug: 'xyz-store',
        email: 'admin@xyzstore.com',
        phone: '02-345-6789',
        address: '456 ถนนพระราม 4',
        district: 'พระโขนง',
        amphoe: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postcode: '10260',
        website: 'https://xyzstore.com',
        logo: '', // จะใส่ทีหลัง
        isActive: true,
        createdAt: new Date(),
        createdBy: 'system',
        totalUsers: 0,
        totalWarranties: 0
      }
    ]
    
    const createdData: {
      companies: Array<{ id: string; name: string; slug: string }>;
      users: Array<{ email: string; role: string; companySlug: string }>;
      brands: Array<{ name: string; companySlug: string }>;
      superAdmin: { email: string } | null;
    } = {
      companies: [],
      users: [],
      brands: [],
      superAdmin: null
    }
    
    // Create companies
    for (const company of companies) {
      await adminDb.collection('companies').doc(company.id).set(company)
      createdData.companies.push({ id: company.id, name: company.name, slug: company.slug })
      
      // Create admin users for each company
      const users = [
        {
          id: generateId(),
          companyId: company.id,
          email: company.email,
          name: `Admin ${company.name}`,
          role: 'owner',
          password: 'Test1234!', // In production, this should be hashed
          isActive: true,
          createdAt: new Date(),
          createdBy: 'system',
          lastLogin: null
        },
        {
          id: generateId(),
          companyId: company.id,
          email: `manager@${company.slug}.com`,
          name: `Manager ${company.name}`,
          role: 'manager',
          password: 'Test1234!',
          isActive: true,
          createdAt: new Date(),
          createdBy: 'system',
          lastLogin: null
        },
        {
          id: generateId(),
          companyId: company.id,
          email: `viewer@${company.slug}.com`,
          name: `Viewer ${company.name}`,
          role: 'viewer',
          password: 'Test1234!',
          isActive: true,
          createdAt: new Date(),
          createdBy: 'system',
          lastLogin: null
        }
      ]
      
      for (const user of users) {
        await adminDb.collection('users').doc(user.id).set(user)
        createdData.users.push({ 
          email: user.email, 
          role: user.role, 
          companySlug: company.slug 
        })
      }
      
      // Create sample brands
      const brands = [
        {
          id: generateId(),
          companyId: company.id,
          name: 'Samsung',
          description: 'เครื่องใช้ไฟฟ้าและอิเล็กทรอนิกส์',
          logo: '',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: generateId(),
          companyId: company.id,
          name: 'Apple',
          description: 'สมาร์ทโฟนและแท็บเล็ต',
          logo: '',
          isActive: true,
          createdAt: new Date()
        }
      ]
      
      for (const brand of brands) {
        await adminDb.collection('brands').doc(brand.id).set(brand)
        createdData.brands.push({ 
          name: brand.name, 
          companySlug: company.slug 
        })
      }
    }
    
    // Create Super Admin
    const superAdmin = {
      id: generateId(),
      email: 'admin@warrantyhub.com',
      name: 'Super Administrator',
      isActive: true,
      permissions: ['all'],
      createdAt: new Date(),
      lastLogin: null
    }
    
    await adminDb.collection('superAdmins').doc(superAdmin.id).set(superAdmin)
    createdData.superAdmin = { email: superAdmin.email }
    
    return NextResponse.json({
      success: true,
      message: 'Test data created successfully!',
      data: createdData,
      testAccounts: {
        superAdmin: {
          email: 'admin@warrantyhub.com',
          password: 'Test1234!'
        },
        abcShop: {
          owner: { email: 'admin@abcshop.com', password: 'Test1234!' },
          manager: { email: 'manager@abc-shop.com', password: 'Test1234!' },
          viewer: { email: 'viewer@abc-shop.com', password: 'Test1234!' }
        },
        xyzStore: {
          owner: { email: 'admin@xyzstore.com', password: 'Test1234!' },
          manager: { email: 'manager@xyz-store.com', password: 'Test1234!' },
          viewer: { email: 'viewer@xyz-store.com', password: 'Test1234!' }
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error creating test data:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create test data',
      error: error.message
    }, { status: 500 })
  }
}

// GET method to check if test data exists
export async function GET() {
  try {
    const companies = await adminDb.collection('companies').limit(5).get()
    const users = await adminDb.collection('users').limit(5).get()
    const brands = await adminDb.collection('brands').limit(5).get()
    const superAdmins = await adminDb.collection('superAdmins').limit(1).get()
    
    return NextResponse.json({
      success: true,
      data: {
        companiesCount: companies.size,
        usersCount: users.size,
        brandsCount: brands.size,
        hasSuperAdmin: !superAdmins.empty,
        companies: companies.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          slug: doc.data().slug
        }))
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}