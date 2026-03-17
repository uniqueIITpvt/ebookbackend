import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler.js';
import { config } from '../../../config/index.js';

/**
 * Blog Controller
 * Handles all blog-related operations
 */
class BlogController {
  /**
   * @desc    Get all blogs with filtering, sorting, and pagination
   * @route   GET /api/v1/blogs
   * @access  Public
   */
  getAllBlogs = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = config.pagination.defaultLimit,
      category,
      author,
      featured,
      tags,
      search,
      sortBy = 'latest',
      isActive = true,
      isPublished = true,
      status,
      adminView = false, // Show all blogs including drafts for admin
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Admin view bypasses default filters
    if (adminView !== 'true' && adminView !== true) {
      if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
      if (isPublished !== undefined) filter.isPublished = isPublished === 'true' || isPublished === true;
      if (!status) filter.status = 'published';
    }
    
    if (category) filter.category = new RegExp(category, 'i');
    if (author) filter.author = new RegExp(author, 'i');
    if (featured !== undefined) filter.featured = featured === 'true';
    if (status) filter.status = status;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray.map(tag => tag.trim().toLowerCase()) };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting options
    let sortOptions = {};
    switch (sortBy) {
      case 'latest':
        sortOptions = { publishDate: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { publishDate: 1, createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { views: -1, likes: -1 };
        break;
      case 'title':
        sortOptions = { title: 1 };
        break;
      case 'relevance':
      default:
        sortOptions = search 
          ? { score: { $meta: 'textScore' }, publishDate: -1 }
          : { publishDate: -1, views: -1 };
        break;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), config.pagination?.maxLimit || 100);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [blogs, totalBlogs] = await Promise.all([
      Blog.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('relatedBlogs', 'title slug image category'),
      Blog.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalBlogs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBlogs,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
      filters: {
        category,
        author,
        featured,
        tags,
        search,
        sortBy,
        status,
        adminView,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get featured blog
   * @route   GET /api/v1/blogs/featured
   * @access  Public
   */
  getFeaturedBlog = asyncHandler(async (req, res) => {
    const { limit = 1 } = req.query;
    
    const blogs = await Blog.findFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      data: limit === '1' || limit === 1 ? blogs[0] || null : blogs,
      count: blogs.length,
      message: 'Featured blog(s) retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get latest blogs
   * @route   GET /api/v1/blogs/latest
   * @access  Public
   */
  getLatestBlogs = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const blogs = await Blog.findLatest(parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs,
      count: blogs.length,
      message: 'Latest blogs retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get blogs by category
   * @route   GET /api/v1/blogs/category/:category
   * @access  Public
   */
  getBlogsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [blogs, totalBlogs] = await Promise.all([
      Blog.findByCategory(category, limitNum).skip(skip),
      Blog.countDocuments({ 
        category: new RegExp(category, 'i'),
        isActive: true,
        isPublished: true,
        status: 'published'
      })
    ]);

    if (blogs.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: `No blogs found in category: ${category}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const totalPages = Math.ceil(totalBlogs / limitNum);

    res.status(200).json({
      success: true,
      data: blogs,
      category,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBlogs,
        limit: limitNum,
      },
      message: `Blogs in category '${category}' retrieved successfully`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get blogs by author
   * @route   GET /api/v1/blogs/author/:author
   * @access  Public
   */
  getBlogsByAuthor = asyncHandler(async (req, res) => {
    const { author } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [blogs, totalBlogs] = await Promise.all([
      Blog.findByAuthor(author, limitNum).skip(skip),
      Blog.countDocuments({ 
        author: new RegExp(author, 'i'),
        isActive: true,
        isPublished: true,
        status: 'published'
      })
    ]);

    if (blogs.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: `No blogs found by author: ${author}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const totalPages = Math.ceil(totalBlogs / limitNum);

    res.status(200).json({
      success: true,
      data: blogs,
      author,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBlogs,
        limit: limitNum,
      },
      message: `Blogs by author '${author}' retrieved successfully`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get single blog by ID or slug
   * @route   GET /api/v1/blogs/:identifier
   * @access  Public
   */
  getBlog = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by slug
    let blog;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId
      blog = await Blog.findById(identifier)
        .populate('relatedBlogs', 'title slug image excerpt category readTime');
    } else {
      // Assume it's a slug
      blog = await Blog.findOne({ slug: identifier })
        .populate('relatedBlogs', 'title slug image excerpt category readTime');
    }

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    if (!blog.isActive || !blog.isPublished) {
      throw new AppError('Blog is not available', 404);
    }

    // Increment views (fire and forget)
    blog.incrementViews().catch(err => 
      console.error('Error incrementing blog views:', err)
    );

    res.status(200).json({
      success: true,
      data: blog,
      message: 'Blog retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Search blogs
   * @route   GET /api/v1/blogs/search
   * @access  Public
   */
  searchBlogs = asyncHandler(async (req, res) => {
    const {
      q: query,
      category,
      author,
      tags,
      page = 1,
      limit = config.pagination?.defaultLimit || 20,
      sortBy = 'relevance'
    } = req.query;

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters long', 400);
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), config.pagination?.maxLimit || 100);
    const skip = (pageNum - 1) * limitNum;

    const searchOptions = {
      category,
      author,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined,
      limit: limitNum,
      skip,
      sortBy
    };

    const [blogs, totalBlogs] = await Promise.all([
      Blog.searchBlogs(query.trim(), searchOptions),
      Blog.countDocuments({
        $text: { $search: query.trim() },
        isActive: true,
        isPublished: true,
        status: 'published',
        ...(category && { category: new RegExp(category, 'i') }),
        ...(author && { author: new RegExp(author, 'i') }),
      })
    ]);

    const totalPages = Math.ceil(totalBlogs / limitNum);

    res.status(200).json({
      success: true,
      data: blogs,
      searchQuery: query,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBlogs,
        limit: limitNum,
      },
      filters: searchOptions,
      message: `Search results for "${query}"`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get blog categories
   * @route   GET /api/v1/blogs/categories
   * @access  Public
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await Blog.aggregate([
      {
        $match: { isActive: true, isPublished: true, status: 'published' }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgViews: { $avg: '$views' },
          latestBlog: { $max: '$publishDate' },
          blogs: { $push: { title: '$title', slug: '$slug', image: '$image' } }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          avgViews: { $round: ['$avgViews', 0] },
          latestBlog: 1,
          sampleBlogs: { $slice: ['$blogs', 3] },
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
      message: 'Blog categories retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get blog statistics
   * @route   GET /api/v1/blogs/stats
   * @access  Public
   */
  getBlogStats = asyncHandler(async (req, res) => {
    const stats = await Blog.aggregate([
      {
        $match: { isActive: true, isPublished: true, status: 'published' }
      },
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          featuredBlogs: { $sum: { $cond: ['$featured', 1, 0] } },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          avgViews: { $avg: '$views' },
          categories: { $addToSet: '$category' },
          authors: { $addToSet: '$author' },
        }
      },
      {
        $project: {
          _id: 0,
          totalBlogs: 1,
          featuredBlogs: 1,
          totalViews: 1,
          totalLikes: 1,
          avgViews: { $round: ['$avgViews', 0] },
          categoriesCount: { $size: '$categories' },
          authorsCount: { $size: '$authors' },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalBlogs: 0,
        featuredBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        avgViews: 0,
        categoriesCount: 0,
        authorsCount: 0,
      },
      message: 'Blog statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Track blog engagement
   * @route   POST /api/v1/blogs/:identifier/track
   * @access  Public
   */
  trackEngagement = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const { action, readTime, completed, platform } = req.body;

    let blog;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(identifier);
    } else {
      blog = await Blog.findOne({ slug: identifier });
    }

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    switch (action) {
      case 'view':
        await blog.incrementViews();
        break;
      case 'like':
        await blog.incrementLikes();
        break;
      case 'share':
        if (platform) {
          await blog.incrementShare(platform);
        }
        break;
      case 'read':
        if (readTime) {
          await blog.updateEngagement(readTime, completed);
        }
        break;
      default:
        throw new AppError('Invalid action', 400);
    }

    res.status(200).json({
      success: true,
      message: `${action} tracked successfully`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Create new blog
   * @route   POST /api/v1/blogs
   * @access  Admin
   */
  createBlog = asyncHandler(async (req, res) => {
    try {
      const blogData = req.body;
      const uploadedFiles = req.uploadedFiles || {};

      console.log('Creating blog with data:', JSON.stringify(blogData, null, 2));
      console.log('Uploaded files:', uploadedFiles);

      // Check if slug already exists
      if (blogData.slug) {
        const existingBlog = await Blog.findOne({ slug: blogData.slug });
        if (existingBlog) {
          throw new AppError(`Blog with slug "${blogData.slug}" already exists`, 400);
        }
      }

      // Process data
      const processedData = {
        ...blogData,
        featured: blogData.featured || false,
        author: blogData.author || 'Dr. Syed M Quadri',
        authorAvatar: blogData.authorAvatar || '/sayyed-quadri.png',
        isActive: blogData.isActive !== undefined ? blogData.isActive : true,
        isPublished: blogData.isPublished !== undefined ? blogData.isPublished : true,
        status: blogData.status || (blogData.isPublished ? 'published' : 'draft'),
        publishDate: blogData.publishDate || new Date(),
        tags: Array.isArray(blogData.tags) ? blogData.tags.map(tag => tag.toLowerCase().trim()) : [],
        views: 0,
        likes: 0,
        commentsCount: 0,
        shares: {
          facebook: 0,
          twitter: 0,
          linkedin: 0,
          email: 0
        }
      };

      // Add uploaded image information
      if (uploadedFiles.image) {
        processedData.image = uploadedFiles.image.url;
        processedData.imageCloudinary = {
          publicId: uploadedFiles.image.publicId,
          url: uploadedFiles.image.url,
          originalName: uploadedFiles.image.originalName,
          fileSize: uploadedFiles.image.fileSize,
          mimeType: uploadedFiles.image.mimeType,
          width: uploadedFiles.image.width,
          height: uploadedFiles.image.height
        };
      }

      // Create the blog
      const blog = await Blog.create(processedData);

      res.status(201).json({
        success: true,
        data: blog,
        message: 'Blog created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  });

  /**
   * @desc    Update blog
   * @route   PUT /api/v1/blogs/:id
   * @access  Admin
   */
  updateBlog = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      const uploadedFiles = req.uploadedFiles || {};

      console.log('Updating blog with data:', JSON.stringify(updateData, null, 2));
      console.log('Uploaded files:', uploadedFiles);

      // Find blog
      const blog = await Blog.findById(id);
      if (!blog) {
        throw new AppError('Blog not found', 404);
      }

      // Check if slug is being changed and if it conflicts
      if (updateData.slug && updateData.slug !== blog.slug) {
        const existingBlog = await Blog.findOne({ 
          slug: updateData.slug,
          _id: { $ne: id }
        });
        if (existingBlog) {
          throw new AppError(`Blog with slug "${updateData.slug}" already exists`, 400);
        }
      }

      // Process tags if provided
      if (updateData.tags && Array.isArray(updateData.tags)) {
        updateData.tags = updateData.tags.map(tag => tag.toLowerCase().trim());
      }

      // Handle uploaded image
      if (uploadedFiles.image) {
        // Delete old image from Cloudinary if it exists
        if (blog.imageCloudinary?.publicId) {
          try {
            const { deleteBlogImageFromCloudinary } = await import('../middleware/fileUpload.js');
            await deleteBlogImageFromCloudinary(blog.imageCloudinary.publicId);
          } catch (error) {
            console.warn('Failed to delete old image:', error.message);
          }
        }

        updateData.image = uploadedFiles.image.url;
        updateData.imageCloudinary = {
          publicId: uploadedFiles.image.publicId,
          url: uploadedFiles.image.url,
          originalName: uploadedFiles.image.originalName,
          fileSize: uploadedFiles.image.fileSize,
          mimeType: uploadedFiles.image.mimeType,
          width: uploadedFiles.image.width,
          height: uploadedFiles.image.height
        };
      }

      // Sync status with isPublished
      if (updateData.isPublished !== undefined) {
        updateData.status = updateData.isPublished ? 'published' : 'draft';
      }

      // Update blog
      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        success: true,
        data: updatedBlog,
        message: 'Blog updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  });

  /**
   * @desc    Delete blog
   * @route   DELETE /api/v1/blogs/:id
   * @access  Admin
   */
  deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    // Delete image from Cloudinary if it exists
    if (blog.imageCloudinary?.publicId) {
      try {
        const { deleteBlogImageFromCloudinary } = await import('../middleware/fileUpload.js');
        await deleteBlogImageFromCloudinary(blog.imageCloudinary.publicId);
      } catch (error) {
        console.warn('Failed to delete blog image from Cloudinary:', error.message);
      }
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Blog deleted successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Seed database from blogs.json
   * @route   POST /api/v1/blogs/seed
   * @access  Admin
   */
  seedBlogs = asyncHandler(async (req, res) => {
    const { blogs, clearExisting = false } = req.body;

    if (!blogs || !Array.isArray(blogs)) {
      throw new AppError('Invalid blogs data. Expected an array of blogs.', 400);
    }

    let result = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Clear existing blogs if requested
    if (clearExisting) {
      await Blog.deleteMany({});
      console.log('🗑️ Cleared existing blogs');
    }

    // Process each blog
    for (const blogData of blogs) {
      try {
        // Check if blog already exists by title or slug
        const existingBlog = await Blog.findOne({
          $or: [
            { title: blogData.title },
            { slug: blogData.slug || slugify(blogData.title, { lower: true, strict: true }) }
          ]
        });

        if (existingBlog && !clearExisting) {
          result.skipped++;
          continue;
        }

        // Prepare blog data
        const processedData = {
          ...blogData,
          author: blogData.author || 'Dr. Syed M Quadri',
          authorAvatar: blogData.authorAvatar || '/sayyed-quadri.png',
          isActive: blogData.isActive !== undefined ? blogData.isActive : true,
          isPublished: blogData.isPublished !== undefined ? blogData.isPublished : true,
          status: blogData.status || 'published',
          tags: Array.isArray(blogData.tags) ? blogData.tags.map(tag => tag.toLowerCase().trim()) : [],
          views: blogData.views || 0,
          likes: blogData.likes || 0,
          featured: blogData.featured || false,
          publishDate: blogData.publishDate ? new Date(blogData.publishDate) : new Date(),
          shares: blogData.shares || {
            facebook: 0,
            twitter: 0,
            linkedin: 0,
            email: 0
          }
        };

        // Create blog
        await Blog.create(processedData);
        result.created++;
      } catch (error) {
        console.error(`Error seeding blog "${blogData.title}":`, error.message);
        result.errors.push({
          title: blogData.title,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: result,
      message: `Seeding completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
      timestamp: new Date().toISOString(),
    });
  });
}

export default new BlogController();
