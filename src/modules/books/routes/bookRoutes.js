import express from 'express';
// Import book controller
import bookController from '../controllers/bookController.js';
import { uploadBookFiles } from '../../../shared/middleware/fileUpload.js';
// import { validateBookQuery } from '../middleware/validation.js';

const router = express.Router();

/**
 * Book Routes
 * All routes are prefixed with /api/v1/books
 */

// Public routes (no authentication required)

/**
 * @route   GET /api/v1/books
 * @desc    Get all books with filtering and pagination
 * @access  Public
 * @params  ?page=1&limit=10&category=Mental Health&type=Books&featured=true&search=anxiety
 */
router.get('/', bookController.getAllBooks);

/**
 * @route   GET /api/v1/books/featured
 * @desc    Get featured books
 * @access  Public
 * @params  ?limit=5
 */
router.get('/featured', bookController.getFeaturedBooks);

/**
 * @route   GET /api/v1/books/bestsellers
 * @desc    Get bestseller books
 * @access  Public
 * @params  ?limit=10
 */
// Additional book routes
router.get('/bestsellers', bookController.getBestsellerBooks);
router.get('/trending', bookController.getTrendingBooks);
router.get('/summaries/free', bookController.getFreeSummaries);
router.get('/summaries/premium/new', bookController.getNewPremiumSummaries);
router.get('/categories', bookController.getCategories);
router.get('/stats', bookController.getBookStats);
router.get('/search', bookController.searchBooks);

// Admin routes (temporarily without authentication for testing)
// TODO: Add authentication middleware when auth system is ready

/**
 * @route   POST /api/v1/books/test
 * @desc    Test endpoint to verify POST is working
 * @access  Public
 */
router.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'POST endpoint is working',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/v1/books
 * @desc    Create a new book with file uploads
 * @access  Admin (temporarily public for testing)
 */
// CRUD operations
router.post('/', uploadBookFiles, bookController.createBook);
router.get('/category/:category', bookController.getBooksByCategory);
router.get('/:identifier', bookController.getBook);
router.put('/:id', uploadBookFiles, bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

// File management endpoints
/**
 * @route   POST /api/v1/books/:id/files/ebook
 * @desc    Upload or update e-book file for existing book
 * @access  Admin
 */
router.post('/:id/files/ebook', uploadBookFiles, bookController.updateBook);

/**
 * @route   POST /api/v1/books/:id/files/audiobook
 * @desc    Upload or update audiobook file for existing book
 * @access  Admin
 */
router.post('/:id/files/audiobook', uploadBookFiles, bookController.updateBook);

/**
 * @route   DELETE /api/v1/books/:id/files/ebook
 * @desc    Remove e-book file from book
 * @access  Admin
 */
router.delete('/:id/files/ebook', bookController.removeEbookFile);

/**
 * @route   DELETE /api/v1/books/:id/files/audiobook
 * @desc    Remove audiobook file from book
 * @access  Admin
 */
router.delete('/:id/files/audiobook', bookController.removeAudiobookFile);

export default router;
