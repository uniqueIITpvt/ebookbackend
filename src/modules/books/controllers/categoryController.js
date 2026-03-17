import Category from '../models/Category.js';
import Book from '../models/Book.js';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Category Controller
 * Handles all category-related operations
 */
class CategoryController {
  /**
   * @desc    Get all categories
   * @route   GET /api/v1/categories
   * @access  Public
   */
  getAllCategories = asyncHandler(async (req, res) => {
    const { 
      includeInactive = false, 
      sortBy = 'sortOrder',
      withBookCount = false 
    } = req.query;

    let filter = {};
    if (!includeInactive || includeInactive === 'false') {
      filter.isActive = true;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortBy === 'name' ? 1 : 1;

    let categories = await Category.find(filter).sort(sortOptions);

    // Update book counts if requested
    if (withBookCount === 'true') {
      for (let category of categories) {
        await category.updateBookCount();
      }
      // Refetch to get updated counts
      categories = await Category.find(filter).sort(sortOptions);
    }

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
      message: 'Categories retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get single category by ID or slug
   * @route   GET /api/v1/categories/:identifier
   * @access  Public
   */
  getCategory = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    
    let category;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId
      category = await Category.findById(identifier);
    } else {
      // Assume it's a slug
      category = await Category.findBySlug(identifier);
    }

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Update book count
    await category.updateBookCount();

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Create a new category
   * @route   POST /api/v1/categories
   * @access  Admin
   */
  createCategory = asyncHandler(async (req, res) => {
    try {
      const categoryData = req.body;

      // Check if category with same name already exists
      const existingCategory = await Category.findOne({ 
        name: new RegExp(`^${categoryData.name}$`, 'i') 
      });
      
      if (existingCategory) {
        throw new AppError('Category with this name already exists', 400);
      }

      const category = await Category.create(categoryData);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating category:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        throw new AppError(`Validation Error: ${errors.join(', ')}`, 400);
      }
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(`${field} already exists`, 400);
      }
      
      throw error;
    }
  });

  /**
   * @desc    Update a category
   * @route   PUT /api/v1/categories/:id
   * @access  Admin
   */
  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: new RegExp(`^${updateData.name}$`, 'i'),
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        throw new AppError('Category with this name already exists', 400);
      }

      // Update all books that use the old category name
      await Book.updateMany(
        { category: category.name },
        { category: updateData.name }
      );
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Delete a category
   * @route   DELETE /api/v1/categories/:id
   * @access  Admin
   */
  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { moveToCategory } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if there are books using this category
    const bookCount = await Book.countDocuments({ category: category.name });
    
    if (bookCount > 0) {
      if (!moveToCategory) {
        throw new AppError(
          `Cannot delete category. ${bookCount} books are using this category. Please provide a 'moveToCategory' to reassign them.`,
          400
        );
      }

      // Verify the target category exists
      const targetCategory = await Category.findById(moveToCategory);
      if (!targetCategory) {
        throw new AppError('Target category for moving books not found', 404);
      }

      // Move all books to the new category
      await Book.updateMany(
        { category: category.name },
        { category: targetCategory.name }
      );

      // Update book count for target category
      await targetCategory.updateBookCount();
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: {},
      message: `Category deleted successfully${bookCount > 0 ? ` and ${bookCount} books moved to ${moveToCategory}` : ''}`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Reorder categories
   * @route   PUT /api/v1/categories/reorder
   * @access  Admin
   */
  reorderCategories = asyncHandler(async (req, res) => {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      throw new AppError('categoryIds must be an array', 400);
    }

    // Update sort order for each category
    const updatePromises = categoryIds.map((categoryId, index) => 
      Category.findByIdAndUpdate(categoryId, { sortOrder: index })
    );

    await Promise.all(updatePromises);

    const updatedCategories = await Category.findActive();

    res.status(200).json({
      success: true,
      data: updatedCategories,
      message: 'Categories reordered successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get category statistics
   * @route   GET /api/v1/categories/stats
   * @access  Public
   */
  getCategoryStats = asyncHandler(async (req, res) => {
    const stats = await Category.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: 'name',
          foreignField: 'category',
          as: 'books'
        }
      },
      {
        $addFields: {
          totalBooks: { $size: '$books' },
          publishedBooks: {
            $size: {
              $filter: {
                input: '$books',
                cond: { 
                  $and: [
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.isPublished', true] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          color: 1,
          icon: 1,
          isActive: 1,
          totalBooks: 1,
          publishedBooks: 1,
          sortOrder: 1
        }
      },
      {
        $sort: { sortOrder: 1 }
      }
    ]);

    const summary = {
      totalCategories: stats.length,
      activeCategories: stats.filter(cat => cat.isActive).length,
      totalBooks: stats.reduce((sum, cat) => sum + cat.totalBooks, 0),
      publishedBooks: stats.reduce((sum, cat) => sum + cat.publishedBooks, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        categories: stats,
        summary
      },
      message: 'Category statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });
}

export default new CategoryController();
