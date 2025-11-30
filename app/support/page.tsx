"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, MapPin } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-[20px] bg-white dark:bg-zinc-900 p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Поддержка
            </h1>
            <p className="mb-8 text-muted-foreground">
              Мы всегда готовы помочь вам с любыми вопросами по использованию WELLIFY business.
            </p>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-[20px] bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Email поддержка
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Напишите нам на email, и мы ответим в течение 24 часов.
                </p>
                <a
                  href="mailto:support@wellify.business"
                  className="text-sm text-primary hover:underline"
                >
                  support@wellify.business
                </a>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-[20px] bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Telegram бот
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Получите быструю помощь через наш Telegram бот.
                </p>
                <a
                  href="https://t.me/wellify_business_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  @wellify_business_bot
                </a>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-[20px] bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Офис
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Приходите к нам в офис для личной консультации.
                </p>
                <p className="text-sm text-muted-foreground">
                  г. Киев, ул. Примерная, 1
                </p>
              </motion.div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white dark:bg-zinc-900 p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Часто задаваемые вопросы
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  Как создать аккаунт директора?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку "Создать аккаунт директора" на главной странице и заполните форму регистрации.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  Как добавить сотрудников?
                </h3>
                <p className="text-sm text-muted-foreground">
                  После создания аккаунта директора перейдите в раздел "Персонал" и нажмите "Добавить сотрудника".
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  Как восстановить пароль?
                </h3>
                <p className="text-sm text-muted-foreground">
                  На странице входа нажмите "Забыли пароль?" и следуйте инструкциям для восстановления доступа.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}















