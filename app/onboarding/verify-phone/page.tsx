"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/button';

export default function VerifyPhonePage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Загружаем профиль
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.phone) {
        setPhone(profile.phone);
      }

      // Проверяем email_confirmed_at и phone_verified
      const emailConfirmed = user.email_confirmed_at !== null;
      const phoneVerified = profile?.phone_verified === true;

      // Если всё уже подтверждено - редирект в основную панель
      if (emailConfirmed && phoneVerified) {
        router.push('/');
        return;
      }

      setIsChecking(false);
    };

    loadProfile();
  }, [router, supabase]);

  const handleSendCode = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }
    // Заглушка: просто показываем сообщение
    setSent(true);
  };

  const handleConfirm = async () => {
    setError(null);
    
    if (code !== '000000') {
      setError('Неверный код. Для теста введите 000000.');
      return;
    }

    if (!userId) {
      router.push('/login');
      return;
    }

    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          phone: phone.trim(),
          phone_verified: true 
        })
        .eq('id', userId);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Редирект в основную панель
      router.push('/');
    } catch (err) {
      console.error('Verification error:', err);
      setError('Произошла ошибка при подтверждении. Попробуйте еще раз.');
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background, #050B13)' }}>
        <div className="text-muted-foreground">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background, #050B13)', paddingTop: '80px' }}>
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full max-w-[500px] relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-8">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Подтверждение телефона
                </h1>
                <p className="text-sm text-muted-foreground">
                  Введите номер телефона и код подтверждения
                </p>
              </div>

              {/* Form */}
              <div className="flex flex-col gap-4">
                {!sent ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                        Телефон *
                      </label>
                      <input
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setError(null);
                        }}
                        required
                        className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      />
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="h-12 w-full"
                    >
                      <PrimaryButton
                        type="button"
                        onClick={handleSendCode}
                        className="w-full h-full rounded-[20px] text-[15px] font-semibold"
                      >
                        Отправить код
                      </PrimaryButton>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400 text-center">
                      <p>Мы отправили код <strong>000000</strong> на ваш телефон</p>
                      <p className="mt-1 text-muted-foreground">Для теста используйте код: 000000</p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                        Код подтверждения *
                      </label>
                      <input
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setError(null);
                        }}
                        required
                        className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      />
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="h-12 w-full"
                    >
                      <PrimaryButton
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="w-full h-full rounded-[20px] text-[15px] font-semibold"
                      >
                        {isLoading ? "Подтверждение..." : "Подтвердить"}
                      </PrimaryButton>
                    </motion.div>
                  </>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

