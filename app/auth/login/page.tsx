'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import CenteredLayout from '@/components/CenteredLayout'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      if (!email || !password) {
        setError('Заполните email и пароль')
        setIsLoading(false)
        return
      }

      const result = await api.signIn(email, password)

      if (!result.user) {
        setError('Неверный email или пароль')
        setIsLoading(false)
        return
      }

      // Save token if provided
      if (result.token) {
        const { tokenStorage } = await import('@/lib/api/client')
        tokenStorage.set(result.token)
      }

      // Redirect to dashboard based on role
      const role = (result.user as any).role || 'director'
      if (role === 'director') {
        router.push('/dashboard/director')
      } else if (role === 'manager') {
        router.push('/dashboard/manager')
      } else {
        router.push('/dashboard/employee')
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при входе')
      setIsLoading(false)
    }
  }

  return (
    <CenteredLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Вход в систему</CardTitle>
          <CardDescription className="text-center">
            Войдите в свой аккаунт для доступа к дашборду
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Пароль <span className="text-destructive">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </CenteredLayout>
  )
}
