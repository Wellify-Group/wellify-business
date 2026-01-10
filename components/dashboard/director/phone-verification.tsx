'use client'

import { useState, useEffect } from 'react'
import { sendPhoneVerificationCode, verifyPhoneCode } from '@/app/dashboard/director/settings/phone-verification-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Phone } from 'lucide-react'
import { api } from '@/lib/api/client'

export function PhoneVerification() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [currentPhone, setCurrentPhone] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)

  // Загружаем статус верификации телефона
  useEffect(() => {
    const loadPhoneStatus = async () => {
      try {
        // Check if user is authenticated
        const userData = await api.getUser();
        
        if (!userData.user) {
          return;
        }

        // Load profile to get phone status
        const profileData = await api.getProfile();
        const profile = profileData.profile;

        if (profile) {
          setPhoneVerified(profile.phone_verified === true);
          setCurrentPhone(profile.phone || null);
          if (profile.phone) {
            setPhone(profile.phone);
          }
        }
      } catch (err) {
        console.error('Error loading phone status:', err);
      }
    }

    loadPhoneStatus();
  }, [])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('phone', phone)

    const result = await sendPhoneVerificationCode(formData)

    setIsLoading(false)

    if (result.success) {
      setCodeSent(true)
      setSuccess('Код отправлен на указанный номер телефона')
    } else {
      setError(result.error || 'Ошибка при отправке кода')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('code', code)

    const result = await verifyPhoneCode(formData)

    setIsLoading(false)

    if (result.success) {
      setPhoneVerified(true)
      setSuccess('Телефон успешно подтвержден!')
      setCode('')
      setCodeSent(false)
      // Обновляем текущий телефон
      setCurrentPhone(phone)
    } else {
      setError(result.error || 'Ошибка при проверке кода')
    }
  }

  if (phoneVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Подтверждение телефона
          </CardTitle>
          <CardDescription>
            Статус верификации вашего номера телефона
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Телефон подтвержден</span>
          </div>
          {currentPhone && (
            <p className="mt-2 text-sm text-muted-foreground">
              Номер: {currentPhone}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Подтверждение телефона
        </CardTitle>
        <CardDescription>
          Подтвердите ваш номер телефона для полного доступа к функциям системы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codeSent ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                Номер телефона <span className="text-destructive">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full h-11 bg-card border border-border rounded-lg px-4 text-sm text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading || !phone.trim()}
            >
              Отправить код
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1.5">
                Код из SMS <span className="text-destructive">*</span>
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full h-11 bg-card border border-border rounded-lg px-4 text-center text-lg font-mono text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                placeholder="000000"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Введите 6-значный код, отправленный на {phone}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCodeSent(false)
                  setCode('')
                  setError(null)
                  setSuccess(null)
                }}
              >
                Изменить номер
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={isLoading || code.length !== 6}
              >
                Подтвердить
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

