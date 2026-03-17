import express from 'express';
import trendingBookController from '../controllers/trendingBookController.js';
import { uploadBlogImage } from '../../blogs/middleware/fileUpload.js';

const router = express.Router();

// Public routes
router.get('/', trendingBookController.getAllTrendingBooks);
router.get('/featured', trendingBookController.getFeaturedTrendingBooks);
router.get('/top', trendingBookController.getTopTrending);
router.get('/categories', trendingBookController.getCategories);
router.get('/:id', trendingBookController.getTrendingBook);

// Protected admin routes
router.post('/', uploadBlogImage, trendingBookController.createTrendingBook);
router.put('/:id', uploadBlogImage, trendingBookController.updateTrendingBook);
router.delete('/:id', trendingBookController.deleteTrendingBook);

export default router;
