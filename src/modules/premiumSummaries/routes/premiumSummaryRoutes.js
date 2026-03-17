import express from 'express';
import premiumSummaryController from '../controllers/premiumSummaryController.js';
import { uploadBlogImage } from '../../blogs/middleware/fileUpload.js';

const router = express.Router();

// Public routes
router.get('/', premiumSummaryController.getAllPremiumSummaries);
router.get('/featured', premiumSummaryController.getFeaturedPremiumSummaries);
router.get('/latest', premiumSummaryController.getLatestPremiumSummaries);
router.get('/categories', premiumSummaryController.getCategories);
router.get('/:id', premiumSummaryController.getPremiumSummary);

// Protected admin routes
router.post('/', uploadBlogImage, premiumSummaryController.createPremiumSummary);
router.put('/:id', uploadBlogImage, premiumSummaryController.updatePremiumSummary);
router.delete('/:id', premiumSummaryController.deletePremiumSummary);

export default router;
