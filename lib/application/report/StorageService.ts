/**
 * Storage Service
 * Handles file storage operations (currently Supabase Storage)
 */

// TODO: This file needs to be migrated to use backend API
// import { createAdminSupabaseClient } from '@/lib/supabase/admin';

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
    // TODO: Migrate to backend API
    throw new Error('This function is deprecated and needs to be migrated to use backend API');
    
    /* OLD CODE - REMOVED
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
    */ // END OLD CODE
  }

  /**
   * Get file as buffer
   */
  async getFile(filePath: string): Promise<Buffer> {
    // TODO: Migrate to backend API
    throw new Error('This function is deprecated and needs to be migrated to use backend API');
    
    /* OLD CODE - REMOVED
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
    */ // END OLD CODE
  }

  /**
   * Get signed URL for file download (expires in 1 hour by default)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    // TODO: Migrate to backend API
    throw new Error('This function is deprecated and needs to be migrated to use backend API');
    
    /* OLD CODE - REMOVED
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
    */ // END OLD CODE
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    // TODO: Migrate to backend API
    throw new Error('This function is deprecated and needs to be migrated to use backend API');
    
    /* OLD CODE - REMOVED
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    */ // END OLD CODE
  }
}

