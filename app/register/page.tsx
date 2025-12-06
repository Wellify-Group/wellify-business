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
import CenteredLayout from '@/components/CenteredLayout'

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

  const segments = [1, 2, 3] as Step[]

  const isLastStep = step === 3

  return (
    <CenteredLayout>
      <div className="w-full max-w-xl">
        <Card
          className="
            w-full
            rounded-[32px]
            border border-border/70
            bg-gradient-to-b from-[#081021] via-[#050B13] to-[#030712]
            shadow-[0_24px_80px_rgba(0,0,0,0.85)]
            overflow-hidden
          "
        >
          <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
            {/* полоски – индикатор шагов */}
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {segments.map((s) => (
                  <div
                    key={s}
                    className={`
                      flex-1 h-1.5 rounded-full transition-colors
                      ${
                        step >= s
                          ? 'bg-primary'
                          : 'bg-white/5 dark:bg-white/7'
                      }
                    `}
                  />
                ))}
              </div>

              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className={step === 1 ? 'text-primary font-medium' : ''}>
                  Основные данные
                </span>
                <span className={step === 2 ? 'text-primary font-medium' : ''}>
                  E-mail
                </span>
                <span className={step === 3 ? 'text-primary font-medium' : ''}>
                  Телефон
                </span>
              </div>

              <p className="text-center text-[11px] text-muted-foreground/80">
                Шаг {step} из 3
              </p>
            </div>

            <div className="mt-4 space-y-1 text-center">
              <CardTitle className="text-[22px] sm:text-[24px] font-semibold tracking-tight">
                Создать аккаунт
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Заполните форму для регистрации директора
              </CardDescription>
            </div>

            <p className="mt-3 text-center text-xs sm:text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
              >
                Войти
              </Link>
            </p>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-6 sm:pb-7">
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="flex items-center justify-center gap-2 text-emerald-400">
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
                        <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                          Имя *
                        </label>
                        <input
                          type="text"
                          className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                          Фамилия *
                        </label>
                        <input
                          type="text"
                          className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Отчество
                      </label>
                      <input
                        type="text"
                        className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Дата рождения *
                      </label>
                      <input
                        type="date"
                        className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                          Пароль *
                        </label>
                        <input
                          type="password"
                          className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          placeholder="Минимум 6 символов"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                          Подтвердите пароль *
                        </label>
                        <input
                          type="password"
                          className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
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
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
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
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Телефон *
                      </label>
                      <input
                        type="tel"
                        className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+38 (0XX) XXX-XX-XX"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Название бизнеса
                      </label>
                      <input
                        type="text"
                        className="w-full h-10 rounded-xl border border-white/7 bg-black/20 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Кофейня на Сумской"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs sm:text-sm text-destructive">
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
                      setStep((prev) =>
                        prev > 1 ? ((prev - 1) as Step) : prev,
                      )
                    }
                    className="min-w-[96px] border-white/20 bg-transparent hover:bg-white/5"
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
      </div>
    </CenteredLayout>
  )
}
