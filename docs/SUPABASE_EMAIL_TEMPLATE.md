# Настройка Email Template в Supabase

## Изменение фона письма подтверждения email

Чтобы изменить фон письма подтверждения email, нужно настроить шаблон в Supabase Dashboard.

### Инструкция:

1. Перейдите в **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Выберите шаблон **"Confirm signup"** (или "Magic Link" для подтверждения email)
3. Замените HTML-шаблон на кастомный (см. ниже)

### Кастомный шаблон с белым фоном (для темного приложения):

```html
<h2>Подтверждение e-mail</h2>

<p>Вы начали регистрацию в системе управления сменами WELLIFY business.</p>

<p>Чтобы завершить регистрацию и войти в систему, нажмите кнопку ниже.</p>

<p><a href="{{ .ConfirmationURL }}">Подтвердить e-mail</a></p>

<p>Если кнопка не работает, скопируйте и вставьте эту ссылку в адресную строку браузера:</p>

<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

<p>Если вы не регистрировались в WELLIFY business, просто проигнорируйте это письмо.</p>
```

### Кастомный шаблон с темным фоном (для светлого приложения):

```html
<div style="background-color: #050816; color: #ffffff; padding: 20px; font-family: Arial, sans-serif;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="background-color: #3b82f6; color: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin-bottom: 20px;">
      W
    </div>
    <h1 style="color: #ffffff; margin: 0;">WELLIFY BUSINESS</h1>
  </div>
  
  <h2 style="color: #ffffff;">Подтверждение e-mail</h2>
  
  <p style="color: #e5e7eb;">Вы начали регистрацию в системе управления сменами WELLIFY business.</p>
  
  <p style="color: #e5e7eb;">Чтобы завершить регистрацию и войти в систему, нажмите кнопку ниже.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
      Подтвердить e-mail
    </a>
  </div>
  
  <p style="color: #9ca3af; font-size: 14px;">Если кнопка не работает, скопируйте и вставьте эту ссылку в адресную строку браузера:</p>
  
  <p style="color: #3b82f6; font-size: 12px; word-break: break-all;">
    <a href="{{ .ConfirmationURL }}" style="color: #3b82f6;">{{ .ConfirmationURL }}</a>
  </p>
  
  <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
    Если вы не регистрировались в WELLIFY business, просто проигнорируйте это письмо.
  </p>
</div>
```

### Важно:

- `{{ .ConfirmationURL }}` - это переменная Supabase, которая автоматически заменяется на реальную ссылку
- Фон письма должен соответствовать фону приложения (темный фон для темного приложения, светлый для светлого)
- После изменения шаблона в Dashboard, новые письма будут отправляться с обновленным дизайном

