'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Step = 1 | 2 | 3

interface FormState {
  first_name: string
  last_name: string
  middle_name: string
  birth_date: string
  password: string
  confirm_password: string
  email: string
  phone: string
}

export default function RegisterDirectorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailInfo, setEmailInfo] = useState<string | null>(null)
  const [emailConfirmed, setEmailConfirmed] = useState(
    searchParams.get('emailConfirmed') === '1'
  )

  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    middle_name: '',
    birth_date: '',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
  })

  // ---------- helpers ----------

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setError(null)
    }

  const validateStep1 = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Укажите имя и фамилию')
      return false
    }
    if (!form.birth_date) {
      setError('Укажите дату рождения')
      return false
    }
    if (!form.password || form.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return false
    }
    if (form.password !== form.confirm_password) {
      setError('Пароли не совпадают')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!form.email.trim()) {
      setError('Укажите e-mail')
      return false
    }
    // очень простая проверка, без фанатизма
    if (!form.email.includes('@')) {
      setError('Введите корректный e-mail')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!form.phone.trim()) {
      setError('Укажите телефон')
      return false
    }
    return true
  }

  const handleStep1Next = () => {
    setError(null)
    if (!validateStep1()) return
    setStep(2)
  }

  const handleStep2Next = () => {
    setError(null)
    setEmailInfo(null)
    if (!validateStep2()) return

    // здесь пока только показываем уведомление,
    // вызов signUp / отправку письма настроим отдельным шагом
    setEmailInfo(
      'Мы отправили письмо с подтверждением на указанную почту. Перейдите по ссылке из письма, чтобы подтвердить e-mail.'
    )
    setStep(3)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 1) {
      handleStep1Next()
      return
    }

    if (step === 2) {
      handleStep2Next()
      return
    }

    // step === 3
    if (!validateStep3()) return

    try {
      setIsLoading(true)

      // TODO: сюда подвязываем registerDirector или прямой вызов supabase.auth.signUp.
      // Сейчас просто заглушка перехода на дашборд:
      // const result = await registerDirector(...);
      // if (!result.success) throw new Error(result.error || 'Ошибка регистрации')

      // имитация успешной регистрации
      await new Promise(res => setTimeout(res, 800))

      router.push('/dashboard/director')
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при регистрации')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------- UI ----------

  const renderStepIndicator = () => {
    const items = [
      { id: 1, label: 'Основные данные' },
      { id: 2, label: 'E-mail' },
      { id: 3, label: 'Телефон' },
    ] as const

    return (
      <div className="mb-8">
        <div className="flex gap-4 mb-2">
          {items.map(item => (
            <div key={item.id} className="flex-1">
              <div
                className={[
                  'h-1.5 rounded-full transition-colors',
                  step >= item.id ? 'bg-primary' : 'bg-slate-800',
                ].join(' ')}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          {items.map(item => (
            <div
              key={item.id}
              className="flex-1 text-center whitespace-nowrap"
            >
              {item.label}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-center text-slate-500">
          Шаг {step} из 3
        </div>
      </div>
    )
  }

  const renderError = () => (
    <div className="min-h-[24px] mb-2">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/10 border border-red-900/40 rounded-xl px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )

  const renderEmailInfo = () =>
    step >= 2 && (emailInfo || emailConfirmed) ? (
      <div className="mt-2 mb-4 rounded-xl border border-emerald-900/40 bg-emerald-900/15 px-3 py-2 text-xs text-emerald-300">
        {emailConfirmed
          ? 'E-mail подтверждён. Можете перейти к следующему шагу.'
          : emailInfo}
      </div>
    ) : null

  const renderStepFields = () => {
    if (step === 1) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Имя *
              </label>
              <input
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
                value={form.first_name}
                onChange={handleChange('first_name')}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Фамилия *
              </label>
              <input
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
                value={form.last_name}
                onChange={handleChange('last_name')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Отчество
            </label>
            <input
              className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
              value={form.middle_name}
              onChange={handleChange('middle_name')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Дата рождения *
              </label>
              <input
                type="date"
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60 [color-scheme:dark]"
                value={form.birth_date}
                onChange={handleChange('birth_date')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Пароль *
              </label>
              <input
                type="password"
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Минимум 6 символов"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Подтвердите пароль *
              </label>
              <input
                type="password"
                className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
                value={form.confirm_password}
                onChange={handleChange('confirm_password')}
              />
            </div>
          </div>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
            />
          </div>
          {renderEmailInfo()}
          <p className="text-xs text-slate-500">
            На этом шаге мы отправим письмо с подтверждением на указанный
            адрес. После подтверждения вы сможете завершить регистрацию.
          </p>
        </>
      )
    }

    // step 3
    return (
      <>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Телефон *
          </label>
          <input
            type="tel"
            className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+38 (0XX) XXX-XX-XX"
          />
        </div>
        <p className="text-xs text-slate-500">
          В дальнейшем этот номер будет использоваться для входа в систему,
          уведомлений и восстановления доступа.
        </p>
      </>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#050B13]">
      <Card className="w-full max-w-xl bg-slate-950/80 border border-slate-800/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] rounded-3xl backdrop-blur-xl">
        <CardHeader className="pt-7 pb-4">
          {renderStepIndicator()}
          <CardTitle className="text-2xl text-center mb-1">
            Создать аккаунт
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Заполните форму для регистрации директора
          </CardDescription>
          <div className="mt-2 text-center text-xs text-slate-500">
            Уже есть аккаунт?{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Войти
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pb-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {renderError()}
            {renderStepFields()}

            <div className="mt-6 flex gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-28 rounded-xl border-slate-700 bg-slate-900/60"
                onClick={() => {
                  setError(null)
                  if (step > 1) setStep((prev => (prev - 1) as Step))
                  else router.push('/auth/login')
                }}
              >
                Назад
              </Button>

              <Button
                type={step === 3 ? 'submit' : 'button'}
                className="flex-1 rounded-xl"
                onClick={step === 3 ? undefined : handleStep1Next}
                disabled={isLoading}
              >
                {isLoading
                  ? 'Регистрация...'
                  : step === 3
                  ? 'Завершить регистрацию'
                  : 'Дальше'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
