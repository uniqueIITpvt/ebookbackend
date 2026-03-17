import express from 'express';
import blogController from '../controllers/blogController.js';
import { 
  validateBlogQuery, 
  validateBlogSearch, 
  validateBlogIdentifier,
  validateBlogCreate,
  validateBlogUpdate,
  validateBlogId,
  validateEngagementTracking
} from '../middleware/validation.js';
import { uploadBlogImage, uploadBlogImageFields } from '../middleware/fileUpload.js';

const router = express.Router();

/**
 * Blog Routes
 * All routes are prefixed with /api/v1/blogs
 */

// Public routes (no authentication required)

/**
 * @route   GET /api/v1/blogs
 * @desc    Get all blogs with filtering and pagination
 * @access  Public
 * @params  ?page=1&limit=10&category=General Health&author=Dr. Syed M Quadri&featured=true&search=diabetes&adminView=true
 */
router.get('/', validateBlogQuery, blogController.getAllBlogs);

/**
 * @route   GET /api/v1/blogs/featured
 * @desc    Get featured blog(s)
 * @access  Public
 * @params  ?limit=1
 */
router.get('/featured', blogController.getFeaturedBlog);

/**
 * @route   GET /api/v1/blogs/latest
 * @desc    Get latest blogs
 * @access  Public
 * @params  ?limit=10
 */
router.get('/latest', blogController.getLatestBlogs);

/**
 * @route   GET /api/v1/blogs/categories
 * @desc    Get all blog categories with counts
 * @access  Public
 */
router.get('/categories', blogController.getCategories);

/**
 * @route   GET /api/v1/blogs/stats
 * @desc    Get blog statistics
 * @access  Public
 */
router.get('/stats', blogController.getBlogStats);

/**
 * @route   GET /api/v1/blogs/search
 * @desc    Search blogs by query
 * @access  Public
 * @params  ?q=diabetes&category=General Health&author=Dr. Syed M Quadri
 */
router.get('/search', validateBlogSearch, blogController.searchBlogs);

/**
 * @route   GET /api/v1/blogs/category/:category
 * @desc    Get blogs by category
 * @access  Public
 * @params  category - Category name (e.g., "General Health", "Mental Health")
 */
router.get('/category/:category', blogController.getBlogsByCategory);

/**
 * @route   GET /api/v1/blogs/author/:author
 * @desc    Get blogs by author
 * @access  Public
 * @params  author - Author name (e.g., "Dr. Syed M Quadri")
 */
router.get('/author/:author', blogController.getBlogsByAuthor);

/**
 * @route   POST /api/v1/blogs/:identifier/track
 * @desc    Track blog engagement (view, like, share, read)
 * @access  Public
 * @params  identifier - Blog ID (ObjectId) or slug
 * @body    { action: 'view|like|share|read', readTime?: number, completed?: boolean, platform?: string }
 */
router.post('/:identifier/track', validateBlogIdentifier, validateEngagementTracking, blogController.trackEngagement);

/**
 * @route   GET /api/v1/blogs/:identifier
 * @desc    Get single blog by ID or slug
 * @access  Public
 * @params  identifier - Blog ID (ObjectId) or slug
 */
router.get('/:identifier', validateBlogIdentifier, blogController.getBlog);

// Protected routes (authentication required) - Temporarily without auth for testing
// TODO: Add authentication middleware when auth system is ready

/**
 * @route   POST /api/v1/blogs
 * @desc    Create a new blog with optional image upload
 * @access  Admin (temporarily public for testing)
 */
router.post('/', uploadBlogImage, validateBlogCreate, blogController.createBlog);

/**
 * @route   PUT /api/v1/blogs/:id
 * @desc    Update blog with optional image upload
 * @access  Admin (temporarily public for testing)
 */
router.put('/:id', uploadBlogImage, validateBlogId, validateBlogUpdate, blogController.updateBlog);

/**
 * @route   DELETE /api/v1/blogs/:id
 * @desc    Delete blog and associated image
 * @access  Admin (temporarily public for testing)
 */
router.delete('/:id', validateBlogId, blogController.deleteBlog);

/**
 * @route   POST /api/v1/blogs/seed
 * @desc    Seed database from blogs.json
 * @access  Admin (temporarily public for testing)
 */
router.post('/seed', blogController.seedBlogs);

export default router;
