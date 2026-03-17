import express from 'express';

const router = express.Router();

// Import module routes
import bookRoutes from '../../modules/books/routes/bookRoutes.js';
import categoryRoutes from '../../modules/books/routes/categoryRoutes.js';
import audiobookRoutes from '../../modules/audiobooks/routes/audiobookRoutes.js';
import blogRoutes from '../../modules/blogs/routes/blogRoutes.js';
import authRoutes from '../../modules/auth/routes/authRoutes.js';
import freeSummaryRoutes from '../../modules/freeSummaries/routes/freeSummaryRoutes.js';
import trendingBookRoutes from '../../modules/trendingBooks/routes/trendingBookRoutes.js';
import premiumSummaryRoutes from '../../modules/premiumSummaries/routes/premiumSummaryRoutes.js';
import bannerRoutes from '../../modules/banners/routes/bannerRoutes.js';
import settingRoutes from '../../modules/settings/routes/settingRoutes.js';
import uploadRoutes from '../../modules/upload/routes/uploadRoutes.js';
// import contactRoutes from '../../modules/contact/routes/contactRoutes.js';

// API v1 routes
router.get('/', (req, res) => {
  console.log('📍 API v1 root route hit');
  res.json({
    message: 'uniqueIIT Research Center API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      books: '/books',
      categories: '/categories',
      blogs: '/blogs',
      freeSummaries: '/free-summaries',
      trendingBooks: '/trending-books',
      premiumSummaries: '/premium-summaries',
      banners: '/banners',
      settings: '/settings',
      contact: '/contact',
      media: '/media',
      analytics: '/analytics',
    },
    status: 'active',
    timestamp: new Date().toISOString(),
  });
});

// Simple test route
router.get('/test', (req, res) => {
  console.log('📍 API v1 test route hit');
  res.json({
    message: 'API v1 test route working',
    timestamp: new Date().toISOString(),
  });
});

// Debug route to test if v1 router is working
router.get('/debug', (req, res) => {
  console.log('🐛 Debug route hit!');
  res.json({
    message: 'V1 Router is working!',
    timestamp: new Date().toISOString(),
  });
});

// Module routes with debugging
console.log('🔧 Loading books routes...');
router.use('/books', bookRoutes);
console.log('✅ Books routes loaded');

console.log('🔧 Loading audiobooks routes...');
router.use('/audiobooks', audiobookRoutes);
console.log('✅ Audiobooks routes loaded');

console.log('🔧 Loading category routes...');
router.use('/categories', categoryRoutes);
console.log('✅ Category routes loaded');

console.log('🔧 Loading blog routes...');
router.use('/blogs', blogRoutes);
console.log('✅ Blog routes loaded');

console.log('🔧 Loading auth routes...');
router.use('/auth', authRoutes);
console.log('✅ Auth routes loaded');

console.log('🔧 Loading free summaries routes...');
router.use('/free-summaries', freeSummaryRoutes);
console.log('✅ Free summaries routes loaded');

console.log('🔧 Loading trending books routes...');
router.use('/trending-books', trendingBookRoutes);
console.log('✅ Trending books routes loaded');

console.log('🔧 Loading premium summaries routes...');
router.use('/premium-summaries', premiumSummaryRoutes);
console.log('✅ Premium summaries routes loaded');

console.log('🔧 Loading banner routes...');
router.use('/banners', bannerRoutes);
console.log('✅ Banner routes loaded');

console.log('🔧 Loading settings routes...');
router.use('/settings', settingRoutes);
console.log('✅ Settings routes loaded');

console.log('🔧 Loading upload routes...');
router.use('/', uploadRoutes);
console.log('✅ Upload routes loaded');

export default router;
