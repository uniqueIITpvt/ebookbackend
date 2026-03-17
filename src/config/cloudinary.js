import { v2 as cloudinary } from 'cloudinary';
import { config } from './index.js';

/**
 * Cloudinary Configuration
 * Handles file upload and media management configuration
 */
class CloudinaryConfig {
  constructor() {
    this.isConfigured = false;
    this.configure();
  }

  /**
   * Configure Cloudinary with environment variables
   */
  configure() {
    try {
      if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        console.warn('⚠️  Cloudinary configuration missing. File upload features will be disabled.');
        return;
      }

      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true,
      });

      this.isConfigured = true;
      console.log('☁️  Cloudinary configured successfully');
    } catch (error) {
      console.error('❌ Cloudinary configuration failed:', error.message);
    }
  }

  /**
   * Get upload options for different file types
   */
  getUploadOptions(type = 'image', folder = '') {
    const baseOptions = {
      folder: `${config.cloudinary.folder}/${folder}`.replace(/\/+/g, '/'),
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    switch (type) {
      case 'image':
        return {
          ...baseOptions,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto:good',
          fetch_format: 'auto',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
        };

      case 'avatar':
        return {
          ...baseOptions,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto:good',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
        };

      case 'audio':
        return {
          ...baseOptions,
          resource_type: 'video',
          format: 'mp3',
        };

      case 'document':
        return {
          ...baseOptions,
          resource_type: 'raw',
        };

      default:
        return baseOptions;
    }
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(filePath, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary is not configured');
      }

      const result = await cloudinary.uploader.upload(filePath, options);
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          originalName: result.original_filename,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId, resourceType = 'image') {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary is not configured');
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      return {
        success: result.result === 'ok',
        result: result.result,
      };
    } catch (error) {
      console.error('❌ Cloudinary delete failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      cloudName: config.cloudinary.cloudName || 'Not configured',
    };
  }

  /**
   * Health check for Cloudinary service
   */
  async healthCheck() {
    try {
      if (!this.isConfigured) {
        return {
          status: 'disabled',
          message: 'Cloudinary not configured',
        };
      }

      // Simple ping to check if Cloudinary is accessible
      const result = await cloudinary.api.ping();
      
      return {
        status: 'healthy',
        message: 'Cloudinary is accessible',
        response: result.status,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Cloudinary health check failed',
        error: error.message,
      };
    }
  }
}

// Create and export cloudinary instance
const cloudinaryConfig = new CloudinaryConfig();

export default cloudinaryConfig;
