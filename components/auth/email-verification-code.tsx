'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface EmailVerificationCodeProps {
  email: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function EmailVerificationCode({ email, onSuccess, onCancel }: EmailVerificationCodeProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Только одна цифра
    if (!/^\d*$/.test(value)) return; // Только цифры

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Автоматический переход на следующее поле
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError(null);
      // Фокус на последнее поле
      document.getElementById('code-5')?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Введите полный код из 6 цифр');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: codeString,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.error || 'Неверный код. Попробуйте еще раз.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (error: any) {
      setError('Ошибка при проверке кода. Попробуйте еще раз.');
      console.error('Verify code error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setError(null);
        // Можно показать сообщение об успешной отправке
        alert('Код отправлен на вашу почту');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      } else {
        setError(data.error || 'Не удалось отправить код. Попробуйте еще раз.');
      }
    } catch (error: any) {
      setError('Ошибка при отправке кода. Попробуйте еще раз.');
      console.error('Resend code error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl font-semibold">
          Подтверждение email
        </CardTitle>
        <CardDescription className="mt-2 text-center text-sm">
          Мы отправили код подтверждения на <br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-center text-sm text-emerald-400">
              Email успешно подтвержден!
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-14 w-12 rounded-lg border border-border bg-card text-center text-2xl font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleVerify}
                disabled={isLoading || code.join('').length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Подтвердить'
                )}
              </Button>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {isResending ? 'Отправка...' : 'Отправить код повторно'}
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="hover:text-foreground transition-colors"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

