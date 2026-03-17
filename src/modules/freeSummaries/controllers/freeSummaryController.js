import FreeSummary from '../models/FreeSummary.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Free Summary Controller
 * Handles CRUD operations for free summaries
 */
class FreeSummaryController {
  /**
   * @desc    Get all free summaries
   * @route   GET /api/v1/free-summaries
   * @access  Public
   */
  async getAllFreeSummaries(req, res, next) {
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
      
      const [freeSummaries, total] = await Promise.all([
        FreeSummary.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        FreeSummary.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        count: freeSummaries.length,
        data: freeSummaries,
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
   * @desc    Get single free summary
   * @route   GET /api/v1/free-summaries/:id
   * @access  Public
   */
  async getFreeSummary(req, res, next) {
    try {
      const { id } = req.params;
      
      const freeSummary = await FreeSummary.findOne({
        $or: [{ _id: id }, { slug: id }],
        isActive: true
      });

      if (!freeSummary) {
        return next(new AppError('Free summary not found', 404));
      }

      // Increment views
      freeSummary.views += 1;
      await freeSummary.save();

      res.status(200).json({
        success: true,
        data: freeSummary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Create new free summary
   * @route   POST /api/v1/free-summaries
   * @access  Private/Admin
   */
  async createFreeSummary(req, res, next) {
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

      const freeSummary = await FreeSummary.create(summaryData);

      res.status(201).json({
        success: true,
        message: 'Free summary created successfully',
        data: freeSummary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Update free summary
   * @route   PUT /api/v1/free-summaries/:id
   * @access  Private/Admin
   */
  async updateFreeSummary(req, res, next) {
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

      const freeSummary = await FreeSummary.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!freeSummary) {
        return next(new AppError('Free summary not found', 404));
      }

      res.status(200).json({
        success: true,
        message: 'Free summary updated successfully',
        data: freeSummary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Delete free summary
   * @route   DELETE /api/v1/free-summaries/:id
   * @access  Private/Admin
   */
  async deleteFreeSummary(req, res, next) {
    try {
      const { id } = req.params;

      const freeSummary = await FreeSummary.findByIdAndDelete(id);

      if (!freeSummary) {
        return next(new AppError('Free summary not found', 404));
      }

      res.status(200).json({
        success: true,
        message: 'Free summary deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get featured free summaries
   * @route   GET /api/v1/free-summaries/featured
   * @access  Public
   */
  async getFeaturedFreeSummaries(req, res, next) {
    try {
      const { limit = 6 } = req.query;
      
      const freeSummaries = await FreeSummary.findFeatured(parseInt(limit));

      res.status(200).json({
        success: true,
        count: freeSummaries.length,
        data: freeSummaries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get free summary categories
   * @route   GET /api/v1/free-summaries/categories
   * @access  Public
   */
  async getCategories(req, res, next) {
    try {
      const categories = await FreeSummary.distinct('category', { isActive: true });

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FreeSummaryController();
