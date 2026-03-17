import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Validate blog query parameters
 */
export const validateBlogQuery = (req, res, next) => {
  const { page, limit, sortBy } = req.query;

  // Validate page
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return next(new AppError('Page must be a positive number', 400));
  }

  // Validate limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }

  // Validate sortBy
  const validSortOptions = ['latest', 'oldest', 'popular', 'title', 'relevance'];
  if (sortBy && !validSortOptions.includes(sortBy)) {
    return next(new AppError(`Invalid sort option. Valid options: ${validSortOptions.join(', ')}`, 400));
  }

  next();
};

/**
 * Validate blog search parameters
 */
export const validateBlogSearch = (req, res, next) => {
  const { q: query, page, limit } = req.query;

  // Validate search query
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return next(new AppError('Search query must be at least 2 characters long', 400));
  }

  // Validate page
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return next(new AppError('Page must be a positive number', 400));
  }

  // Validate limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }

  next();
};

/**
 * Validate blog identifier (ID or slug)
 */
export const validateBlogIdentifier = (req, res, next) => {
  const { identifier } = req.params;

  if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
    return next(new AppError('Invalid blog identifier', 400));
  }

  next();
};

/**
 * Strip HTML tags for validation
 * Also decodes HTML entities and removes extra whitespace
 */
const stripHtmlTags = (html) => {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  
  // Remove extra whitespace and trim
  return text.replace(/\s+/g, ' ').trim();
};

/**
 * Validate blog creation data
 */
export const validateBlogCreate = (req, res, next) => {
  const { title, excerpt, content, category } = req.body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return next(new AppError('Title is required and must be at least 3 characters long', 400));
  }

  // Excerpt is plain text, content is HTML
  const contentPlainText = stripHtmlTags(content);

  // Log for debugging
  console.log('Validation - Excerpt length:', excerpt?.length);
  console.log('Validation - Content length (plain):', contentPlainText.length);

  if (!excerpt || typeof excerpt !== 'string' || excerpt.trim().length < 10) {
    return next(new AppError(`Excerpt is required and must be at least 10 characters long. Current: ${excerpt?.length || 0} chars`, 400));
  }

  if (!content || typeof content !== 'string' || contentPlainText.length < 50) {
    return next(new AppError(`Content is required and must be at least 50 characters long (plain text). Current: ${contentPlainText.length} chars`, 400));
  }

  if (!category || typeof category !== 'string' || category.trim().length < 2) {
    return next(new AppError('Category is required', 400));
  }

  // Validate title length
  if (title.length > 200) {
    return next(new AppError('Title cannot exceed 200 characters', 400));
  }

  // Validate excerpt length (plain text)
  if (excerpt.length > 500) {
    return next(new AppError('Excerpt cannot exceed 500 characters', 400));
  }

  // Validate content length (plain text)
  if (contentPlainText.length > 50000) {
    return next(new AppError('Content cannot exceed 50000 characters', 400));
  }

  next();
};

/**
 * Validate blog update data
 */
export const validateBlogUpdate = (req, res, next) => {
  const { title, excerpt, content, category } = req.body;

  // Validate fields if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      return next(new AppError('Title must be at least 3 characters long', 400));
    }
    if (title.length > 200) {
      return next(new AppError('Title cannot exceed 200 characters', 400));
    }
  }

  if (excerpt !== undefined) {
    if (typeof excerpt !== 'string' || excerpt.trim().length < 10) {
      return next(new AppError('Excerpt must be at least 10 characters long', 400));
    }
    if (excerpt.length > 500) {
      return next(new AppError('Excerpt cannot exceed 500 characters', 400));
    }
  }

  if (content !== undefined) {
    const contentPlainText = stripHtmlTags(content);
    if (typeof content !== 'string' || contentPlainText.length < 50) {
      return next(new AppError('Content must be at least 50 characters long (plain text)', 400));
    }
    if (contentPlainText.length > 50000) {
      return next(new AppError('Content cannot exceed 50000 characters (plain text)', 400));
    }
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim().length < 2) {
      return next(new AppError('Category must be at least 2 characters long', 400));
    }
  }

  next();
};

/**
 * Validate blog ID parameter
 */
export const validateBlogId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new AppError('Invalid blog ID format', 400));
  }

  next();
};

/**
 * Validate engagement tracking data
 */
export const validateEngagementTracking = (req, res, next) => {
  const { action, readTime, platform } = req.body;

  const validActions = ['view', 'like', 'share', 'read'];
  if (!action || !validActions.includes(action)) {
    return next(new AppError(`Invalid action. Valid actions: ${validActions.join(', ')}`, 400));
  }

  if (action === 'read' && readTime !== undefined) {
    if (isNaN(readTime) || parseInt(readTime) < 0) {
      return next(new AppError('Read time must be a positive number', 400));
    }
  }

  if (action === 'share' && platform) {
    const validPlatforms = ['facebook', 'twitter', 'linkedin', 'email'];
    if (!validPlatforms.includes(platform)) {
      return next(new AppError(`Invalid platform. Valid platforms: ${validPlatforms.join(', ')}`, 400));
    }
  }

  next();
};
