import TrendingBook from '../models/TrendingBook.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Trending Book Controller
 * Handles CRUD operations for trending books
 */
class TrendingBookController {
  /**
   * @desc    Get all trending books
   * @route   GET /api/v1/trending-books
   * @access  Public
   */
  async getAllTrendingBooks(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        featured,
        search,
        sortBy = 'views',
        order = 'desc'
      } = req.query;

      // Build filter
      let filter = { isActive: true };
      
      if (category) {
        filter.category = new RegExp(category, 'i');
      }
      
      if (featured === 'true') {
        filter.featured = true;
      }
      
      if (search) {
        filter.$text = { $search: search };
      }

      // Build sort
      const sortOptions = {};
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [trendingBooks, total] = await Promise.all([
        TrendingBook.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        TrendingBook.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        count: trendingBooks.length,
        data: trendingBooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get single trending book
   * @route   GET /api/v1/trending-books/:id
   * @access  Public
   */
  async getTrendingBook(req, res, next) {
    try {
      const { id } = req.params;
      
      const trendingBook = await TrendingBook.findOne({
        $or: [{ _id: id }, { slug: id }],
        isActive: true
      });

      if (!trendingBook) {
        return next(new AppError('Trending book not found', 404));
      }

      // Increment views
      trendingBook.views += 1;
      await trendingBook.save();

      res.status(200).json({
        success: true,
        data: trendingBook
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Create new trending book
   * @route   POST /api/v1/trending-books
   * @access  Private/Admin
   */
  async createTrendingBook(req, res, next) {
    try {
      const bookData = req.body;
      
      // Handle image from uploaded files
      if (req.uploadedFiles?.image?.url) {
        bookData.image = req.uploadedFiles.image.url;
        bookData.imageCloudinary = {
          publicId: req.uploadedFiles.image.publicId,
          url: req.uploadedFiles.image.url,
          originalName: req.uploadedFiles.image.originalName
        };
      }

      const trendingBook = await TrendingBook.create(bookData);

      res.status(201).json({
        success: true,
        message: 'Trending book created successfully',
        data: trendingBook
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Update trending book
   * @route   PUT /api/v1/trending-books/:id
   * @access  Private/Admin
   */
  async updateTrendingBook(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle image update
      if (req.uploadedFiles?.image?.url) {
        updateData.image = req.uploadedFiles.image.url;
        updateData.imageCloudinary = {
          publicId: req.uploadedFiles.image.publicId,
          url: req.uploadedFiles.image.url,
          originalName: req.uploadedFiles.image.originalName
        };
      }

      const trendingBook = await TrendingBook.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!trendingBook) {
        return next(new AppError('Trending book not found', 404));
      }

      res.status(200).json({
        success: true,
        message: 'Trending book updated successfully',
        data: trendingBook
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Delete trending book
   * @route   DELETE /api/v1/trending-books/:id
   * @access  Private/Admin
   */
  async deleteTrendingBook(req, res, next) {
    try {
      const { id } = req.params;

      const trendingBook = await TrendingBook.findByIdAndDelete(id);

      if (!trendingBook) {
        return next(new AppError('Trending book not found', 404));
      }

      res.status(200).json({
        success: true,
        message: 'Trending book deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get featured trending books
   * @route   GET /api/v1/trending-books/featured
   * @access  Public
   */
  async getFeaturedTrendingBooks(req, res, next) {
    try {
      const { limit = 6 } = req.query;
      
      const trendingBooks = await TrendingBook.findFeatured(parseInt(limit));

      res.status(200).json({
        success: true,
        count: trendingBooks.length,
        data: trendingBooks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get top trending books
   * @route   GET /api/v1/trending-books/top
   * @access  Public
   */
  async getTopTrending(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      
      const trendingBooks = await TrendingBook.findTopTrending(parseInt(limit));

      res.status(200).json({
        success: true,
        count: trendingBooks.length,
        data: trendingBooks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get trending book categories
   * @route   GET /api/v1/trending-books/categories
   * @access  Public
   */
  async getCategories(req, res, next) {
    try {
      const categories = await TrendingBook.distinct('category', { isActive: true });

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TrendingBookController();
