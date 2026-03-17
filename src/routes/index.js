import express from 'express';
import v1Routes from './v1/index.js';

const router = express.Router();

// API version 1 routes with debugging
console.log('🔧 Loading v1 routes...');
router.use('/', v1Routes);
console.log('✅ v1 routes loaded');

// Future API versions can be added here
// router.use('/v2', v2Routes);

export default router;
