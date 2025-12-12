'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FrotasRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dispositivos')
  }, [router])

  return null
}
