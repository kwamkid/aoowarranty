// scripts/create-test-data.ts
// Run with: npx ts-node scripts/create-test-data.ts

import { adminDb } from '../lib/firebase-admin'
import { generateId, generatePassword } from '../lib/utils'

async function createTestData() {
  console.log('🚀 Creating test data...')
  
  try {
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
        logo: '/test-logos/abc-shop.png',
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
        logo: '/test-logos/xyz-store.png',
        isActive: true,
        createdAt: new Date(),
        createdBy: 'system',
        totalUsers: 0,
        totalWarranties: 0
      }
    ]
    
    // Create companies
    for (const company of companies) {
      await adminDb.collection('companies').doc(company.id).set(company)
      console.log(`✅ Created company: ${company.name} (${company.slug})`)
      
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
          createdBy: 'system'
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
          createdBy: 'system'
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
          createdBy: 'system'
        }
      ]
      
      for (const user of users) {
        await adminDb.collection('users').doc(user.id).set(user)
        console.log(`  👤 Created ${user.role}: ${user.email}`)
      }
      
      // Create sample brands
      const brands = [
        {
          id: generateId(),
          companyId: company.id,
          name: 'Samsung',
          description: 'เครื่องใช้ไฟฟ้าและอิเล็กทรอนิกส์',
          logo: '/test-logos/samsung.png',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: generateId(),
          companyId: company.id,
          name: 'Apple',
          description: 'สมาร์ทโฟนและแท็บเล็ต',
          logo: '/test-logos/apple.png',
          isActive: true,
          createdAt: new Date()
        }
      ]
      
      for (const brand of brands) {
        await adminDb.collection('brands').doc(brand.id).set(brand)
        console.log(`  🏷️  Created brand: ${brand.name}`)
      }
    }
    
    // Create Super Admin
    const superAdmin = {
      id: generateId(),
      email: 'admin@warrantyhub.com',
      name: 'Super Administrator',
      isActive: true,
      permissions: ['all'],
      createdAt: new Date()
    }
    
    await adminDb.collection('superAdmins').doc(superAdmin.id).set(superAdmin)
    console.log(`\n👑 Created Super Admin: ${superAdmin.email}`)
    
    console.log('\n✅ Test data created successfully!')
    console.log('\n📝 Test Accounts:')
    console.log('================')
    console.log('Super Admin: admin@warrantyhub.com / Test1234!')
    console.log('\nABC Shop:')
    console.log('- Owner: admin@abcshop.com / Test1234!')
    console.log('- Manager: manager@abc-shop.com / Test1234!')
    console.log('- Viewer: viewer@abc-shop.com / Test1234!')
    console.log('\nXYZ Store:')
    console.log('- Owner: admin@xyzstore.com / Test1234!')
    console.log('- Manager: manager@xyz-store.com / Test1234!')
    console.log('- Viewer: viewer@xyz-store.com / Test1234!')
    
  } catch (error) {
    console.error('❌ Error creating test data:', error)
  }
}

// Run the script
createTestData()