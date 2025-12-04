export type WelcomeLanguage = 'uk' | 'ru' | 'en';

export const welcomeTranslations: Record<string, Record<WelcomeLanguage, string>> = {
  // Бренд и базовое
  brand: {
    uk: 'Wellify Business',
    ru: 'Wellify Business',
    en: 'Wellify Business',
  },
  heroBadge: {
    uk: 'Цифровий кабінет для власників точок',
    ru: 'Цифровой кабинет для владельцев точек',
    en: 'Digital control panel for your locations',
  },
  heroTitle: {
    uk: 'Керуй змінами, точками та людьми в одному місці',
    ru: 'Управляй сменами, точками и людьми в одном месте',
    en: 'Manage shifts, locations and people in one place',
  },
  heroSubtitle: {
    uk: 'Wellify збирає виручку, проблеми, задачі та звіти по змінах в одному зручному кабінеті.',
    ru: 'Wellify собирает выручку, проблемы, задачи и отчёты по сменам в одном удобном кабинете.',
    en: 'Wellify brings revenue, issues, tasks and shift reports together in one simple dashboard.',
  },

  // Буллеты
  heroBullet1: {
    uk: 'Онлайн-контроль усіх точок у реальному часі',
    ru: 'Онлайн-контроль всех точек в реальном времени',
    en: 'Real-time control of all locations',
  },
  heroBullet2: {
    uk: 'Звіти по кожній зміні в один клік',
    ru: 'Отчёты по каждой смене в один клик',
    en: 'One-click reports for every shift',
  },
  heroBullet3: {
    uk: 'Проблеми, інциденти та задачі під контролем',
    ru: 'Проблемы, инциденты и задачи под контролем',
    en: 'Issues, incidents and tasks under control',
  },

  // Карточка логина/регистрации
  authTitleLogin: {
    uk: 'Вхід до кабінету',
    ru: 'Вход в кабинет',
    en: 'Sign in to your workspace',
  },
  authTitleRegister: {
    uk: 'Створити компанію',
    ru: 'Создать компанию',
    en: 'Create a company account',
  },
  authTabLogin: {
    uk: 'Вхід',
    ru: 'Вход',
    en: 'Sign in',
  },
  authTabRegister: {
    uk: 'Реєстрація',
    ru: 'Регистрация',
    en: 'Sign up',
  },

  // Поля логина
  fieldCompanyId: {
    uk: 'ID компанії / код точки',
    ru: 'ID компании / код точки',
    en: 'Company ID / location code',
  },
  fieldLogin: {
    uk: 'Логін або Email',
    ru: 'Логин или Email',
    en: 'Login or Email',
  },
  fieldPassword: {
    uk: 'Пароль',
    ru: 'Пароль',
    en: 'Password',
  },
  rememberMe: {
    uk: "Запам'ятати мене на цьому пристрої",
    ru: 'Запомнить меня на этом устройстве',
    en: 'Remember me on this device',
  },
  forgotPassword: {
    uk: 'Забули пароль?',
    ru: 'Забыли пароль?',
    en: 'Forgot password?',
  },
  loginButton: {
    uk: 'Увійти',
    ru: 'Войти',
    en: 'Sign in',
  },

  // Поля регистрации
  fieldCompanyName: {
    uk: 'Назва компанії',
    ru: 'Название компании',
    en: 'Company name',
  },
  fieldOwnerName: {
    uk: "Ваше ім'я",
    ru: 'Ваше имя',
    en: 'Your name',
  },
  fieldOwnerEmail: {
    uk: 'Робочий Email',
    ru: 'Рабочий Email',
    en: 'Work Email',
  },
  fieldOwnerPhone: {
    uk: "Телефон (для зв'язку з менеджером)",
    ru: 'Телефон (для связи с менеджером)',
    en: 'Phone (for manager contact)',
  },
  registerButton: {
    uk: 'Створити кабінет',
    ru: 'Создать кабинет',
    en: 'Create workspace',
  },
  termsText: {
    uk: 'Продовжуючи, ви погоджуєтесь з умовами сервісу Wellify.',
    ru: 'Продолжая, вы соглашаетесь с условиями сервиса Wellify.',
    en: "By continuing, you agree to Wellify's terms of service.",
  },

  // Низ страницы (простой футер)
  footerText: {
    uk: '© 2025 Wellify. Усі права захищені.\nWELLIFY Business є продуктом компанії WELLIFY Group.',
    ru: '© 2025 Wellify. Все права защищены.\nWELLIFY Business является продуктом компании WELLIFY Group.',
    en: '© 2025 Wellify. All rights reserved.\nWELLIFY Business is a product of WELLIFY Group.',
  },

  // Переводы для полного футера
  footerBrandTitle: {
    uk: 'WELLIFY business',
    ru: 'WELLIFY business',
    en: 'WELLIFY business',
  },
  footerBrandDescription: {
    uk: 'Вся виручка, зміни й співробітники в одному кабінеті.',
    ru: 'Вся выручка, смены и сотрудники в одном кабинете.',
    en: 'All revenue, shifts and staff in a single dashboard.',
  },
  footerLinksTitle: {
    uk: 'Посилання',
    ru: 'Ссылки',
    en: 'Links',
  },
  footerLinkPrivacy: {
    uk: 'Політика конфіденційності',
    ru: 'Политика конфиденциальности',
    en: 'Privacy policy',
  },
  footerLinkTerms: {
    uk: 'Користувацька угода',
    ru: 'Пользовательское соглашение',
    en: 'Terms of use',
  },
  footerLinkSupport: {
    uk: 'Підтримка',
    ru: 'Поддержка',
    en: 'Support',
  },
  footerContactsTitle: {
    uk: 'Контакти',
    ru: 'Контакты',
    en: 'Contacts',
  },
  footerContactEmail: {
    uk: 'Email підтримки',
    ru: 'Email поддержки',
    en: 'Support email',
  },
  footerContactTelegram: {
    uk: 'Telegram бот',
    ru: 'Telegram бот',
    en: 'Telegram bot',
  },
  footerBottomText: {
    uk: '© 2025 WELLIFY business. Усі права захищені.\nWELLIFY Business є продуктом компанії WELLIFY Group.',
    ru: '© 2025 WELLIFY business. Все права защищены.\nWELLIFY Business является продуктом компании WELLIFY Group.',
    en: '© 2025 WELLIFY business. All rights reserved.\nWELLIFY Business is a product of WELLIFY Group.',
  },

  // Переключатель языка
  langLabel: {
    uk: 'Мова інтерфейсу',
    ru: 'Язык интерфейса',
    en: 'Interface language',
  },
  langUk: {
    uk: 'Українська',
    ru: 'Украинский',
    en: 'Ukrainian',
  },
  langRu: {
    uk: 'Російська',
    ru: 'Русский',
    en: 'Russian',
  },
  langEn: {
    uk: 'Англійська',
    ru: 'Английский',
    en: 'English',
  },

  // Дополнительные тексты
  confirmPassword: {
    uk: 'Підтвердіть пароль',
    ru: 'Подтвердите пароль',
    en: 'Confirm password',
  },
  loggingIn: {
    uk: 'Вхід...',
    ru: 'Вход...',
    en: 'Signing in...',
  },
  creating: {
    uk: 'Створення...',
    ru: 'Создание...',
    en: 'Creating...',
  },
  errorInvalidCredentials: {
    uk: 'Невірний email або пароль',
    ru: 'Неверный email или пароль',
    en: 'Invalid email or password',
  },
  errorLogin: {
    uk: 'Помилка входу',
    ru: 'Ошибка входа',
    en: 'Login error',
  },
  errorEnterCompanyName: {
    uk: 'Введіть назву компанії',
    ru: 'Введите название компании',
    en: 'Enter company name',
  },
  errorEnterOwnerName: {
    uk: 'Введіть ваше ім\'я',
    ru: 'Введите ваше имя',
    en: 'Enter your name',
  },
  errorEnterEmail: {
    uk: 'Введіть email',
    ru: 'Введите email',
    en: 'Enter email',
  },
  errorPasswordMinLength: {
    uk: 'Пароль має бути мінімум 6 символів',
    ru: 'Пароль должен быть минимум 6 символов',
    en: 'Password must be at least 6 characters',
  },
  errorPasswordMismatch: {
    uk: 'Паролі не співпадають',
    ru: 'Пароли не совпадают',
    en: 'Passwords do not match',
  },
  errorRegistration: {
    uk: 'Помилка реєстрації',
    ru: 'Ошибка регистрации',
    en: 'Registration error',
  },
};

