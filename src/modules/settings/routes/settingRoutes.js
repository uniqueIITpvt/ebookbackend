import express from 'express';
import settingController from '../controllers/settingController.js';
import { protect, authorize } from '../../auth/middleware/authMiddleware.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/public', settingController.getPublicSettings);
router.get('/value/:key', settingController.getSettingValue);

// Protected routes - require authentication
router.get('/', protect, authorize('admin', 'superadmin'), settingController.getAllSettings);
router.get('/:id', protect, authorize('admin', 'superadmin'), settingController.getSettingByKey);
router.post('/', protect, authorize('admin', 'superadmin'), settingController.createSetting);
router.put('/:id', protect, authorize('admin', 'superadmin'), settingController.updateSetting);
router.put('/key/:key', protect, authorize('admin', 'superadmin'), settingController.updateSettingByKey);
router.delete('/:id', protect, authorize('admin', 'superadmin'), settingController.deleteSetting);
router.post('/bulk', protect, authorize('admin', 'superadmin'), settingController.bulkUpdateSettings);

export default router;
