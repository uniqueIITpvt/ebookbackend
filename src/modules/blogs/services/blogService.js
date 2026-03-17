import Blog from '../models/Blog.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Blog Service
 * Business logic for blog operations
 */
class BlogService {
  /**
   * Find blog by ID or slug
   */
  async findBlogByIdentifier(identifier) {
    let blog;
    
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(identifier);
    } else {
      blog = await Blog.findOne({ slug: identifier });
    }
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }
    
    return blog;
  }

  /**
   * Get published blogs with filters
   */
  async getPublishedBlogs(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'latest',
      populate = []
    } = options;

    const query = {
      isActive: true,
      isPublished: true,
      status: 'published',
      ...filters
    };

    let sortOptions = {};
    switch (sortBy) {
      case 'latest':
        sortOptions = { publishDate: -1 };
        break;
      case 'oldest':
        sortOptions = { publishDate: 1 };
        break;
      case 'popular':
        sortOptions = { views: -1, likes: -1 };
        break;
      default:
        sortOptions = { publishDate: -1 };
    }

    const skip = (page - 1) * limit;

    let queryBuilder = Blog.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    if (populate.length > 0) {
      populate.forEach(field => {
        queryBuilder = queryBuilder.populate(field);
      });
    }

    const [blogs, total] = await Promise.all([
      queryBuilder,
      Blog.countDocuments(query)
    ]);

    return {
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get related blogs based on category and tags
   */
  async getRelatedBlogs(blogId, limit = 5) {
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    // Find blogs with same category or overlapping tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: blogId },
      isActive: true,
      isPublished: true,
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
    .sort({ views: -1, publishDate: -1 })
    .limit(limit)
    .select('title slug image excerpt category readTime');

    return relatedBlogs;
  }

  /**
   * Get trending blogs based on recent engagement
   */
  async getTrendingBlogs(limit = 10, days = 7) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const trendingBlogs = await Blog.find({
      isActive: true,
      isPublished: true,
      status: 'published',
      publishDate: { $gte: dateThreshold }
    })
    .sort({ views: -1, likes: -1 })
    .limit(limit)
    .select('title slug image excerpt category readTime views likes');

    return trendingBlogs;
  }

  /**
   * Get blog reading statistics
   */
  async getBlogReadingStats(blogId) {
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    return {
      views: blog.views,
      likes: blog.likes,
      averageReadTime: blog.averageReadTime,
      completionRate: blog.completionRate,
      shares: blog.shares,
      engagementScore: blog.engagementScore
    };
  }

  /**
   * Update blog view count
   */
  async incrementBlogViews(blogId) {
    const blog = await this.findBlogByIdentifier(blogId);
    return await blog.incrementViews();
  }

  /**
   * Update blog like count
   */
  async incrementBlogLikes(blogId) {
    const blog = await this.findBlogByIdentifier(blogId);
    return await blog.incrementLikes();
  }

  /**
   * Update blog share count
   */
  async incrementBlogShares(blogId, platform) {
    const blog = await this.findBlogByIdentifier(blogId);
    return await blog.incrementShare(platform);
  }

  /**
   * Track reading engagement
   */
  async trackReadingEngagement(blogId, readTime, completed = false) {
    const blog = await this.findBlogByIdentifier(blogId);
    return await blog.updateEngagement(readTime, completed);
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 20) {
    const tags = await Blog.aggregate([
      {
        $match: { isActive: true, isPublished: true, status: 'published' }
      },
      {
        $unwind: '$tags'
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          avgViews: { $avg: '$views' }
        }
      },
      {
        $sort: { count: -1, avgViews: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          tag: '$_id',
          count: 1,
          avgViews: { $round: ['$avgViews', 0] },
          _id: 0
        }
      }
    ]);

    return tags;
  }

  /**
   * Get blog archive by month
   */
  async getBlogArchive() {
    const archive = await Blog.aggregate([
      {
        $match: { isActive: true, isPublished: true, status: 'published' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishDate' },
            month: { $month: '$publishDate' }
          },
          count: { $sum: 1 },
          blogs: {
            $push: {
              title: '$title',
              slug: '$slug',
              publishDate: '$publishDate'
            }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          blogs: { $slice: ['$blogs', 5] },
          _id: 0
        }
      }
    ]);

    return archive;
  }

  /**
   * Validate blog data
   */
  validateBlogData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push('Title is required and must be at least 3 characters');
    }

    if (!data.excerpt || data.excerpt.trim().length < 10) {
      errors.push('Excerpt is required and must be at least 10 characters');
    }

    if (!data.content || data.content.trim().length < 50) {
      errors.push('Content is required and must be at least 50 characters');
    }

    if (!data.category || data.category.trim().length < 2) {
      errors.push('Category is required');
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    return true;
  }
}

export default new BlogService();
