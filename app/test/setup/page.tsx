// app/test/setup/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, Database, Users, Building2, Package } from 'lucide-react'

export default function TestSetupPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [testData, setTestData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Check existing test data
  useEffect(() => {
    checkTestData()
  }, [])

  const checkTestData = async () => {
    try {
      const response = await fetch('/api/test/create-data')
      const data = await response.json()
      setTestData(data.data)
    } catch (error) {
      console.error('Error checking test data:', error)
    } finally {
      setChecking(false)
    }
  }

  const createTestData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/test/create-data', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        // Recheck data
        await checkTestData()
      } else {
        setError(data.message || 'Failed to create test data')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-secondary-600">Checking existing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-900 mb-8">
          🧪 Test Data Setup
        </h1>

        {/* Current Status */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Database Status</h2>
          
          {testData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">Companies</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{testData.companiesCount}</p>
              </div>
              
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Users</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{testData.usersCount}</p>
              </div>
              
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Brands</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{testData.brandsCount}</p>
              </div>
              
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Super Admin</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">
                  {testData.hasSuperAdmin ? '✓' : '✗'}
                </p>
              </div>
            </div>
          )}
          
          {testData?.companies?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Existing Companies:</h3>
              <div className="space-y-2">
                {testData.companies.map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between bg-secondary-50 p-3 rounded">
                    <span className="font-medium">{company.name}</span>
                    <code className="text-sm bg-secondary-200 px-2 py-1 rounded">
                      {company.slug}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Create Test Data</h2>
          <p className="text-secondary-600 mb-4">
            This will create 2 test companies with users and sample brands.
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={createTestData}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating test data...</span>
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                <span>Create Test Data</span>
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-green-700">Success!</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Test Accounts Created:</h3>
                
                {/* Super Admin */}
                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">👑 Super Admin</h4>
                  <code className="text-sm">
                    Email: {result.testAccounts.superAdmin.email}<br />
                    Password: {result.testAccounts.superAdmin.password}
                  </code>
                </div>
                
                {/* ABC Shop */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">🏪 ABC Baby Shop</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Owner:</span>{' '}
                      <code>{result.testAccounts.abcShop.owner.email} / {result.testAccounts.abcShop.owner.password}</code>
                    </div>
                    <div>
                      <span className="font-medium">Manager:</span>{' '}
                      <code>{result.testAccounts.abcShop.manager.email} / {result.testAccounts.abcShop.manager.password}</code>
                    </div>
                    <div>
                      <span className="font-medium">Viewer:</span>{' '}
                      <code>{result.testAccounts.abcShop.viewer.email} / {result.testAccounts.abcShop.viewer.password}</code>
                    </div>
                  </div>
                </div>
                
                {/* XYZ Store */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🏬 XYZ Electronics Store</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Owner:</span>{' '}
                      <code>{result.testAccounts.xyzStore.owner.email} / {result.testAccounts.xyzStore.owner.password}</code>
                    </div>
                    <div>
                      <span className="font-medium">Manager:</span>{' '}
                      <code>{result.testAccounts.xyzStore.manager.email} / {result.testAccounts.xyzStore.manager.password}</code>
                    </div>
                    <div>
                      <span className="font-medium">Viewer:</span>{' '}
                      <code>{result.testAccounts.xyzStore.viewer.email} / {result.testAccounts.xyzStore.viewer.password}</code>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Test URLs:</h3>
                <div className="space-y-2">
                  <a 
                    href="http://localhost:3000/abc-shop" 
                    target="_blank"
                    className="block text-primary-600 hover:text-primary-700"
                  >
                    → http://localhost:3000/abc-shop
                  </a>
                  <a 
                    href="http://localhost:3000/xyz-store" 
                    target="_blank"
                    className="block text-primary-600 hover:text-primary-700"
                  >
                    → http://localhost:3000/xyz-store
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}