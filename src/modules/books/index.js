/**
 * Books Module
 * Exports all book-related functionality
 */

import Book from './models/Book.js';
import bookController from './controllers/bookController.js';
import bookRoutes from './routes/bookRoutes.js';
import bookService from './services/bookService.js';
import * as bookValidation from './middleware/validation.js';

export {
  Book,
  bookController,
  bookRoutes,
  bookService,
  bookValidation
};

export default {
  model: Book,
  controller: bookController,
  routes: bookRoutes,
  service: bookService,
  validation: bookValidation
};
