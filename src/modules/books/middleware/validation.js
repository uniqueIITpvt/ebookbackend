import { body, query, param, validationResult } from 'express-validator';
import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Validation middleware for book operations
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    throw new AppError('Validation failed', 400, errorMessages);
  }
  next();
};

/**
 * Validate book query parameters
 */
export const validateBookQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
    
  query('type')
    .optional()
    .isIn(['Books', 'Audiobook'])
    .withMessage('Type must be either "Books" or "Audiobook"'),
    
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),
    
  query('bestseller')
    .optional()
    .isBoolean()
    .withMessage('Bestseller must be a boolean value'),
    
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
    
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'rating', 'popular', 'price-low', 'price-high', 'relevance'])
    .withMessage('Invalid sort option'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
    
  handleValidationErrors
];

/**
 * Validate book search parameters
 */
export const validateBookSearch = [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query is required and must be between 2 and 100 characters'),
    
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
    
  query('type')
    .optional()
    .isIn(['Books', 'Audiobook'])
    .withMessage('Type must be either "Books" or "Audiobook"'),
    
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  handleValidationErrors
];

/**
 * Validate book identifier parameter
 */
export const validateBookIdentifier = [
  param('identifier')
    .notEmpty()
    .trim()
    .custom((value) => {
      // Check if it's a valid ObjectId or a valid slug
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      const slugRegex = /^[a-z0-9-]+$/;
      
      if (!objectIdRegex.test(value) && !slugRegex.test(value)) {
        throw new Error('Invalid book identifier. Must be a valid ID or slug.');
      }
      
      return true;
    }),
    
  handleValidationErrors
];

/**
 * Validate category parameter
 */
export const validateCategoryParam = [
  param('category')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s&-]+$/)
    .withMessage('Category can only contain letters, spaces, hyphens, and ampersands'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  handleValidationErrors
];

/**
 * Validate book creation data (for admin use later)
 */
export const validateBookCreation = [
  body('title')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title is required and must be between 2 and 200 characters'),
    
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Subtitle must not exceed 300 characters'),
    
  body('author')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author is required and must be between 2 and 100 characters'),
    
  body('description')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description is required and must be between 10 and 2000 characters'),
    
  body('category')
    .notEmpty()
    .isIn([
      'Mental Health',
      'Psychology',
      'Health & Wellness',
      'Self-Help',
      'Medical',
      'Psychiatry',
      'Therapy',
      'Nutrition',
      'Lifestyle',
      'General Health'
    ])
    .withMessage('Invalid category'),
    
  body('type')
    .notEmpty()
    .isIn(['Books', 'Audiobook'])
    .withMessage('Type must be either "Books" or "Audiobook"'),
    
  body('price')
    .notEmpty()
    .trim()
    .matches(/^\$?[0-9]+\.?[0-9]*$/)
    .withMessage('Price must be a valid price format (e.g., $24.99 or 24.99)'),
    
  body('originalPrice')
    .optional()
    .trim()
    .matches(/^\$?[0-9]+\.?[0-9]*$/)
    .withMessage('Original price must be a valid price format'),
    
  body('pages')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pages must be a positive integer'),
    
  body('duration')
    .optional()
    .trim()
    .matches(/^[0-9]+:[0-5][0-9]$/)
    .withMessage('Duration must be in format HH:MM (e.g., 2:30)'),
    
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Invalid ISBN format'),
    
  body('format')
    .optional()
    .isArray()
    .withMessage('Format must be an array')
    .custom((formats) => {
      const validFormats = ['Hardcover', 'Paperback', 'E-book', 'Audiobook', 'PDF', 'Digital Download'];
      return formats.every(format => validFormats.includes(format));
    })
    .withMessage('Invalid format options'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0);
    })
    .withMessage('All tags must be non-empty strings'),
    
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),
    
  body('bestseller')
    .optional()
    .isBoolean()
    .withMessage('Bestseller must be a boolean value'),
    
  handleValidationErrors
];

/**
 * Validate book update data (for admin use later)
 */
export const validateBookUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
    
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Subtitle must not exceed 300 characters'),
    
  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author must be between 2 and 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
    
  body('category')
    .optional()
    .isIn([
      'Mental Health',
      'Psychology',
      'Health & Wellness',
      'Self-Help',
      'Medical',
      'Psychiatry',
      'Therapy',
      'Nutrition',
      'Lifestyle',
      'General Health'
    ])
    .withMessage('Invalid category'),
    
  body('type')
    .optional()
    .isIn(['Books', 'Audiobook'])
    .withMessage('Type must be either "Books" or "Audiobook"'),
    
  body('price')
    .optional()
    .trim()
    .matches(/^\$?[0-9]+\.?[0-9]*$/)
    .withMessage('Price must be a valid price format'),
    
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),
    
  body('bestseller')
    .optional()
    .isBoolean()
    .withMessage('Bestseller must be a boolean value'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
    
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
    
  handleValidationErrors
];

export { handleValidationErrors };
