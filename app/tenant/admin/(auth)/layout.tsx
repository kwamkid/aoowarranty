// app/tenant/admin/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page doesn't need AdminLayout wrapper
  return <>{children}</>
}