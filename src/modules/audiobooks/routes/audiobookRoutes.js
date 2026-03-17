import express from 'express';

import audiobookController from '../controllers/audiobookController.js';
import { uploadBookFiles } from '../../../shared/middleware/fileUpload.js';

const router = express.Router();

// Public endpoints
router.get('/', audiobookController.getAll);
router.get('/featured', audiobookController.getFeatured);
router.get('/bestsellers', audiobookController.getBestsellers);
router.get('/trending', audiobookController.getTrending);
router.get('/categories', audiobookController.getCategories);
router.get('/search', audiobookController.search);

// CRUD
router.post('/', uploadBookFiles, audiobookController.create);
router.get('/:identifier', audiobookController.getOne);
router.put('/:id', uploadBookFiles, audiobookController.update);
router.delete('/:id', audiobookController.delete);

// File endpoints
router.post('/:id/files/audiobook', uploadBookFiles, audiobookController.update);
router.delete('/:id/files/audiobook', audiobookController.removeAudiobookFile);

export default router;
