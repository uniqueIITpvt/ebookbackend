import express from 'express';
import freeSummaryController from '../controllers/freeSummaryController.js';
import { uploadBlogImage } from '../../blogs/middleware/fileUpload.js';

const router = express.Router();

// Public routes
router.get('/', freeSummaryController.getAllFreeSummaries);
router.get('/featured', freeSummaryController.getFeaturedFreeSummaries);
router.get('/categories', freeSummaryController.getCategories);
router.get('/:id', freeSummaryController.getFreeSummary);

// Protected admin routes
router.post('/', uploadBlogImage, freeSummaryController.createFreeSummary);
router.put('/:id', uploadBlogImage, freeSummaryController.updateFreeSummary);
router.delete('/:id', freeSummaryController.deleteFreeSummary);

export default router;
