import Book from '../models/Book.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

/**
 * Book Service
 * Contains business logic for book operations
 */
class BookService {
  /**
   * Get books with advanced filtering and aggregation
   */
  async getFilteredBooks(filters, options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'newest',
      includeInactive = false
    } = options;

    const pipeline = [];

    // Match stage
    const matchStage = {
      ...(includeInactive ? {} : { isActive: true, isPublished: true }),
      ...filters
    };
    pipeline.push({ $match: matchStage });

    // Add computed fields
    pipeline.push({
      $addFields: {
        discountAmount: {
          $cond: {
            if: { $and: ['$originalPrice', '$price'] },
            then: {
              $subtract: [
                { $toDouble: { $regexFind: { input: '$originalPrice', regex: /[0-9.]+/ } } },
                { $toDouble: { $regexFind: { input: '$price', regex: /[0-9.]+/ } } }
              ]
            },
            else: 0
          }
        },
        priceNumeric: {
          $toDouble: { $arrayElemAt: [{ $split: [{ $regexFind: { input: '$price', regex: /[0-9.]+/ } }, ''] }, 0] }
        }
      }
    });

    // Sort stage
    let sortStage = {};
    switch (sortBy) {
      case 'price-low':
        sortStage = { priceNumeric: 1, rating: -1 };
        break;
      case 'price-high':
        sortStage = { priceNumeric: -1, rating: -1 };
        break;
      case 'rating':
        sortStage = { rating: -1, reviews: -1 };
        break;
      case 'popular':
        sortStage = { views: -1, rating: -1 };
        break;
      case 'oldest':
        sortStage = { publishDate: 1 };
        break;
      case 'newest':
      default:
        sortStage = { publishDate: -1, rating: -1 };
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const books = await Book.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
      { $count: 'total' }
    ];
    const countResult = await Book.aggregate(countPipeline);
    const totalBooks = countResult.length > 0 ? countResult[0].total : 0;

    return {
      books,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalBooks / limit),
      hasPrevPage: page > 1
    };
  }

  /**
   * Get book recommendations based on a book
   */
  async getRecommendations(bookId, limit = 5) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    // Find similar books based on category, tags, and author
    const recommendations = await Book.aggregate([
      {
        $match: {
          _id: { $ne: book._id },
          isActive: true,
          isPublished: true,
          $or: [
            { category: book.category },
            { tags: { $in: book.tags } },
            { author: book.author }
          ]
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $cond: [{ $eq: ['$category', book.category] }, 3, 0] },
              { $cond: [{ $eq: ['$author', book.author] }, 2, 0] },
              { $size: { $setIntersection: ['$tags', book.tags] } },
              { $multiply: ['$rating', 0.5] }
            ]
          }
        }
      },
      { $sort: { score: -1, rating: -1, views: -1 } },
      { $limit: limit },
      {
        $project: {
          title: 1,
          author: 1,
          category: 1,
          price: 1,
          rating: 1,
          image: 1,
          slug: 1,
          score: 1
        }
      }
    ]);

    return recommendations;
  }

  /**
   * Get trending books based on recent views and ratings
   */
  async getTrendingBooks(limit = 10, days = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const trendingBooks = await Book.aggregate([
      {
        $match: {
          isActive: true,
          isPublished: true,
          updatedAt: { $gte: dateThreshold }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$views', 0.3] },
              { $multiply: ['$rating', 20] },
              { $multiply: ['$reviews', 2] },
              { $cond: ['$featured', 10, 0] },
              { $cond: ['$bestseller', 15, 0] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1, updatedAt: -1 } },
      { $limit: limit },
      {
        $project: {
          title: 1,
          author: 1,
          category: 1,
          price: 1,
          rating: 1,
          views: 1,
          image: 1,
          slug: 1,
          trendingScore: 1
        }
      }
    ]);

    return trendingBooks;
  }

  /**
   * Get books by multiple categories
   */
  async getBooksByCategories(categories, limit = 5) {
    const booksByCategory = {};

    for (const category of categories) {
      const books = await Book.findByCategory(category, limit);
      booksByCategory[category] = books;
    }

    return booksByCategory;
  }

  /**
   * Get book statistics for analytics
   */
  async getDetailedStats() {
    const stats = await Book.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalBooks: { $sum: 1 },
                activeBooks: { $sum: { $cond: ['$isActive', 1, 0] } },
                featuredBooks: { $sum: { $cond: ['$featured', 1, 0] } },
                bestsellerBooks: { $sum: { $cond: ['$bestseller', 1, 0] } },
                avgRating: { $avg: '$rating' },
                totalViews: { $sum: '$views' },
                totalReviews: { $sum: '$reviews' }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                totalViews: { $sum: '$views' }
              }
            },
            { $sort: { count: -1 } }
          ],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            }
          ],
          byAuthor: [
            {
              $group: {
                _id: '$author',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                totalViews: { $sum: '$views' }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          ratingDistribution: [
            {
              $bucket: {
                groupBy: '$rating',
                boundaries: [0, 1, 2, 3, 4, 5],
                default: 'Other',
                output: {
                  count: { $sum: 1 },
                  books: { $push: { title: '$title', rating: '$rating' } }
                }
              }
            }
          ],
          recentBooks: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                title: 1,
                author: 1,
                category: 1,
                rating: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]);

    return stats[0];
  }

  /**
   * Search books with advanced text search and filters
   */
  async advancedSearch(query, filters = {}) {
    const {
      category,
      type,
      author,
      minRating,
      maxPrice,
      tags,
      publishedAfter,
      publishedBefore,
      page = 1,
      limit = 20,
      sortBy = 'relevance'
    } = filters;

    const pipeline = [];

    // Text search stage
    if (query) {
      pipeline.push({
        $match: {
          $text: { $search: query }
        }
      });
      
      pipeline.push({
        $addFields: {
          searchScore: { $meta: 'textScore' }
        }
      });
    }

    // Additional filters
    const matchFilters = {
      isActive: true,
      isPublished: true
    };

    if (category) matchFilters.category = new RegExp(category, 'i');
    if (type) matchFilters.type = type;
    if (author) matchFilters.author = new RegExp(author, 'i');
    if (minRating) matchFilters.rating = { $gte: minRating };
    if (tags && tags.length > 0) matchFilters.tags = { $in: tags };
    
    if (publishedAfter || publishedBefore) {
      matchFilters.publishDate = {};
      if (publishedAfter) matchFilters.publishDate.$gte = new Date(publishedAfter);
      if (publishedBefore) matchFilters.publishDate.$lte = new Date(publishedBefore);
    }

    pipeline.push({ $match: matchFilters });

    // Price filter (more complex due to string format)
    if (maxPrice) {
      pipeline.push({
        $addFields: {
          priceNumeric: {
            $toDouble: {
              $arrayElemAt: [
                { $regexFindAll: { input: '$price', regex: /[0-9.]+/ } },
                0
              ]
            }
          }
        }
      });
      
      pipeline.push({
        $match: {
          priceNumeric: { $lte: maxPrice }
        }
      });
    }

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'relevance':
        sortStage = query ? { searchScore: { $meta: 'textScore' } } : { rating: -1, views: -1 };
        break;
      case 'rating':
        sortStage = { rating: -1, reviews: -1 };
        break;
      case 'newest':
        sortStage = { publishDate: -1 };
        break;
      case 'oldest':
        sortStage = { publishDate: 1 };
        break;
      case 'popular':
        sortStage = { views: -1, rating: -1 };
        break;
      default:
        sortStage = { rating: -1, views: -1 };
    }

    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute search
    const books = await Book.aggregate(pipeline);

    // Get total count
    const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    countPipeline.push({ $count: 'total' });
    const countResult = await Book.aggregate(countPipeline);
    const totalBooks = countResult.length > 0 ? countResult[0].total : 0;

    return {
      books,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
      query,
      filters
    };
  }

  /**
   * Get popular search terms and categories
   */
  async getPopularSearchData() {
    const popularCategories = await Book.aggregate([
      {
        $match: { isActive: true, isPublished: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { totalViews: -1, count: -1 } },
      { $limit: 10 }
    ]);

    const popularTags = await Book.aggregate([
      {
        $match: { isActive: true, isPublished: true }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const popularAuthors = await Book.aggregate([
      {
        $match: { isActive: true, isPublished: true }
      },
      {
        $group: {
          _id: '$author',
          bookCount: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { totalViews: -1, bookCount: -1 } },
      { $limit: 10 }
    ]);

    return {
      categories: popularCategories,
      tags: popularTags,
      authors: popularAuthors
    };
  }
}

export default new BookService();
