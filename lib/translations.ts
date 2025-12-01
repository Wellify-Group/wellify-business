export type Language = "en" | "ua" | "ru";

export const DEFAULT_LANGUAGE: Language = "ru";

export const TRANSLATIONS = {
  en: {
    // --- LOGIN PAGE KEYS ---
    login_office_title: "Office Login",
    login_office_desc: "Login as Director or Manager",
    login_btn_office: "Office",
    login_btn_terminal: "Terminal",
    password_label: "PASSWORD",
    login_forgot_password: "Forgot password?",
    btn_login: "Sign In",
    login_or_social: "OR LOGIN WITH",
    // -----------------------

    role_employee: "Employee",
    logout: "Logout",
    dashboard: {
      dashboard_point: "Point",
      dashboard_shift_active: "Shift active",
      dashboard_shift_finished: "Shift finished",
      dashboard_shift_not_started: "Shift not started",
      profile: "Profile",
      shift_history: "Shift History",
      menu_dark_mode: "Dark Mode",
      interface_language: "Interface Language",
      btn_exit: "Logout",
      start_shift: "Start Shift",
      close_shift: "Close Shift",
      closing_shift: "Closing...",
      shift_finished_success: "Shift finished successfully",
      error_finish_shift: "Failed to finish shift",
      error_missing_location_or_user: "Missing location or user ID",
      shift_started_success: "Shift started successfully",
      error_start_shift: "Failed to start shift",
      cannot_logout_active_shift: "Cannot logout while shift is active",
      emp_my_location: "My Location",
      no_location_assigned: "No location assigned",
      emp_working: "Working",
      emp_on_pause: "Paused",
      emp_closed: "Closed",
      emp_location_rules: "Location Rules",
      emp_no_rules: "No rules specified",
      emp_closing_standards: "Closing Standards",
      emp_no_standards: "No standards specified",
      schedule: "Schedule",
      documents: "Documents",
      emp_special_requirements: "Special Requirements",
      emp_no_requirements: "No special requirements",
      start_shift_confirmation:
        "After starting the shift, quick actions will be available and shift data will be recorded.",
      cancel: "Cancel",
      starting_shift: "Starting...",
      end_shift_confirm: "End Shift?",
      revenue: "Revenue",
      checks_count: "Checks",
      end_shift_confirm_text:
        "Are you sure you want to end the shift? You will be able to download the report afterwards.",
      end_shift: "End Shift",
      shift_terminal: "Shift Terminal",
      welcome_boss: "Welcome, Boss",
      point_control: "Point Control",
      ready_shift: "Ready to start shift",
      nav_overview: "Overview",
      nav_locations: "Locations",
      nav_staff: "Staff",
      nav_reports: "Reports",
      nav_settings: "Settings",
    },
    nav: {
      features: "Features",
      pricing: "Pricing",
      contacts: "Contacts",
      login: "Login",
      getStarted: "Get Started",
      createAccount: "Create Account",
    },
    support: {
      title: "WELLIFY Support",
      subtitle: "Choose a question or write to us — we usually respond within a few minutes",
      quick_answers: "Quick Answers",
      faq_location: "How to find the location?",
      faq_location_ans: "Go to the 'My Location' tab to see the address and map.",
      faq_pin: "Forgot PIN code?",
      faq_pin_ans: "Contact the administrator to restore access.",
      faq_billing: "Billing Questions",
      faq_billing_ans: "All financial data is available in the 'Reports' section.",
      btn_telegram: "Write to Telegram",
      telegram_desc: "Write to us on Telegram for quick help",
      input_placeholder: "Write a message...",
      btn_send: "Send",
      auto_reply: "Thank you for contacting us! We will get back to you shortly.",
    },
    features: {
      title: "Everything you need to run your business",
      checkins: {
        title: "Smart Check-ins",
        description:
          "Employees check in with geolocation and photo verification. You always know who is at work.",
      },
      autoAnalysis: {
        title: "Auto Analysis",
        description: "System automatically identifies anomalies and potential theft attempts.",
      },
      zeroConfig: {
        title: "Zero Configuration",
        description: "Start in 30 seconds. No complex setup required. Just invite your team.",
      },
    },
    // Landing
    landing_hero_main_title: "All revenue, shifts and employees in one dashboard",
    landing_hero_main_desc:
      "Full business control: revenue, payroll, motivation, photo reports and much more. Connect employees and manage locations remotely.",
    landing_btn_create_director: "Create Director Account",
    landing_btn_how_it_works: "How it works",

    sec_whom: "Who is it for?",
    sec_caps: "System Features",
    sec_how: "How to start?",

    landing_quick_start_title: "Quick Start",

    landing_features_category_shifts: "Shifts & Control",
    landing_features_category_finance: "Finance & Analytics",
    landing_features_category_team: "Team & Motivation",

    landing_feature_shift_30s_title: "Open in 30 seconds",
    landing_feature_shift_30s_desc: "Quick shift start from phone or tablet",
    landing_feature_checklists_title: "Checklists",
    landing_feature_checklists_desc: "Task control during opening and closing",
    landing_feature_photo_title: "Photo Reports",
    landing_feature_photo_desc: "Confirm location status with photos",
    landing_feature_geo_title: "Geolocation",
    landing_feature_geo_desc: "Verify employee is at the workplace",
    landing_feature_late_control_title: "Late Control",
    landing_feature_late_control_desc:
      "Automatic shift start time tracking and notifications to director for late arrivals.",
    landing_feature_incidents_title: "Problems & Incidents",
    landing_feature_incidents_desc:
      "Employee can report a problem in seconds: equipment breakdown, stock shortage, conflict, suspicious situation.",

    landing_feature_revenue_title: "Live Revenue",
    landing_feature_revenue_desc: "Track income in real-time",
    landing_feature_plan_title: "Sales Plan",
    landing_feature_plan_desc: "Set goals and track progress",
    landing_feature_anomalies_title: "Anomalies",
    landing_feature_anomalies_desc: "Alerts about suspicious operations",
    landing_feature_statement_title: "P&L Report",
    landing_feature_statement_desc: "Profit and Loss in clear format",
    landing_feature_export_title: "Export to Excel",
    landing_feature_export_desc: "Download data for accounting",
    landing_feature_analytics_title: "Analytics & Dashboard",
    landing_feature_analytics_desc: "Data visualization and key metrics in real-time",

    landing_feature_rating_title: "Employee Rating",
    landing_feature_rating_desc: "Motivation based on performance",
    landing_feature_notifications_title: "Push Notifications",
    landing_feature_notifications_desc: "Instant alerts about important events",
    landing_feature_telegram_title: "Telegram Bot",
    landing_feature_telegram_desc: "Get reports directly in messenger",

    landing_how_works_step1_title: "Create Account",
    landing_how_works_step1_desc: "Register as director and add your first location",
    landing_how_works_step2_title: "Add Employees",
    landing_how_works_step2_desc: "Invite staff via link or create profiles manually",
    landing_how_works_step3_title: "Track Results",
    landing_how_works_step3_desc: "Employees open shifts, you see all statistics",

    // Business Types
    biz_cafe: "Cafe & Restaurants",
    biz_coffee: "Coffee Shops",
    biz_retail: "Retail Stores",
    biz_beauty: "Beauty Salons",
    biz_street: "Street Food & Kiosks",
    biz_bakery: "Bakeries",
    biz_auto: "Car Service & Wash",
    biz_pickup: "Pickup Points",
    biz_flowers: "Flower Shops",
    biz_print: "Call Centers",
    biz_services: "Service Sector",
    biz_dark: "Food Delivery",
    biz_barbershop: "Barbershops",
    biz_medical: "Medical Centers",
    biz_sports: "Sports Studios",
    biz_car_dealer: "Car Dealers / Parts",
    biz_tire: "Tire Service",
    biz_repair: "Tech Repair",
    biz_hotel: "Hotels / Hostels",
    biz_photo: "Photo Studios",

    // Industry Descriptions
    landing_industriesDescriptions_cafe:
      "Track shifts, revenue and payroll, control checklists and photo reports for hall and kitchen.",
    landing_industriesDescriptions_coffee:
      "Track each shift and revenue, control baristas and service quality.",
    landing_industriesDescriptions_retail:
      "Transparent revenue per shift, tasks for sales staff and control of standards.",
    landing_industriesDescriptions_beauty:
      "Control of masters' work, shift revenue and salon condition via photo reports.",
    landing_industriesDescriptions_street:
      "Accounting for each point, its shifts and cash, confirmation that staff really worked on site.",
    landing_industriesDescriptions_bakery:
      "Control of night and day shifts, production and display of products via photos.",
    landing_industriesDescriptions_auto:
      "Monitor workload, shifts, revenue and quality of staff work.",
    landing_industriesDescriptions_pickup:
      "Control staff presence, shift schedules and quality of customer service.",
    landing_industriesDescriptions_flowers:
      "Track shifts and revenue, control window display and order in the shop via photo reports.",
    landing_industriesDescriptions_print:
      "Track operators’ shifts, tasks and results for every working day.",
    landing_industriesDescriptions_services:
      "Unified control of shifts, tasks and revenue for any service company.",
    landing_industriesDescriptions_dark:
      "Control shifts of couriers and kitchen, log issues and monitor points through photos.",
    landing_industriesDescriptions_barbershop:
      "Control barbers’ work, shifts and revenue without complex CRM.",
    landing_industriesDescriptions_medical:
      "Transparent accounting of shifts for admins and staff, control of service standards.",
    landing_industriesDescriptions_sports:
      "Control shifts of trainers and admins, revenue and studio load.",
    landing_industriesDescriptions_car_dealer:
      "Track shifts of managers and salespeople, control sales targets and revenue.",
    landing_industriesDescriptions_tire:
      "Simple tracking of mechanics’ shifts, revenue and workload.",
    landing_industriesDescriptions_repair:
      "Control of masters’ workload, shifts and revenue without complicated spreadsheets.",
    landing_industriesDescriptions_hotel:
      "Shifts and tasks of reception, revenue and order control through photo reports.",
    landing_industriesDescriptions_photo:
      "Track shifts of admins, bookings and revenue per shift.",
  },

  ua: {
    // --- LOGIN PAGE KEYS ---
    login_office_title: "Вхід в офіс",
    login_office_desc: "Увійдіть як директор або менеджер",
    login_btn_office: "Офіс",
    login_btn_terminal: "Термінал",
    password_label: "ПАРОЛЬ",
    login_forgot_password: "Забули пароль?",
    btn_login: "Увійти",
    login_or_social: "АБО УВІЙТИ ЧЕРЕЗ",
    // -----------------------

    role_employee: "Співробітник",
    logout: "Вийти",
    dashboard: {
      dashboard_point: "Точка",
      dashboard_shift_active: "Зміна йде",
      dashboard_shift_finished: "Зміна завершена",
      dashboard_shift_not_started: "Зміна не розпочата",
      profile: "Профіль",
      shift_history: "Історія змін",
      menu_dark_mode: "Темний режим",
      interface_language: "Мова інтерфейсу",
      btn_exit: "Вийти",
      start_shift: "Почати зміну",
      close_shift: "Закрити зміну",
      closing_shift: "Закриваємо...",
      shift_finished_success: "Зміну успішно завершено",
      error_finish_shift: "Не вдалося завершити зміну",
      error_missing_location_or_user: "Відсутній ID точки або користувача",
      shift_started_success: "Зміну успішно розпочато",
      error_start_shift: "Не вдалося почати зміну",
      cannot_logout_active_shift: "Нельзя выйти, пока смена не завершена",
      emp_my_location: "Моя точка",
      no_location_assigned: "Точка не призначена",
      emp_working: "Працює",
      emp_on_pause: "На паузі",
      emp_closed: "Закрита",
      emp_location_rules: "Правила точки",
      emp_no_rules: "Правила не вказані",
      emp_closing_standards: "Стандарти закриття",
      emp_no_standards: "Стандарти не вказані",
      schedule: "Графік роботи",
      documents: "Документи",
      emp_special_requirements: "Особливі вимоги",
      emp_no_requirements: "Особливих вимог немає",
      start_shift_confirmation:
        "Після початку зміни будуть доступні швидкі дії та почнуть фіксуватися дані зміни.",
      cancel: "Скасувати",
      starting_shift: "Запуск...",
      end_shift_confirm: "Закінчити зміну?",
      revenue: "Виручка",
      checks_count: "Чеків",
      end_shift_confirm_text:
        "Ви впевнені, що хочете завершити зміну? Після завершення ви зможете завантажити звіт.",
      end_shift: "Закінчити зміну",
      shift_terminal: "Термінал зміни",
      welcome_boss: "Ласкаво просимо, босе",
      point_control: "Контроль точки",
      ready_shift: "Готовий почати зміну",
      nav_overview: "Огляд",
      nav_locations: "Локації",
      nav_staff: "Персонал",
      nav_reports: "Звіти",
      nav_settings: "Налаштування",
    },
    nav: {
      features: "Можливості",
      pricing: "Ціни",
      contacts: "Контакти",
      login: "Увійти",
      getStarted: "Почати",
      createAccount: "Створити акаунт",
    },
    support: {
      title: "Підтримка WELLIFY",
      subtitle:
        "Виберіть питання або напишіть нам — зазвичай відповідаємо за кілька хвилин",
      quick_answers: "Швидкі відповіді",
      faq_location: "Як знайти точку?",
      faq_location_ans:
        "Перейдіть у вкладку 'Моя точка', щоб побачити адресу та карту.",
      faq_pin: "Забули PIN-код?",
      faq_pin_ans: "Зверніться до адміністратора для відновлення доступу.",
      faq_billing: "Питання по білінгу",
      faq_billing_ans: "Всі фінансові дані доступні у розділі 'Звіти'.",
      btn_telegram: "Написати в Telegram",
      telegram_desc: "Напишіть нам у Telegram для швидкої допомоги",
      input_placeholder: "Напишіть повідомлення...",
      btn_send: "Відправити",
      auto_reply: "Дякуємо за звернення! Ми зв'яжемося з вами найближчим часом.",
    },
    features: {
      title: "Все необхідне для керування бізнесом",
      checkins: {
        title: "Розумні чекіни",
        description:
          "Співробітники відмічаються з геолокацією та фото. Ви завжди знаєте, хто на роботі.",
      },
      autoAnalysis: {
        title: "Автоаналіз",
        description: "Система автоматично виявляє аномалії та спроби крадіжок.",
      },
      zeroConfig: {
        title: "Нульова конфігурація",
        description:
          "Старт за 30 секунд. Ніяких складних налаштувань. Просто запросіть команду.",
      },
    },
    // Landing
    landing_hero_main_title:
      "Вся виручка, зміни та співробітники в одному кабінеті",
    landing_hero_main_desc:
      "Повний контроль бізнесу: виручка, зарплата, мотивація, фотозвіти та багато іншого. Підключіть співробітників та керуйте точками віддалено.",
    landing_btn_create_director: "Створити акаунт директора",
    landing_btn_how_it_works: "Як це працює",

    sec_whom: "Для кого підходить?",
    sec_caps: "Можливості системи",
    sec_how: "Як почати користуватися?",

    landing_quick_start_title: "Швидкий старт",

    landing_features_category_shifts: "Зміни та контроль",
    landing_features_category_finance: "Фінанси та аналітика",
    landing_features_category_team: "Команда та мотивація",

    landing_feature_shift_30s_title: "Відкриття за 30 секунд",
    landing_feature_shift_30s_desc: "Швидкий старт зміни з телефону або планшета",
    landing_feature_checklists_title: "Чек-листи",
    landing_feature_checklists_desc:
      "Контроль виконання завдань при відкритті та закритті",
    landing_feature_photo_title: "Фотозвіти",
    landing_feature_photo_desc:
      "Підтвердження стану точки фотографіями",
    landing_feature_geo_title: "Геолокація",
    landing_feature_geo_desc:
      "Перевірка, що співробітник знаходиться на робочому місці",
    landing_feature_late_control_title: "Контроль запізнень",
    landing_feature_late_control_desc:
      "Автоматична фіксація часу початку зміни та сповіщення директору при запізненнях.",
    landing_feature_incidents_title: "Проблеми та інциденти",
    landing_feature_incidents_desc:
      "Співробітник може за секунду повідомити про проблему: поломка обладнання, нестача товару, конфлікт, підозріла ситуація.",

    landing_feature_revenue_title: "Виручка онлайн",
    landing_feature_revenue_desc:
      "Слідкуйте за доходами в реальному часі",
    landing_feature_plan_title: "План продажів",
    landing_feature_plan_desc:
      "Встановлення цілей та відстеження виконання",
    landing_feature_anomalies_title: "Аномалії",
    landing_feature_anomalies_desc:
      "Сповіщення про підозрілі операції",
    landing_feature_statement_title: "P&L звіт",
    landing_feature_statement_desc:
      "Прибутки та збитки у зрозумілому форматі",
    landing_feature_export_title: "Експорт в Excel",
    landing_feature_export_desc:
      "Вивантаження даних для бухгалтерії",
    landing_feature_analytics_title: "Аналітика та дашборд",
    landing_feature_analytics_desc:
      "Візуалізація даних та ключові метрики в реальному часі",

    landing_feature_rating_title: "Рейтинг співробітників",
    landing_feature_rating_desc:
      "Мотивація на основі показників",
    landing_feature_notifications_title: "Push-сповіщення",
    landing_feature_notifications_desc:
      "Миттєві сповіщення про важливі події",
    landing_feature_telegram_title: "Telegram бот",
    landing_feature_telegram_desc:
      "Отримуйте звіти прямо в месенджер",

    landing_how_works_step1_title: "Створіть акаунт",
    landing_how_works_step1_desc:
      "Зареєструйтеся як директор і додайте свою першу точку",
    landing_how_works_step2_title: "Додайте співробітників",
    landing_how_works_step2_desc:
      "Запросіть персонал за посиланням або створіть профілі вручну",
    landing_how_works_step3_title: "Слідкуйте за результатом",
    landing_how_works_step3_desc:
      "Співробітники відкривають зміни, а ви бачите всю статистику",

    // Business Types
    biz_cafe: "Кафе та ресторани",
    biz_coffee: "Кав'ярні",
    biz_retail: "Магазини",
    biz_beauty: "Салони краси",
    biz_street: "Стрітфуд та кіоски",
    biz_bakery: "Пекарні",
    biz_auto: "Автосервіси та мийки",
    biz_pickup: "Пункти видачі",
    biz_flowers: "Квіткові магазини",
    biz_print: "Кол-центр",
    biz_services: "Сфера послуг",
    biz_dark: "Доставка їжі",
    biz_barbershop: "Барбершопи",
    biz_medical: "Медичні центри",
    biz_sports: "Спортивні студії",
    biz_car_dealer: "Автосалони / запчастини",
    biz_tire: "Шиномонтаж",
    biz_repair: "Ремонт техніки",
    biz_hotel: "Готелі / хостели",
    biz_photo: "Фото-студії",

    // Industry Descriptions
    landing_industriesDescriptions_cafe:
      "Облік змін, виручки та оплати, контроль чек-листів і фотозвітів по залу та кухні.",
    landing_industriesDescriptions_coffee:
      "Фіксація кожної зміни й виручки, контроль бариста та якості сервісу.",
    landing_industriesDescriptions_retail:
      "Прозора виручка по змінах, завдання для продавців та контроль дотримання стандартів.",
    landing_industriesDescriptions_beauty:
      "Контроль роботи майстрів, виручки по змінах і стану залу через фотозвіти.",
    landing_industriesDescriptions_street:
      "Облік кожної точки, змін і каси, підтвердження роботи співробітників на місці.",
    landing_industriesDescriptions_bakery:
      "Контроль нічних та денних змін, виробітку й викладки продукції по фото.",
    landing_industriesDescriptions_auto:
      "Відстеження завантаженості, змін, виручки та якості роботи персоналу.",
    landing_industriesDescriptions_pickup:
      "Контроль присутності співробітників, графіка змін та якості обслуговування клієнтів.",
    landing_industriesDescriptions_flowers:
      "Облік змін і виручки, контроль вітрини та порядку за фотозвітами.",
    landing_industriesDescriptions_print:
      "Фіксація змін операторів, завдань і результатів кожної робочої зміни.",
    landing_industriesDescriptions_services:
      "Єдиний контроль змін, завдань і виручки для будь-якої сервісної компанії.",
    landing_industriesDescriptions_dark:
      "Контроль змін кур'єрів та кухні, фіксація проблем і стану точок по фото.",
    landing_industriesDescriptions_barbershop:
      "Контроль роботи барберів, змін і виручки без складних CRM.",
    landing_industriesDescriptions_medical:
      "Прозорий облік змін адміністраторів і персоналу, контроль стандартів сервісу.",
    landing_industriesDescriptions_sports:
      "Контроль змін тренерів і адміністраторів, виручки та завантаженості студії.",
    landing_industriesDescriptions_car_dealer:
      "Облік змін менеджерів і продавців, контроль плану продажів та виручки.",
    landing_industriesDescriptions_tire:
      "Просте відстеження змін майстрів, виручки та завантаженості точки.",
    landing_industriesDescriptions_repair:
      "Контроль завантаженості майстрів, змін і виручки без складних таблиць.",
    landing_industriesDescriptions_hotel:
      "Зміни й завдання ресепшн, виручка та контроль порядку через фотозвіти.",
    landing_industriesDescriptions_photo:
      "Облік змін адміністраторів, бронювань і виручки по змінах.",
  },

  // ru блок оставляешь таким, как у тебя сейчас (он уже полный)
  ru: {
    // ... твой существующий ru-объект без изменений ...
  },
};

export type TranslationTree = typeof TRANSLATIONS.en;
