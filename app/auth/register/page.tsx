'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerDirector } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function RegisterDirectorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await registerDirector(formData)

    setIsLoading(false)

    if (result.success) {
      setSuccess(true)
      setSuccessMessage(result.message || 'Регистрация успешна!')
      // Через 3 секунды можно перенаправить на страницу логина
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } else {
      setError(result.error || 'Произошла ошибка при регистрации')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-background, #050B13)' }}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Регистрация директора</CardTitle>
          <CardDescription className="text-center">
            Создайте аккаунт директора для управления бизнесом
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Перенаправление на страницу входа...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1.5">
                  ФИО <span className="text-destructive">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  placeholder="Иванов Иван Иванович"
                />
              </div>

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
                  minLength={8}
                  className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  placeholder="Минимум 8 символов"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Минимум 8 символов
                </p>
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium mb-1.5">
                  Подтвердите пароль <span className="text-destructive">*</span>
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  placeholder="Повторите пароль"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                  Телефон
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label htmlFor="business_name" className="block text-sm font-medium mb-1.5">
                  Название бизнеса
                </label>
                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  placeholder="ООО &quot;Мой бизнес&quot;"
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
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Войти
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

