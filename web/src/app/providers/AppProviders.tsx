import type { ReactNode } from 'react'
import { PermissionsProvider } from '@/app/providers/PermissionsProvider'
import { StaffAuthProvider } from '@/app/providers/StaffAuthProvider'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StaffAuthProvider>
      <PermissionsProvider>
        <ToastProvider>{children}</ToastProvider>
      </PermissionsProvider>
    </StaffAuthProvider>
  )
}
