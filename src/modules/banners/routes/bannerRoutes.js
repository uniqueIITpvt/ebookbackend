import express from 'express';
import bannerController from '../controllers/bannerController.js';
import { protect, authorize } from '../../auth/middleware/authMiddleware.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', bannerController.getActiveBanners);
router.get('/position/:position', bannerController.getActiveBannersByPosition);
router.get('/:id', bannerController.getBannerById);

// Admin routes - require authentication and admin role
router.get('/admin/all', protect, authorize('admin', 'superadmin'), bannerController.getAllBanners);
router.post('/', protect, authorize('admin', 'superadmin'), bannerController.createBanner);
router.put('/:id', protect, authorize('admin', 'superadmin'), bannerController.updateBanner);
router.delete('/:id', protect, authorize('admin', 'superadmin'), bannerController.deleteBanner);

export default router;
