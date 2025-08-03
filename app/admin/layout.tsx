import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - WarrantyHub',
  description: 'ระบบจัดการแดมิน WarrantyHub',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}