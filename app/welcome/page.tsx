'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { welcomeTranslations } from '@/lib/i18n/welcome';
import { useInterfaceLanguageStore } from '@/lib/store/interfaceLanguageStore';
import useStore from '@/lib/store';
import { PrimaryButton } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const t = welcomeTranslations;

export default function WelcomePage() {
  const { lang, setLang } = useInterfaceLanguageStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const { login, registerDirector } = useStore();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  // Register state
  const [registerCompanyName, setRegisterCompanyName] = useState('');
  const [registerOwnerName, setRegisterOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoadingLogin(true);

    try {
      // Пробуем войти как директор
      let success = await login('director', { email: loginEmail, pass: loginPassword });
      if (success) {
        router.push('/dashboard/director');
        return;
      }

      // Пробуем войти как менеджер
      success = await login('manager', { email: loginEmail, pass: loginPassword });
      if (success) {
        router.push('/dashboard/manager');
        return;
      }

      setLoginError(t.errorInvalidCredentials[lang]);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(t.errorLogin[lang]);
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    // Валидация
    if (!registerCompanyName.trim()) {
      setRegisterError(t.errorEnterCompanyName[lang]);
      return;
    }
    if (!registerOwnerName.trim()) {
      setRegisterError(t.errorEnterOwnerName[lang]);
      return;
    }
    if (!registerEmail.trim()) {
      setRegisterError(t.errorEnterEmail[lang]);
      return;
    }
    if (registerPassword.length < 6) {
      setRegisterError(t.errorPasswordMinLength[lang]);
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError(t.errorPasswordMismatch[lang]);
      return;
    }

    setIsLoadingRegister(true);

    try {
      const result = await registerDirector(registerEmail, registerPassword, registerOwnerName.trim());
      
      if (result.success) {
        router.push('/dashboard/director');
      } else {
        setRegisterError(result.error || t.errorRegistration[lang]);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(t.errorRegistration[lang]);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Верх: бренд + переключатель языка */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="text-lg font-semibold tracking-tight">
          {t.brand[lang]}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">
            {t.langLabel[lang]}
          </span>
          <div className="inline-flex rounded-full bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setLang('uk')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                lang === 'uk' ? 'bg-white text-black dark:text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              UA
            </button>
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                lang === 'ru' ? 'bg-white text-black dark:text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                lang === 'en' ? 'bg-white text-black dark:text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Контент: слева описание, справа auth-карта */}
      <main className="flex-1 flex flex-col lg:flex-row px-8 pb-10 gap-10">
        {/* Левая колонка */}
        <section className="flex-1 flex flex-col justify-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs mb-4">
              {t.heroBadge[lang]}
            </div>

            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-4">
              {t.heroTitle[lang]}
            </h1>

            <p className="text-sm lg:text-base text-white/70 mb-6">
              {t.heroSubtitle[lang]}
            </p>

            <ul className="space-y-2 text-sm text-white/80">
              <li>• {t.heroBullet1[lang]}</li>
              <li>• {t.heroBullet2[lang]}</li>
              <li>• {t.heroBullet3[lang]}</li>
            </ul>
          </motion.div>
        </section>

        {/* Правая колонка – auth-карта */}
        <section className="w-full max-w-md mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur"
          >
            {/* Tabs */}
            <div className="grid w-full grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError('');
                }}
                className={`relative flex items-center justify-center text-sm font-medium transition-all duration-200 h-9 rounded-lg ${
                  activeTab === 'login'
                    ? 'bg-white text-black dark:text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t.authTabLogin[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setRegisterError('');
                }}
                className={`relative flex items-center justify-center text-sm font-medium transition-all duration-200 h-9 rounded-lg ${
                  activeTab === 'register'
                    ? 'bg-white text-black dark:text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t.authTabRegister[lang]}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold mb-4">
                    {t.authTitleLogin[lang]}
                  </h2>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.fieldLogin[lang]}
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError('');
                      }}
                      required
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldLogin[lang]}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-white/70">
                        {t.fieldPassword[lang]}
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-white/50 hover:text-white/70 transition-colors"
                      >
                        {t.forgotPassword[lang]}
                      </Link>
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      required
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldPassword[lang]}
                    />
                  </div>

                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {loginError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoadingLogin}
                    className="w-full h-11 rounded-xl bg-[#2563EB] text-sm font-medium flex items-center justify-center hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingLogin ? t.loggingIn[lang] : t.loginButton[lang]}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold mb-4">
                    {t.authTitleRegister[lang]}
                  </h2>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.fieldCompanyName[lang]}
                    </label>
                    <input
                      type="text"
                      value={registerCompanyName}
                      onChange={(e) => {
                        setRegisterCompanyName(e.target.value);
                        setRegisterError('');
                      }}
                      required
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldCompanyName[lang]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.fieldOwnerName[lang]}
                    </label>
                    <input
                      type="text"
                      value={registerOwnerName}
                      onChange={(e) => {
                        setRegisterOwnerName(e.target.value);
                        setRegisterError('');
                      }}
                      required
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldOwnerName[lang]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.fieldOwnerEmail[lang]}
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        setRegisterError('');
                      }}
                      required
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldOwnerEmail[lang]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.fieldOwnerPhone[lang]}
                    </label>
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => {
                        setRegisterPhone(e.target.value);
                        setRegisterError('');
                      }}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldOwnerPhone[lang]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.fieldPassword[lang]}
                    </label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        setRegisterError('');
                      }}
                      required
                      minLength={6}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.fieldPassword[lang]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      {t.confirmPassword[lang]}
                    </label>
                    <input
                      type="password"
                      value={registerConfirmPassword}
                      onChange={(e) => {
                        setRegisterConfirmPassword(e.target.value);
                        setRegisterError('');
                      }}
                      required
                      minLength={6}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm mb-3 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder={t.confirmPassword[lang]}
                    />
                  </div>

                  {registerError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {registerError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoadingRegister}
                    className="w-full h-11 rounded-xl bg-[#2563EB] text-sm font-medium flex items-center justify-center hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingRegister ? t.creating[lang] : t.registerButton[lang]}
                  </button>

                  <p className="mt-4 text-[11px] text-white/50 text-center">
                    {t.termsText[lang]}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

