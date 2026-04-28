import { useCallback, useEffect, useState } from 'react'
import { mergeDemoUsersAndCustom, NT_USERS_CUSTOM_KEY, type ManagedUser } from '@/features/users/usersModel'
import { loadUsersFromFirestore, persistUsersCollection } from '@/features/users/persistUsers'

export function useStaffUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fs = await loadUsersFromFirestore()
      if (fs.length > 0) {
        setUsers(fs)
      } else {
        setUsers(mergeDemoUsersAndCustom())
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar usuários.'
      setError(msg)
      setUsers(mergeDemoUsersAndCustom())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const persistAll = useCallback(async (next: ManagedUser[]) => {
    const custom = next.filter((u) => !u.isDemo)
    localStorage.setItem(NT_USERS_CUSTOM_KEY, JSON.stringify(custom))
    setUsers(next)
    await persistUsersCollection(next)
  }, [])

  return { users, loading, error, reload, persistAll }
}
