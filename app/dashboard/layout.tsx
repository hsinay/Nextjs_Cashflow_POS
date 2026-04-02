import { Toaster } from '@/components/ui/toast'
import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      {children}
      <Toaster toasts={[]} />
    </>
  )
}
