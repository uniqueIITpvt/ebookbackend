import express from 'express';
import categoryController from '../controllers/categoryController.js';

const router = express.Router();

/**
 * Category Routes
 * All routes are prefixed with /api/v1/categories
 */

// Public routes

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with optional filters
 * @access  Public
 * @params  ?includeInactive=false&sortBy=sortOrder&withBookCount=false
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/v1/categories/stats
 * @desc    Get category statistics
 * @access  Public
 */
router.get('/stats', categoryController.getCategoryStats);

/**
 * @route   GET /api/v1/categories/:identifier
 * @desc    Get single category by ID or slug
 * @access  Public
 */
router.get('/:identifier', categoryController.getCategory);

// Admin routes (temporarily without authentication for testing)

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Admin (temporarily public for testing)
 */
router.post('/', categoryController.createCategory);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update a category
 * @access  Admin (temporarily public for testing)
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @route   PUT /api/v1/categories/reorder
 * @desc    Reorder categories
 * @access  Admin (temporarily public for testing)
 */
router.put('/reorder', categoryController.reorderCategories);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete a category
 * @access  Admin (temporarily public for testing)
 * @body    { moveToCategory?: string } - Optional category ID to move books to
 */
router.delete('/:id', categoryController.deleteCategory);

export default router;
