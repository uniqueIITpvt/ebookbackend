/**
 * Blogs Module
 * Exports all blog-related functionality
 */

import Blog from './models/Blog.js';
import blogController from './controllers/blogController.js';
import blogRoutes from './routes/blogRoutes.js';
import blogService from './services/blogService.js';
import * as blogValidation from './middleware/validation.js';

export {
  Blog,
  blogController,
  blogRoutes,
  blogService,
  blogValidation
};

export default {
  model: Blog,
  controller: blogController,
  routes: blogRoutes,
  service: blogService,
  validation: blogValidation
};
