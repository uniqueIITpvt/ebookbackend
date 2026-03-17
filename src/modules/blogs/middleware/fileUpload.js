import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { AppError } from '../../../shared/middleware/errorHandler.js';

// Configure Cloudinary - will be undefined if env vars not set
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * File type validation for blog images
 */
const blogImageFileFilter = (req, file, cb) => {
  // Define allowed image types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  
  // Check file type
  if (file.fieldname === 'image' || file.fieldname === 'coverImage') {
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed', 400), false);
    }
  } else {
    cb(new AppError('Invalid file field', 400), false);
  }
};

/**
 * Upload blog image to Cloudinary
 */
const uploadBlogImageToCloudinary = async (file, blogTitle = 'blog') => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const safeBlogTitle = blogTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    const uploadOptions = {
      resource_type: 'image',
      folder: 'dr-quadri/blogs',
      transformation: [
        { width: 1200, height: 630, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }
      ],
      public_id: `blog-${safeBlogTitle}-${timestamp}`
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Process uploaded blog image - upload to Cloudinary or convert to base64
 */
const processBlogImageUpload = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const blogTitle = req.body.title || 'untitled-blog';
    let imageFile = null;

    // Handle both single file and multiple files
    if (req.file) {
      imageFile = req.file;
    } else if (req.files) {
      if (req.files.image && req.files.image[0]) {
        imageFile = req.files.image[0];
      } else if (req.files.coverImage && req.files.coverImage[0]) {
        imageFile = req.files.coverImage[0];
      }
    }

    if (!imageFile) {
      return next();
    }

    // Validate file size (10MB max)
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new AppError('Image file size cannot exceed 10MB', 400);
    }

    console.log('📤 Processing blog image:', imageFile.originalname, 'Cloudinary configured:', cloudinaryConfigured);

    if (!cloudinaryConfigured) {
      // Convert to base64 data URL when Cloudinary is not configured
      const base64Url = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
      console.log('Converting blog image to base64, length:', base64Url.length);
      
      req.uploadedFiles = {
        image: {
          url: base64Url,
          publicId: null,
          originalName: imageFile.originalname,
          fileSize: imageFile.size,
          mimeType: imageFile.mimetype,
          width: null,
          height: null
        }
      };
      console.log('✅ Blog image converted to base64 successfully');
      return next();
    }

    // Upload to Cloudinary
    console.log('📤 Uploading blog image to Cloudinary:', imageFile.originalname);
    const result = await uploadBlogImageToCloudinary(imageFile, blogTitle);
    console.log('✅ Blog image uploaded to Cloudinary:', result.secure_url);

    // Attach file results to request
    req.uploadedFiles = {
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: imageFile.originalname,
        fileSize: imageFile.size,
        mimeType: imageFile.mimetype,
        width: result.width,
        height: result.height
      }
    };

    next();
  } catch (error) {
    console.error('Blog image upload error:', error);
    next(error);
  }
};

/**
 * Create multer upload middleware for blog images
 */
const createBlogImageUploadMiddleware = () => {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: blogImageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1, // Max 1 file
      fieldSize: 10 * 1024 * 1024, // 10MB field size for base64 handling
      fieldNameSize: 100,
      fields: 20,
      parts: 25
    }
  });
};

/**
 * Delete blog image from Cloudinary
 */
const deleteBlogImageFromCloudinary = async (publicId) => {
  // Skip deletion if Cloudinary is not configured
  if (!cloudinaryConfigured) {
    console.log('Cloudinary not configured, skipping deletion for:', publicId);
    return { result: 'not_configured' };
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    console.log('🗑️ Deleted blog image from Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('Error deleting blog image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Main upload middleware for blog images
 */
const uploadBlogImage = [
  createBlogImageUploadMiddleware().single('image'),
  processBlogImageUpload
];

/**
 * Alternative upload middleware for multiple field names
 */
const uploadBlogImageFields = [
  createBlogImageUploadMiddleware().fields([
    { name: 'image', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  processBlogImageUpload
];

export {
  uploadBlogImage,
  uploadBlogImageFields,
  uploadBlogImageToCloudinary,
  deleteBlogImageFromCloudinary,
  processBlogImageUpload,
  cloudinary
};
