/**
 * Storage Service
 * Handles file storage operations (currently Supabase Storage)
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';

export class StorageService {
  private bucketName = 'reports'; // Supabase Storage bucket name

  /**
   * Upload file to storage
   */
  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string = 'application/pdf'
  ): Promise<string> {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return data.path;
  }

  /**
   * Get file as buffer
   */
  async getFile(filePath: string): Promise<Buffer> {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error('File not found');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get signed URL for file download (expires in 1 hour by default)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

