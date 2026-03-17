import express from 'express';
import {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  getMe,
  getUsers,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('🔐 Setting up auth routes...');

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
  });
});
console.log('  ✅ GET /test');

// Public routes
router.post('/register', register);
console.log('  ✅ POST /register');

router.post('/login', login);
console.log('  ✅ POST /login');

router.post('/refresh-token', refreshToken);
console.log('  ✅ POST /refresh-token');

router.post('/forgot-password', forgotPassword);
console.log('  ✅ POST /forgot-password');

router.post('/reset-password/:resetToken', resetPassword);
console.log('  ✅ POST /reset-password/:resetToken');

router.get('/verify-email/:token', verifyEmail);
console.log('  ✅ GET /verify-email/:token');

// Protected routes (require authentication)
router.use(protect); // All routes below this require authentication

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.post('/resend-verification', resendVerification);

// Admin only routes
router.post('/register-admin', authorize('admin', 'superadmin'), register);
router.get('/users', authorize('admin', 'superadmin'), getUsers);

export default router;
