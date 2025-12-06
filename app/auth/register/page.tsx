'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import CenteredLayout from '@/components/CenteredLayout'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { createDirectorProfile } from './actions'

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

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)

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

  useEffect(() => {
    setFormError(null)
  }, [step])

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setFormError(null)
    }

  const validateStep1 = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('Укажите имя и фамилию')
      return false
    }
    if (!form.birth_date) {
      setFormError('Укажите дату рождения')
      return false
    }
    if (!form.password || form.password.length < 8) {
      setFormError('Пароль должен содержать минимум 8 символов')
      return false
    }
    if (form.password !== form.confirm_password) {
      setFormError('Пароли не совпадают')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      setFormError('Укажите e-mail')
      return false
    }
    if (!emailRegex.test(form.email)) {
      setFormError('Введите корректный e-mail')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!form.phone.trim()) {
      setFormError('Укажите телефон')
      return false
    }
    return true
  }

  const handleStep1Next = () => {
    setFormError(null)
    if (!validateStep1()) return
    setStep(2)
  }

  const handleStep2Submit = async () => {
    setFormError(null)
    if (!validateStep2()) return

    setIsLoading(true)
    setFormError(null)

    try {
      const supabase = createBrowserSupabaseClient()

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
            middle_name: form.middle_name || null,
            birth_date: form.birth_date,
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setFormError('Аккаунт с таким e-mail уже существует. Попробуйте войти.')
        } else {
          setFormError('Не удалось отправить письмо. Попробуйте ещё раз.')
        }
        setIsLoading(false)
        return
      }

      setEmailSent(true)
      setEmailConfirmed(false)
    } catch (err: any) {
      setFormError('Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailConfirmed = async () => {
    setFormError(null)
    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        setFormError('Не найдена активная сессия. Обновите страницу.')
        setIsLoading(false)
        return
      }

      if (!user.email_confirmed_at || user.email !== form.email.trim().toLowerCase()) {
        setFormError('Мы не видим подтверждённый e-mail. Убедитесь, что вы перешли по ссылке в письме и попробуйте ещё раз.')
        setIsLoading(false)
        return
      }

      setEmailConfirmed(true)
      setFormError(null)
      setStep(3)
    } catch (err: any) {
      setFormError('Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Submit = async () => {
    setFormError(null)
    if (!validateStep3()) return

    setIsLoading(true)
    setFormError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setFormError('Не найдена активная сессия. Обновите страницу и убедитесь, что e-mail подтверждён.')
        setIsLoading(false)
        return
      }

      if (!user.email_confirmed_at) {
        setFormError('E-mail не подтверждён. Вернитесь на шаг 2 и подтвердите e-mail.')
        setIsLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('auth_user_id', user.id)
      formData.append('email', user.email || form.email)
      formData.append('first_name', form.first_name)
      formData.append('last_name', form.last_name)
      formData.append('middle_name', form.middle_name || '')
      formData.append('birth_date', form.birth_date)
      formData.append('phone', form.phone)

      const result = await createDirectorProfile(formData)

      if (result.error) {
        setFormError(result.error)
        setIsLoading(false)
        return
      }

      router.push('/dashboard/director')
    } catch (err: any) {
      setFormError('Произошла ошибка при завершении регистрации')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      handleStep1Next()
      return
    }

    if (step === 2) {
      await handleStep2Submit()
      return
    }

    if (step === 3) {
      await handleStep3Submit()
      return
    }
  }

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
      </div>
    )
  }

  const renderError = () => (
    <div className="min-h-[24px] mb-2">
      {formError && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/10 border border-red-900/40 rounded-xl px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}
    </div>
  )

  const renderEmailSuccess = () => {
    if (step === 2 && emailSent) {
      return (
        <div className="mt-2 mb-4 rounded-xl border border-emerald-900/40 bg-emerald-900/15 px-3 py-2 text-xs text-emerald-300">
          <p className="mb-2">
            Письмо отправлено на <strong>{form.email}</strong>. Перейдите по ссылке в письме, чтобы подтвердить e-mail. После подтверждения вернитесь к этой странице и нажмите кнопку «Я подтвердил e-mail».
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2 rounded-xl border-emerald-700 bg-emerald-900/20 text-emerald-300 hover:bg-emerald-900/30"
            onClick={handleEmailConfirmed}
            disabled={isLoading}
          >
            {isLoading ? 'Проверка...' : 'Я подтвердил e-mail'}
          </Button>
          {emailConfirmed && (
            <div className="mt-2 flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">E-mail подтверждён</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

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
                placeholder="Минимум 8 символов"
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
              disabled={emailSent}
            />
          </div>
          {renderEmailSuccess()}
          {!emailSent && (
            <p className="text-xs text-slate-500">
              На этом шаге мы отправим письмо с подтверждением на указанный
              адрес. После подтверждения вы сможете завершить регистрацию.
            </p>
          )}
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
    <CenteredLayout>
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
                  setFormError(null)
                  if (step > 1) setStep(prev => (prev - 1) as Step)
                  else router.push('/auth/login')
                }}
              >
                Назад
              </Button>

              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={isLoading || (step === 2 && emailSent && !emailConfirmed)}
              >
                {isLoading
                  ? 'Обработка...'
                  : step === 3
                  ? 'Завершить регистрацию'
                  : step === 2 && emailSent
                  ? 'Ожидание подтверждения...'
                  : 'Дальше'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CenteredLayout>
  )
}
