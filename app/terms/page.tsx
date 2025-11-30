"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          className="rounded-[20px] bg-white dark:bg-zinc-900 p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
        >
          <h1 className="mb-6 text-4xl font-bold text-foreground">
            Пользовательское соглашение
          </h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Принятие условий</h2>
              <p className="text-muted-foreground">
                Используя сервис WELLIFY business (далее — «Сервис»), вы соглашаетесь с условиями 
                настоящего Пользовательского соглашения. Если вы не согласны с какими-либо условиями, 
                пожалуйста, не используйте Сервис.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Описание сервиса</h2>
              <p className="text-muted-foreground">
                WELLIFY business — это платформа для управления бизнесом, которая позволяет:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Управлять сменами сотрудников</li>
                <li>Отслеживать выручку и финансы</li>
                <li>Анализировать работу точек продаж</li>
                <li>Управлять персоналом и локациями</li>
                <li>Получать отчеты и аналитику</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Регистрация и аккаунт</h2>
              <p className="text-muted-foreground">
                Для использования Сервиса необходимо создать аккаунт. Вы обязуетесь:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Предоставлять достоверную и актуальную информацию</li>
                <li>Поддерживать безопасность вашего аккаунта</li>
                <li>Нести ответственность за все действия, совершенные под вашим аккаунтом</li>
                <li>Немедленно уведомлять нас о любом несанкционированном использовании</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Использование сервиса</h2>
              <p className="text-muted-foreground">
                Вы обязуетесь использовать Сервис только в законных целях и не нарушать права третьих лиц. 
                Запрещается:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Использовать Сервис для незаконной деятельности</li>
                <li>Попытки взлома или нарушения безопасности</li>
                <li>Передача доступа к аккаунту третьим лицам</li>
                <li>Использование автоматизированных средств для доступа к Сервису</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Интеллектуальная собственность</h2>
              <p className="text-muted-foreground">
                Все материалы Сервиса, включая дизайн, тексты, графику, логотипы и программное обеспечение, 
                являются собственностью WELLIFY business и защищены законами об интеллектуальной собственности.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Ограничение ответственности</h2>
              <p className="text-muted-foreground">
                Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу Сервиса и не несем 
                ответственности за любые убытки, возникшие в результате использования или невозможности использования Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Изменения в соглашении</h2>
              <p className="text-muted-foreground">
                Мы оставляем за собой право изменять настоящее Соглашение в любое время. О существенных изменениях 
                мы уведомим вас по email или через уведомления в Сервисе.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Контакты</h2>
              <p className="text-muted-foreground">
                По всем вопросам, связанным с использованием Сервиса, вы можете обращаться 
                по адресу: <a href="mailto:support@wellify.business" className="text-primary hover:underline">support@wellify.business</a>
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}















