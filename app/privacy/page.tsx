"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
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
            Политика конфиденциальности
          </h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Общие положения</h2>
              <p className="text-muted-foreground">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
                пользователей сервиса WELLIFY business (далее — «Сервис»). Используя Сервис, вы соглашаетесь 
                с условиями настоящей Политики конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Собираемые данные</h2>
              <p className="text-muted-foreground mb-2">
                Мы собираем следующие типы данных:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Имя и контактная информация (email, телефон)</li>
                <li>Данные о вашем бизнесе и точках продаж</li>
                <li>Финансовые данные (выручка, смены, отчеты)</li>
                <li>Данные о сотрудниках и их работе</li>
                <li>Технические данные (IP-адрес, тип браузера, устройство)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Использование данных</h2>
              <p className="text-muted-foreground">
                Мы используем собранные данные для:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Предоставления и улучшения функциональности Сервиса</li>
                <li>Обработки ваших запросов и предоставления поддержки</li>
                <li>Отправки важных уведомлений об изменениях в Сервисе</li>
                <li>Анализа использования Сервиса для улучшения пользовательского опыта</li>
                <li>Обеспечения безопасности и предотвращения мошенничества</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Защита данных</h2>
              <p className="text-muted-foreground">
                Мы применяем современные методы защиты данных, включая шифрование, безопасное хранение 
                и ограниченный доступ к персональным данным. Ваши данные хранятся на защищенных серверах 
                и не передаются третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Ваши права</h2>
              <p className="text-muted-foreground">
                Вы имеете право:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Получать информацию о ваших персональных данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления ваших данных</li>
                <li>Отозвать согласие на обработку данных</li>
                <li>Ограничить обработку ваших данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Контакты</h2>
              <p className="text-muted-foreground">
                По всем вопросам, связанным с обработкой персональных данных, вы можете обращаться 
                по адресу: <a href="mailto:privacy@wellify.business" className="text-primary hover:underline">privacy@wellify.business</a>
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















