import PremiumSummary from '../models/PremiumSummary.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Premium Summary Controller
 * Handles CRUD operations for premium summaries
 */
class PremiumSummaryController {
  /**
   * @desc    Get all premium summaries
   * @route   GET /api/v1/premium-summaries
   * @access  Public
   */
  async getAllPremiumSummaries(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        featured,
        search,
        sortBy = 'createdAt',
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
      
      const [premiumSummaries, total] = await Promise.all([
        PremiumSummary.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        PremiumSummary.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        count: premiumSummaries.length,
        data: premiumSummaries,
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
   * @desc    Get single premium summary
   * @route   GET /api/v1/premium-summaries/:id
   * @access  Public
   */
  async getPremiumSummary(req, res, next) {
    try {
      const { id } = req.params;
      
      const premiumSummary = await PremiumSummary.findOne({
        $or: [{ _id: id }, { slug: id }],
        isActive: true
      });

      if (!premiumSummary) {
        return next(new AppError('Premium summary not found', 404));
      }

      // Increment views
      premiumSummary.views += 1;
      await premiumSummary.save();

      res.status(200).json({
        success: true,
        data: premiumSummary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Create new premium summary
   * @route   POST /api/v1/premium-summaries
   * @access  Private/Admin
   */
  async createPremiumSummary(req, res, next) {
    try {
      const summaryData = req.body;
      
      // Handle image from uploaded files
      if (req.uploadedFiles?.image?.url) {
        summaryData.image = req.uploadedFiles.image.url;
        summaryData.imageCloudinary = {
          publicId: req.uploadedFiles.image.publicId,
          url: req.uploadedFiles.image.url,
          originalName: req.uploadedFiles.image.originalName
        };
      }

      const premiumSummary = await PremiumSummary.create(summaryData);

      res.status(201).json({
        success: true,
        message: 'Premium summary created successfully',
        data: premiumSummary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Update premium summary
   * @route   PUT /api/v1/premium-summaries/:id
   * @access  Private/Admin
   */
  async updatePremiumSummary(req, res, next) {
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

      const premiumSummary = await PremiumSummary.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!premiumSummary) {
        return next(new AppError('Premium summary not found', 404));
      }

      res.status(200).json({
        success: true,
        message: 'Premium summary updated successfully',
        data: premiumSummary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Delete premium summary
   * @route   DELETE /api/v1/premium-summaries/:id
   * @access  Private/Admin
   */
  async deletePremiumSummary(req, res, next) {
    try {
      const { id } = req.params;

      const premiumSummary = await PremiumSummary.findByIdAndDelete(id);

      if (!premiumSummary) {
        return next(new AppError('Premium summary not found', 404));
      }

      res.status(200).json({
        success: true,
        message: 'Premium summary deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get featured premium summaries
   * @route   GET /api/v1/premium-summaries/featured
   * @access  Public
   */
  async getFeaturedPremiumSummaries(req, res, next) {
    try {
      const { limit = 6 } = req.query;
      
      const premiumSummaries = await PremiumSummary.findFeatured(parseInt(limit));

      res.status(200).json({
        success: true,
        count: premiumSummaries.length,
        data: premiumSummaries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get latest premium summaries
   * @route   GET /api/v1/premium-summaries/latest
   * @access  Public
   */
  async getLatestPremiumSummaries(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      
      const premiumSummaries = await PremiumSummary.findLatest(parseInt(limit));

      res.status(200).json({
        success: true,
        count: premiumSummaries.length,
        data: premiumSummaries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get premium summary categories
   * @route   GET /api/v1/premium-summaries/categories
   * @access  Public
   */
  async getCategories(req, res, next) {
    try {
      const categories = await PremiumSummary.distinct('category', { isActive: true });

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PremiumSummaryController();
