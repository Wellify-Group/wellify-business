# Report Export Module

Архитектура модуля экспорта отчётов с заделом на будущую интеграцию с Google Drive.

## Структура

```
lib/
├── domain/
│   └── report/
│       └── Report.ts              # Типы (ReportPayload, GeneratedReport)
└── application/
    └── report/
        ├── StorageService.ts      # Работа с Supabase Storage
        ├── MailerService.ts       # Отправка email (TODO: интеграция)
        ├── ReportService.ts       # Генерация отчётов (PDF, CSV)
        └── ReportExporter.ts      # Экспорт (download, email, Google Drive)

app/api/reports/
├── generate/
│   └── route.ts                   # POST /api/reports/generate
└── [reportId]/
    └── export/
        ├── download/
        │   └── route.ts           # POST /api/reports/:id/export/download
        ├── email/
        │   └── route.ts           # POST /api/reports/:id/export/email
        └── google-drive/
            └── route.ts           # POST /api/reports/:id/export/google-drive (зарезервирован)
```

## Основные компоненты

### 1. ReportService
- Генерирует PDF и CSV отчёты
- Загружает файлы в Supabase Storage
- TODO: Реализовать генерацию PDF (puppeteer/pdfkit)

### 2. ReportExporter
- `exportToDownload()` - возвращает подписанную ссылку
- `exportToEmail()` - отправляет отчёт на email
- `exportToGoogleDrive()` - **заглушка на будущее** (бросает ошибку)

### 3. StorageService
- Работа с Supabase Storage
- Загрузка/скачивание файлов
- Генерация подписанных URL

### 4. MailerService
- Отправка email с вложениями
- TODO: Интегрировать с SendGrid/Resend/AWS SES

## TODO для полной реализации

1. **PDF генерация**: Установить `puppeteer` или `pdfkit`, реализовать `ReportService.generatePdf()`
2. **Email сервис**: Интегрировать MailerService с реальным провайдером
3. **База данных**: Добавить таблицу `reports` для хранения метаданных отчётов
4. **Google Drive**: Реализовать `GoogleDriveClient` и метод `exportToGoogleDrive()`

## Закос на будущее

Метод `exportToGoogleDrive()` уже существует в `ReportExporter`, но пока бросает ошибку. Это позволяет:
- Не размазывать логику экспорта по коду
- Легко добавить интеграцию в будущем
- API endpoint уже зарезервирован

При добавлении Google Drive:
1. Создать `GoogleDriveClient`
2. Реализовать `exportToGoogleDrive()` в `ReportExporter`
3. Раскомментировать код в `/api/reports/[reportId]/export/google-drive/route.ts`










