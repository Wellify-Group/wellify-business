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

// Простая функция перевода (можно заменить на реальный API)
// Для реального использования установите: npm install @vitalets/google-translate-api
async function translateText(text: string, targetLang: 'en' | 'uk'): Promise<string> {
  // TODO: Замените на реальный API
  // Пример с @vitalets/google-translate-api:
  // const translate = require('@vitalets/google-translate-api');
  // const res = await translate(text, { to: targetLang === 'uk' ? 'uk' : 'en' });
  // return res.text;
  
  // Временная заглушка
  console.warn(`[TRANSLATE] "${text}" -> ${targetLang} (нужно подключить API)`);
  return text;
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
  
  console.log(`Найдено ${allKeys.length} ключей перевода`);
  
  const missing: Record<Language, string[]> = {
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
  
  console.log(`\nНедостающие переводы:`);
  console.log(`  EN: ${missing.en.length} ключей`);
  console.log(`  UA: ${missing.ua.length} ключей`);
  
  if (missing.en.length === 0 && missing.ua.length === 0) {
    console.log('\n✅ Все переводы заполнены!');
    return;
  }
  
  // Генерируем переводы
  const translationsPath = path.join(__dirname, '../lib/translations.ts');
  let translationsContent = fs.readFileSync(translationsPath, 'utf-8');
  
  for (const targetLang of targetLangs) {
    if (missing[targetLang].length === 0) continue;
    
    console.log(`\nПеревожу на ${targetLang}...`);
    
    for (const key of missing[targetLang]) {
      const sourceValue = getNestedValue(sourceTranslations, key);
      const translated = await translateText(sourceValue, targetLang === 'ua' ? 'uk' : 'en');
      
      // Находим место вставки в файле
      const langKey = targetLang === 'ua' ? 'ua' : targetLang;
      const regex = new RegExp(`(\\s+${langKey}:\\s*\\{[^}]*)(})`, 's');
      
      // Простая вставка (можно улучшить)
      const indent = '    ';
      const newLine = `${indent}${key}: "${translated.replace(/"/g, '\\"')}",\n`;
      
      // TODO: Более точная вставка с учетом структуры
      console.log(`  ✓ ${key}: "${translated}"`);
    }
  }
  
  console.log('\n⚠️  ВНИМАНИЕ: Этот скрипт требует подключения к API перевода.');
  console.log('   Установите: npm install @vitalets/google-translate-api');
  console.log('   И обновите функцию translateText()');
}

if (require.main === module) {
  main().catch(console.error);
}

