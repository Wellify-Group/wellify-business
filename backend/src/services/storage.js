/**
 * Cloudflare R2 Storage Service
 * Использует AWS S3 SDK (R2 совместим с S3 API)
 * 
 * Для загрузки файлов в Cloudflare R2
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger.js';

/**
 * Создать S3 клиент для R2
 */
function createR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 configuration missing. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region: 'auto', // R2 использует 'auto' для region
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Storage Service для работы с R2
 */
class StorageService {
  constructor() {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    if (!this.bucketName) {
      throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not set');
    }
    
    try {
      this.client = createR2Client();
      logger.info('R2 storage client initialized');
    } catch (error) {
      logger.error('Failed to initialize R2 client', error);
      throw error;
    }
  }

  /**
   * Загрузить файл в R2
   * @param {string} key - Путь к файлу в bucket (например: 'avatars/user123.jpg')
   * @param {Buffer|string} body - Содержимое файла
   * @param {string} contentType - MIME тип файла (например: 'image/jpeg')
   * @param {object} metadata - Дополнительные метаданные
   * @returns {Promise<object>} Результат загрузки
   */
  async uploadFile(key, body, contentType, metadata = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      });

      const result = await this.client.send(command);
      
      // Формируем публичный URL (если bucket настроен на публичный доступ)
      const publicUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${this.bucketName}/${key}`;
      
      logger.info('File uploaded to R2', { key, etag: result.ETag });
      
      return {
        success: true,
        key,
        etag: result.ETag,
        publicUrl,
      };
    } catch (error) {
      logger.error('R2 upload error', { error, key });
      throw error;
    }
  }

  /**
   * Получить файл из R2
   * @param {string} key - Путь к файлу
   * @returns {Promise<Buffer>} Содержимое файла
   */
  async getFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('R2 get file error', { error, key });
      throw error;
    }
  }

  /**
   * Удалить файл из R2
   * @param {string} key - Путь к файлу
   * @returns {Promise<boolean>} Успешность удаления
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      logger.info('File deleted from R2', { key });
      return true;
    } catch (error) {
      logger.error('R2 delete file error', { error, key });
      throw error;
    }
  }

  /**
   * Получить список файлов в директории
   * @param {string} prefix - Префикс пути (например: 'avatars/')
   * @returns {Promise<Array>} Список файлов
   */
  async listFiles(prefix = '') {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      return response.Contents || [];
    } catch (error) {
      logger.error('R2 list files error', { error, prefix });
      throw error;
    }
  }

  /**
   * Получить временный подписанный URL для доступа к файлу
   * @param {string} key - Путь к файлу
   * @param {number} expiresIn - Время жизни URL в секундах (по умолчанию 1 час)
   * @returns {Promise<string>} Подписанный URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('R2 get signed URL error', { error, key });
      throw error;
    }
  }
}

// Экспортируем singleton instance
let storageService = null;

export function getStorageService() {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}

export default StorageService;
