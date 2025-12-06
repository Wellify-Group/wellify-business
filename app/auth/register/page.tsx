'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerDirector } from './actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type Step = 1 | 2 | 3

interface FormState {
  full_name: string
  birth_date: string
  email: string
  password: string
  confirm_password: string
  phone: string
  business_name: string
}

export default function RegisterDirectorPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>({
    full_name: '',
    birth_date: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    business_name: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    setError(null)

    if (step === 1) {
      if (!form.full_name.trim()) {
        setError('Пожалуйста, укажите ФИО.')
        return
      }
      if (!form.birth_date) {
        setError('Пожалуйста, укажите дату рождения.')
        return
      }
      if (!form.password || form.password.length < 8) {
        setError('Пароль должен содержать минимум 8 символов.')
        return
      }
      if (form.password !== form.confirm_password) {
        setError('Пароли не совпадают.')
        return
      }
    }

    if (step === 2) {
      if (!form.email.trim()) {
        setError('Пожалуйста, укажите e-mail.')
        return
      }
    }

    setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev))
  }

  const handlePrevStep = () => {
    setError(null)
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      // Собираем FormData вручную – под те же поля, что ждёт registerDirector
      const formData = new FormData()
      formData.append('full_name', form.full_name)
      formData.append('birth_date', form.birth_date)
      formData.append('email', form.email)
      formData.append('password', form.password)
      formData.append('confirm_password', form.confirm_password)
      formData.append('phone', form.phone)
      formData.append('business_name', form.business_name)

      const result = await registerDirector(formData)

      setIsLoading(false)

      if (result.success) {
        setSuccess(true)
        setSuccessMessage(
          result.message ||
            'Регистрация успешна! Мы отправили письмо для подтверждения e-mail.',
        )

        // Здесь НИЧЕГО не перенаправляем – пользователь идёт по e-mail-флоу.
        // Если захочешь автопереход – можно включить редирект, например:
        // setTimeout(() => router.push('/auth/login'), 3000)
      } else {
        setError(result.error || 'Произошла ошибка при регистрации.')
      }
    } catch (err) {
      console.error(err)
      setIsLoading(false)
      setError('Не удалось завершить регистрацию. Попробуйте ещё раз.')
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--color-background, #050B13)' }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Регистрация директора
          </CardTitle>
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
                Проверьте вашу почту и перейдите по ссылке в письме, чтобы
                подтвердить e-mail и войти в систему.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Индикатор шагов */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-16 rounded-full transition-colors ${
                      s <= step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mb-2">
                Шаг {step} из 3
              </p>

              {/* ШАГ 1 – ФИО, дата рождения, пароль */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-medium mb-1.5"
                    >
                      ФИО <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder="Иванов Иван Иванович"
                      value={form.full_name}
                      onChange={(e) =>
                        updateField('full_name', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="birth_date"
                      className="block text-sm font-medium mb-1.5"
                    >
                      Дата рождения <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      required
                      className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      value={form.birth_date}
                      onChange={(e) =>
                        updateField('birth_date', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium mb-1.5"
                    >
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
                      value={form.password}
                      onChange={(e) =>
                        updateField('password', e.target.value)
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Минимум 8 символов
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm_password"
                      className="block text-sm font-medium mb-1.5"
                    >
                      Подтвердите пароль{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      required
                      minLength={8}
                      className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder="Повторите пароль"
                      value={form.confirm_password}
                      onChange={(e) =>
                        updateField('confirm_password', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* ШАГ 2 – E-mail */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1.5"
                    >
                      E-mail <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ШАГ 3 – Телефон + бизнес */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium mb-1.5"
                    >
                      Телефон
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder="+38 (0ХХ) ХХХ-ХХ-ХХ"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business_name"
                      className="block text-sm font-medium mb-1.5"
                    >
                      Название бизнеса
                    </label>
                    <input
                      id="business_name"
                      name="business_name"
                      type="text"
                      className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder='Например, "Хінкальня на Сумській"'
                      value={form.business_name}
                      onChange={(e) =>
                        updateField('business_name', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Кнопки управления шагами */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={step === 1 || isLoading}
                  className="w-28"
                >
                  Назад
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Далее
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Регистрация...' : 'Завершить регистрацию'}
                  </Button>
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
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
