'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { registerDirector } from '@/app/auth/register/actions'

type Step = 1 | 2 | 3

export default function RegisterDirectorPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // шаг 1
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // шаг 2
  const [email, setEmail] = useState('')

  // шаг 3
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Укажите имя и фамилию')
      return false
    }
    if (!birthDate) {
      setError('Укажите дату рождения')
      return false
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return false
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!email.trim()) {
      setError('Укажите e-mail')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!phone.trim()) {
      setError('Укажите телефон')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)

    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return

    if (step < 3) setStep((prev) => (prev + 1) as Step)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateStep3()) return

    setIsLoading(true)

    try {
      const formData = new FormData()

      const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`
        .replace(/\s+/g, ' ')
        .trim()

      formData.append('full_name', fullName)
      formData.append('birth_date', birthDate)
      formData.append('email', email.trim())
      formData.append('password', password)
      formData.append('phone', phone.trim())
      formData.append('business_name', businessName.trim())

      const result = await registerDirector(formData)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setError(result.error || 'Произошла ошибка при регистрации')
      }
    } catch (err) {
      console.error(err)
      setError('Не удалось завершить регистрацию. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const stepsMeta = [
    { id: 1 as Step, label: 'Основные данные' },
    { id: 2 as Step, label: 'E-mail' },
    { id: 3 as Step, label: 'Телефон' },
  ]

  const isLastStep = step === 3

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-background">
      <Card className="w-full max-w-xl shadow-xl border-border/60">
        <CardHeader className="space-y-5 pb-4">
          {/* Индикатор шагов */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              {stepsMeta.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-1 min-w-[70px]"
                >
                  <div
                    className={`h-6 w-6 rounded-full border text-[11px] flex items-center justify-center
                    ${
                      step === s.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : step > s.id
                        ? 'bg-primary/10 text-primary border-primary/60'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {s.id}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 text-[11px] text-muted-foreground">
              {stepsMeta.map((s) => (
                <span
                  key={s.id}
                  className={`min-w-[70px] text-center ${
                    step === s.id ? 'text-primary font-medium' : ''
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Шаг {step} из 3
            </p>
          </div>

          <div className="space-y-1 text-center">
            <CardTitle className="text-xl sm:text-2xl">
              Создать аккаунт
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Заполните форму для регистрации директора
            </CardDescription>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Войти
            </Link>
          </p>
        </CardHeader>

        <CardContent className="pb-6">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Регистрация завершена. Проверьте почту для подтверждения
                  e-mail.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                После подтверждения мы перенаправим вас к входу.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ШАГ 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">
                        Имя *
                      </label>
                      <input
                        type="text"
                        className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      Отчество
                    </label>
                    <input
                      type="text"
                      className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      Дата рождения *
                    </label>
                    <input
                      type="date"
                      className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">
                        Пароль *
                      </label>
                      <input
                        type="password"
                        className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        placeholder="Минимум 6 символов"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5">
                        Подтвердите пароль *
                      </label>
                      <input
                        type="password"
                        className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ШАГ 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}

              {/* ШАГ 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+38 (0XX) XXX-XX-XX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      Название бизнеса
                    </label>
                    <input
                      type="text"
                      className="w-full h-10 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Кофейня на Сумской"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs sm:text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 1 || isLoading}
                  onClick={() =>
                    setStep((prev) => (prev > 1 ? (prev - 1) as Step : prev))
                  }
                  className="min-w-[100px]"
                >
                  Назад
                </Button>

                {isLastStep ? (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Завершить регистрацию
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Дальше
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
