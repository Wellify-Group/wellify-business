/**
 * Скрипт для автоматической генерации недостающих переводов
 * Использует Google Translate API (бесплатный вариант через @vitalets/google-translate-api)
 * 
 * Установка: npm install @vitalets/google-translate-api
 * 
 * Использование:
 * 1. Добавьте недостающие ключи в русскую версию (ru)
 * 2. Запустите: npx tsx scripts/auto-translate.ts
 * 3. Скрипт автоматически заполнит недостающие переводы для en и ua
 */

import { TRANSLATIONS, Language } from '../lib/translations';
import * as fs from 'fs';
import * as path from 'path';

// Функция перевода через Google Translate API
async function translateText(text: string, targetLang: 'en' | 'uk'): Promise<string> {
  try {
    const translate = require('@vitalets/google-translate-api');
    const res = await translate(text, { to: targetLang === 'uk' ? 'uk' : 'en' });
    return res.text;
  } catch (error: any) {
    console.error(`[TRANSLATE ERROR] "${text}" -> ${targetLang}:`, error.message);
    // Возвращаем оригинальный текст при ошибке
    return text;
  }
}

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((o, k) => {
    if (!o[k]) o[k] = {};
    return o[k];
  }, obj);
  target[lastKey] = value;
}

async function main() {
  const sourceLang: Language = 'ru';
  const targetLangs: Language[] = ['en', 'ua'];
  
  const sourceTranslations = TRANSLATIONS[sourceLang];
  const allKeys = getAllKeys(sourceTranslations);
  
  console.log(`📝 Найдено ${allKeys.length} ключей перевода`);
  
  const missing: { en: string[]; ua: string[] } = {
    en: [],
    ua: [],
  };
  
  // Находим недостающие ключи
  for (const key of allKeys) {
    const sourceValue = getNestedValue(sourceTranslations, key);
    if (typeof sourceValue !== 'string') continue;
    
    for (const targetLang of targetLangs) {
      const targetValue = getNestedValue(TRANSLATIONS[targetLang], key);
      if (!targetValue || targetValue === '') {
        missing[targetLang].push(key);
      }
    }
  }
  
  console.log(`\n🔍 Недостающие переводы:`);
  console.log(`  EN: ${missing.en.length} ключей`);
  console.log(`  UA: ${missing.ua.length} ключей`);
  
  if (missing.en.length === 0 && missing.ua.length === 0) {
    console.log('\n✅ Все переводы заполнены!');
    return;
  }
  
  // Генерируем переводы
  const translationsPath = path.join(__dirname, '../lib/translations.ts');
  let translationsContent = fs.readFileSync(translationsPath, 'utf-8');
  
  const updates: Array<{ lang: Language; key: string; value: string; position: number }> = [];
  
  for (const targetLang of targetLangs) {
    if (missing[targetLang].length === 0) continue;
    
    console.log(`\n🌐 Перевожу на ${targetLang.toUpperCase()}...`);
    
    for (let i = 0; i < missing[targetLang].length; i++) {
      const key = missing[targetLang][i];
      const sourceValue = getNestedValue(sourceTranslations, key);
      
      console.log(`  [${i + 1}/${missing[targetLang].length}] ${key}...`);
      const translated = await translateText(sourceValue, targetLang === 'ua' ? 'uk' : 'en');
      
      // Находим позицию для вставки - ищем последнюю строку перед закрывающей скобкой блока языка
      const langKey = targetLang === 'ua' ? 'ua' : targetLang;
      const langBlockRegex = new RegExp(`(\\s+${langKey}:\\s*\\{[\\s\\S]*?)(\\n\\s+\\},)`, 'm');
      const match = translationsContent.match(langBlockRegex);
      
      if (match) {
        const beforeBlock = match[1];
        const indent = '    ';
        const escapedValue = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const newLine = `${indent}${key}: "${escapedValue}",\n`;
        
        // Вставляем перед закрывающей скобкой блока языка
        const insertPosition = match.index! + beforeBlock.length;
        updates.push({
          lang: targetLang,
          key,
          value: newLine,
          position: insertPosition,
        });
      } else {
        console.warn(`  ⚠️  Не удалось найти блок ${langKey} для ключа ${key}`);
      }
      
      // Небольшая задержка, чтобы не перегружать API
      if (i < missing[targetLang].length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  // Применяем все обновления (в обратном порядке, чтобы позиции не сдвигались)
  updates.sort((a, b) => b.position - a.position);
  
  for (const update of updates) {
    translationsContent = 
      translationsContent.slice(0, update.position) + 
      update.value + 
      translationsContent.slice(update.position);
  }
  
  // Сохраняем обновленный файл
  fs.writeFileSync(translationsPath, translationsContent, 'utf-8');
  
  console.log(`\n✅ Переводы сохранены в ${translationsPath}`);
  console.log(`   Обновлено: ${updates.length} ключей`);
}

if (require.main === module) {
  main().catch(console.error);
}

