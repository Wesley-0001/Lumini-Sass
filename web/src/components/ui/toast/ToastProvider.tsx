import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import styles from '@/components/ui/ToastViewport.module.css'
import { ToastContext, type ToastItem, type ToastVariant } from '@/components/ui/toast/toastContext'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const pushToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `t-${++seq.current}`
    const toast: ToastItem = { id, message, variant }
    setItems((prev) => [...prev, toast])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.variant]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
