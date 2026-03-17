import Book from '../models/Book.js';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler.js';
import { config } from '../../../config/index.js';
import { deleteFromCloudinary } from '../../../shared/middleware/fileUpload.js';

/**
 * Transform book data for frontend compatibility
 * Converts backend format to match frontend expectations
 */
const transformBookForFrontend = (book) => {
  const bookObj = book.toObject({ virtuals: true });
  
  return {
    ...bookObj,
    // Transform prices to string format expected by frontend
    price: bookObj.formattedPrice || `$${book.price?.toFixed(2) || '0.00'}`,
    originalPrice: bookObj.formattedOriginalPrice || (book.originalPrice ? `$${book.originalPrice.toFixed(2)}` : null),
    // Ensure format field is present (renamed from formats)
    format: bookObj.format || [],
    // Convert MongoDB _id to id for frontend
    id: bookObj._id,
    // Add slug for SEO-friendly URLs
    slug: bookObj.slug,
    // Include file information for frontend
    files: {
      ebook: bookObj.files?.ebook ? {
        url: bookObj.files.ebook.url,
        originalName: bookObj.files.ebook.originalName,
        fileSize: bookObj.files.ebook.fileSize,
        mimeType: bookObj.files.ebook.mimeType,
        uploadedAt: bookObj.files.ebook.uploadedAt
      } : null,
      audiobook: bookObj.files?.audiobook ? {
        url: bookObj.files.audiobook.url,
        originalName: bookObj.files.audiobook.originalName,
        fileSize: bookObj.files.audiobook.fileSize,
        mimeType: bookObj.files.audiobook.mimeType,
        duration: bookObj.files.audiobook.duration,
        uploadedAt: bookObj.files.audiobook.uploadedAt
      } : null
    }
  };
};

/**
 * Book Controller
 * Handles all book-related operations
 */
class BookController {
  /**
   * @desc    Get all books with filtering, sorting, and pagination
   * @route   GET /api/v1/books
   * @access  Public
   */
  getAllBooks = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = config.pagination.defaultLimit,
      category,
      type,
      featured,
      bestseller,
      author,
      minRating,
      maxPrice,
      tags,
      search,
      sortBy = 'newest',
      isActive = true,
      isPublished = true,
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Handle boolean conversion properly
    if (isActive !== undefined) {
      filter.isActive = isActive === true || isActive === 'true';
    }
    if (isPublished !== undefined) {
      filter.isPublished = isPublished === true || isPublished === 'true';
    }
    if (category) filter.category = new RegExp(category, 'i');
    if (type) filter.type = type;
    if (featured !== undefined) filter.featured = featured === true || featured === 'true';
    if (bestseller !== undefined) filter.bestseller = bestseller === true || bestseller === 'true';
    if (author) filter.author = new RegExp(author, 'i');
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
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
      case 'rating':
        sortOptions = { rating: -1, reviews: -1 };
        break;
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'popular':
        sortOptions = { views: -1, rating: -1 };
        break;
      case 'oldest':
        sortOptions = { publishDate: 1 };
        break;
      case 'newest':
      default:
        sortOptions = search 
          ? { score: { $meta: 'textScore' }, rating: -1 }
          : { publishDate: -1, rating: -1 };
        break;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [books, totalBooks] = await Promise.all([
      Book.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Book.countDocuments(filter)
    ]);

    // Transform books for frontend compatibility
    const transformedBooks = books.map(book => transformBookForFrontend(book));

    // Calculate pagination info
    const totalPages = Math.ceil(totalBooks / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: transformedBooks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBooks,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
      filters: {
        category,
        type,
        featured,
        bestseller,
        author,
        minRating,
        tags,
        search,
        sortBy,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get featured books
   * @route   GET /api/v1/books/featured
   * @access  Public
   */
  getFeaturedBooks = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    
    const books = await Book.findFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      data: books,
      count: books.length,
      message: 'Featured books retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get bestseller books
   * @route   GET /api/v1/books/bestsellers
   * @access  Public
   */
  getBestsellerBooks = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const books = await Book.findBestsellers(parseInt(limit));

    res.status(200).json({
      success: true,
      data: books,
      count: books.length,
      message: 'Bestseller books retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get trending books (for Lending page section)
   * @route   GET /api/v1/books/trending
   * @access  Public
   */
  getTrendingBooks = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);

    const books = await Book.find({
      contentKind: 'book',
      isTrending: true,
      isActive: true,
      isPublished: true,
    })
    .sort({ publishDate: -1, views: -1, rating: -1 })
    .limit(limitNum);

    const transformedBooks = books.map(book => transformBookForFrontend(book));

    res.status(200).json({
      success: true,
      data: transformedBooks,
      count: transformedBooks.length,
      message: 'Trending books retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get free summaries (for Lending page section)
   * @route   GET /api/v1/books/summaries/free
   * @access  Public
   */
  getFreeSummaries = asyncHandler(async (req, res) => {
    const { limit = 12 } = req.query;
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);

    const summaries = await Book.find({
      contentKind: 'summary',
      accessLevel: 'free',
      isActive: true,
      isPublished: true,
    })
    .sort({ publishDate: -1, createdAt: -1 })
    .limit(limitNum);

    const transformed = summaries.map(book => transformBookForFrontend(book));

    res.status(200).json({
      success: true,
      data: transformed,
      count: transformed.length,
      message: 'Free summaries retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get new premium summaries (for Lending page section)
   * @route   GET /api/v1/books/summaries/premium/new
   * @access  Public
   */
  getNewPremiumSummaries = asyncHandler(async (req, res) => {
    const { limit = 12 } = req.query;
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);

    const summaries = await Book.find({
      contentKind: 'summary',
      accessLevel: 'premium',
      isActive: true,
      isPublished: true,
    })
    .sort({ premiumPublishedAt: -1, publishDate: -1, createdAt: -1 })
    .limit(limitNum);

    const transformed = summaries.map(book => transformBookForFrontend(book));

    res.status(200).json({
      success: true,
      data: transformed,
      count: transformed.length,
      message: 'New premium summaries retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get books by category
   * @route   GET /api/v1/books/category/:category
   * @access  Public
   */
  getBooksByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [books, totalBooks] = await Promise.all([
      Book.findByCategory(category, limitNum).skip(skip),
      Book.countDocuments({ 
        category: new RegExp(category, 'i'),
        isActive: true,
        isPublished: true 
      })
    ]);

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: `No books found in category: ${category}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const totalPages = Math.ceil(totalBooks / limitNum);

    res.status(200).json({
      success: true,
      data: books,
      category,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBooks,
        limit: limitNum,
      },
      message: `Books in category '${category}' retrieved successfully`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get single book by ID or slug
   * @route   GET /api/v1/books/:identifier
   * @access  Public
   */
  getBook = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by slug
    let book;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId
      book = await Book.findById(identifier);
    } else {
      // Assume it's a slug
      book = await Book.findOne({ slug: identifier });
    }

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    if (!book.isActive || !book.isPublished) {
      throw new AppError('Book is not available', 404);
    }

    // Increment views (fire and forget)
    book.incrementViews().catch(err => 
      console.error('Error incrementing book views:', err)
    );

    // Transform book for frontend compatibility
    const transformedBook = transformBookForFrontend(book);

    res.status(200).json({
      success: true,
      data: transformedBook,
      message: 'Book retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Search books
   * @route   GET /api/v1/books/search
   * @access  Public
   */
  searchBooks = asyncHandler(async (req, res) => {
    const {
      q: query,
      category,
      type,
      minRating,
      maxPrice,
      tags,
      page = 1,
      limit = config.pagination.defaultLimit,
      sortBy = 'relevance'
    } = req.query;

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters long', 400);
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);
    const skip = (pageNum - 1) * limitNum;

    const searchOptions = {
      category,
      type,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined,
      limit: limitNum,
      skip,
      sortBy
    };

    const [books, totalBooks] = await Promise.all([
      Book.searchBooks(query.trim(), searchOptions),
      Book.countDocuments({
        $text: { $search: query.trim() },
        isActive: true,
        isPublished: true,
        ...(category && { category: new RegExp(category, 'i') }),
        ...(type && { type }),
        ...(minRating && { rating: { $gte: parseFloat(minRating) } }),
      })
    ]);

    // Transform books for frontend compatibility
    const transformedBooks = books.map(book => transformBookForFrontend(book));

    const totalPages = Math.ceil(totalBooks / limitNum);

    res.status(200).json({
      success: true,
      data: transformedBooks,
      searchQuery: query,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBooks,
        limit: limitNum,
      },
      filters: searchOptions,
      message: `Search results for "${query}"`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get book categories
   * @route   GET /api/v1/books/categories
   * @access  Public
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await Book.distinct('category');

    res.status(200).json({
      success: true,
      data: categories.filter(cat => cat), // Remove null/undefined categories
      count: categories.length,
      message: 'Book categories retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get book statistics
   * @route   GET /api/v1/books/stats
   * @access  Public
   */
  getBookStats = asyncHandler(async (req, res) => {
    const stats = await Book.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          featured: { $sum: { $cond: ['$featured', 1, 0] } },
          bestsellers: { $sum: { $cond: ['$bestseller', 1, 0] } },
          totalSales: { $sum: { $ifNull: ['$sales', 0] } },
          categories: { $addToSet: '$category' },
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          published: 1,
          featured: 1,
          bestsellers: 1,
          totalSales: 1,
          categories: 1,
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      published: 0,
      featured: 0,
      bestsellers: 0,
      totalSales: 0,
      categories: [],
    };

    res.status(200).json({
      success: true,
      data: result,
      message: 'Book statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Create a new book
   * @route   POST /api/v1/books
   * @access  Admin
   */
  createBook = asyncHandler(async (req, res) => {
    try {
      const bookData = req.body;
      const uploadedFiles = req.uploadedFiles || {};

      // Log the incoming data for debugging
      console.log('Creating book with data:', JSON.stringify(bookData, null, 2));
      console.log('Uploaded files:', uploadedFiles);

      // Ensure required fields have defaults if not provided
      const processedData = {
        ...bookData,
        status: bookData.status || 'draft',
        sales: bookData.sales || 0,
        rating: bookData.rating || 0,
        reviews: bookData.reviews || 0,
        featured: bookData.featured || false,
        bestseller: bookData.bestseller || false,
        isActive: bookData.isActive !== undefined ? bookData.isActive : true,
        isPublished: bookData.isPublished !== undefined ? bookData.isPublished : true,
      };

      // Add uploaded file information (from Cloudinary or use base64 from body)
      console.log('In createBook - uploadedFiles:', JSON.stringify({
        coverImage: uploadedFiles.coverImage ? { url: uploadedFiles.coverImage.url ? 'base64 present' : 'null', originalName: uploadedFiles.coverImage.originalName } : null
      }));
      console.log('In createBook - bookData.image:', bookData.image ? (bookData.image.startsWith('data:image') ? 'base64 present' : 'not base64') : 'null');
      
      if (uploadedFiles.coverImage?.url) {
        // Cloudinary upload successful
        processedData.image = uploadedFiles.coverImage.url;
        processedData.coverImage = uploadedFiles.coverImage.url;
        processedData.imageCloudinary = {
          publicId: uploadedFiles.coverImage.publicId,
          url: uploadedFiles.coverImage.url,
          originalName: uploadedFiles.coverImage.originalName
        };
        console.log('Set image from uploadedFiles.coverImage.url');
      } else if (bookData.image && bookData.image.startsWith('data:image')) {
        // Use base64 image directly from request body
        processedData.image = bookData.image;
        processedData.coverImage = bookData.image;
        processedData.imageCloudinary = null;
        console.log('Set image from bookData.image');
      } else {
        console.log('No image source found!');
      }
      
      console.log('Final processedData.image:', processedData.image ? 'present' : 'null');

      // Initialize files object
      processedData.files = {};

      // Add e-book file information
      if (uploadedFiles.ebookFile) {
        processedData.files.ebook = {
          url: uploadedFiles.ebookFile.url,
          publicId: uploadedFiles.ebookFile.publicId,
          originalName: uploadedFiles.ebookFile.originalName,
          fileSize: uploadedFiles.ebookFile.fileSize,
          mimeType: uploadedFiles.ebookFile.mimeType,
          uploadedAt: new Date()
        };
      }

      // Add audiobook file information
      if (uploadedFiles.audiobookFile) {
        processedData.files.audiobook = {
          url: uploadedFiles.audiobookFile.url,
          publicId: uploadedFiles.audiobookFile.publicId,
          originalName: uploadedFiles.audiobookFile.originalName,
          fileSize: uploadedFiles.audiobookFile.fileSize,
          mimeType: uploadedFiles.audiobookFile.mimeType,
          duration: uploadedFiles.audiobookFile.duration,
          uploadedAt: new Date()
        };
      }

      // Create the book
      const book = await Book.create(processedData);

      // Transform book for frontend compatibility
      const transformedBook = transformBookForFrontend(book);

      res.status(201).json({
        success: true,
        data: transformedBook,
        message: 'Book created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating book:', error);
      
      // Clean up uploaded files if book creation fails
      if (req.uploadedFiles) {
        const cleanupPromises = [];
        
        if (req.uploadedFiles.coverImage) {
          cleanupPromises.push(
            deleteFromCloudinary(req.uploadedFiles.coverImage.publicId, 'image')
              .catch(err => console.error('Error cleaning up cover image:', err))
          );
        }
        
        if (req.uploadedFiles.ebookFile) {
          cleanupPromises.push(
            deleteFromCloudinary(req.uploadedFiles.ebookFile.publicId, 'raw')
              .catch(err => console.error('Error cleaning up e-book file:', err))
          );
        }
        
        if (req.uploadedFiles.audiobookFile) {
          cleanupPromises.push(
            deleteFromCloudinary(req.uploadedFiles.audiobookFile.publicId, 'video')
              .catch(err => console.error('Error cleaning up audiobook file:', err))
          );
        }
        
        await Promise.allSettled(cleanupPromises);
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        throw new AppError(`Validation Error: ${errors.join(', ')}`, 400);
      }
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(`${field} already exists`, 400);
      }
      
      throw error;
    }
  });

  /**
   * @desc    Update a book
   * @route   PUT /api/v1/books/:id
   * @access  Admin
   */
  updateBook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const uploadedFiles = req.uploadedFiles || {};

    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    // Store old file references for cleanup
    const oldFiles = {
      coverImage: book.imageCloudinary?.publicId,
      ebook: book.files?.ebook?.publicId,
      audiobook: book.files?.audiobook?.publicId
    };

    // Prepare update data
    const processedUpdateData = { ...updateData };
    
    // Remove image fields from update data if no new image is being uploaded
    // This preserves the existing image in the database
    if (!uploadedFiles.coverImage?.url && !(updateData.image && updateData.image.startsWith('data:image'))) {
      delete processedUpdateData.image;
      delete processedUpdateData.coverImage;
    }

    // Handle cover image update (from Cloudinary or base64 from body)
    if (uploadedFiles.coverImage?.url) {
      // Cloudinary upload successful
      processedUpdateData.image = uploadedFiles.coverImage.url;
      processedUpdateData.coverImage = uploadedFiles.coverImage.url;
      processedUpdateData.imageCloudinary = {
        publicId: uploadedFiles.coverImage.publicId,
        url: uploadedFiles.coverImage.url,
        originalName: uploadedFiles.coverImage.originalName
      };
    } else if (updateData.image && updateData.image.startsWith('data:image')) {
      // Use base64 image directly from request body
      processedUpdateData.image = updateData.image;
      processedUpdateData.coverImage = updateData.image;
      processedUpdateData.imageCloudinary = null;
    }

    // Handle file updates
    if (uploadedFiles.ebookFile || uploadedFiles.audiobookFile) {
      // Preserve existing files object
      processedUpdateData.files = book.files || {};

      // Update e-book file
      if (uploadedFiles.ebookFile) {
        processedUpdateData.files.ebook = {
          url: uploadedFiles.ebookFile.url,
          publicId: uploadedFiles.ebookFile.publicId,
          originalName: uploadedFiles.ebookFile.originalName,
          fileSize: uploadedFiles.ebookFile.fileSize,
          mimeType: uploadedFiles.ebookFile.mimeType,
          uploadedAt: new Date()
        };
      }

      // Update audiobook file
      if (uploadedFiles.audiobookFile) {
        processedUpdateData.files.audiobook = {
          url: uploadedFiles.audiobookFile.url,
          publicId: uploadedFiles.audiobookFile.publicId,
          originalName: uploadedFiles.audiobookFile.originalName,
          fileSize: uploadedFiles.audiobookFile.fileSize,
          mimeType: uploadedFiles.audiobookFile.mimeType,
          duration: uploadedFiles.audiobookFile.duration,
          uploadedAt: new Date()
        };
      }
    }

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { ...processedUpdateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Clean up old files after successful update
    const cleanupPromises = [];
    
    if (uploadedFiles.coverImage && oldFiles.coverImage) {
      cleanupPromises.push(
        deleteFromCloudinary(oldFiles.coverImage, 'image')
          .catch(err => console.error('Error cleaning up old cover image:', err))
      );
    }
    
    if (uploadedFiles.ebookFile && oldFiles.ebook) {
      cleanupPromises.push(
        deleteFromCloudinary(oldFiles.ebook, 'raw')
          .catch(err => console.error('Error cleaning up old e-book file:', err))
      );
    }
    
    if (uploadedFiles.audiobookFile && oldFiles.audiobook) {
      cleanupPromises.push(
        deleteFromCloudinary(oldFiles.audiobook, 'video')
          .catch(err => console.error('Error cleaning up old audiobook file:', err))
      );
    }
    
    // Fire and forget cleanup
    if (cleanupPromises.length > 0) {
      Promise.allSettled(cleanupPromises).catch(err => 
        console.error('Error during file cleanup:', err)
      );
    }

    // Transform book for frontend compatibility
    const transformedBook = transformBookForFrontend(updatedBook);

    res.status(200).json({
      success: true,
      data: transformedBook,
      message: 'Book updated successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Delete a book
   * @route   DELETE /api/v1/books/:id
   * @access  Admin
   */
  deleteBook = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    // Store file references for cleanup
    const filesToDelete = [];
    
    if (book.imageCloudinary?.publicId) {
      filesToDelete.push({
        publicId: book.imageCloudinary.publicId,
        resourceType: 'image'
      });
    }
    
    if (book.files?.ebook?.publicId) {
      filesToDelete.push({
        publicId: book.files.ebook.publicId,
        resourceType: 'raw'
      });
    }
    
    if (book.files?.audiobook?.publicId) {
      filesToDelete.push({
        publicId: book.files.audiobook.publicId,
        resourceType: 'video'
      });
    }

    // Delete the book from database
    await Book.findByIdAndDelete(id);

    // Clean up files from Cloudinary (fire and forget)
    if (filesToDelete.length > 0) {
      const cleanupPromises = filesToDelete.map(file => 
        deleteFromCloudinary(file.publicId, file.resourceType)
          .catch(err => console.error(`Error deleting ${file.resourceType} file:`, err))
      );
      
      Promise.allSettled(cleanupPromises).catch(err => 
        console.error('Error during file cleanup:', err)
      );
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Remove e-book file from a book
   * @route   DELETE /api/v1/books/:id/files/ebook
   * @access  Admin
   */
  removeEbookFile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    if (!book.files?.ebook?.publicId) {
      throw new AppError('No e-book file found for this book', 404);
    }

    const ebookPublicId = book.files.ebook.publicId;

    // Remove e-book file from book document
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { 
        $unset: { 'files.ebook': 1 },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    // Delete file from Cloudinary (fire and forget)
    deleteFromCloudinary(ebookPublicId, 'raw')
      .catch(err => console.error('Error deleting e-book file from Cloudinary:', err));

    // Transform book for frontend compatibility
    const transformedBook = transformBookForFrontend(updatedBook);

    res.status(200).json({
      success: true,
      data: transformedBook,
      message: 'E-book file removed successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Remove audiobook file from a book
   * @route   DELETE /api/v1/books/:id/files/audiobook
   * @access  Admin
   */
  removeAudiobookFile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    if (!book.files?.audiobook?.publicId) {
      throw new AppError('No audiobook file found for this book', 404);
    }

    const audiobookPublicId = book.files.audiobook.publicId;

    // Remove audiobook file from book document
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { 
        $unset: { 'files.audiobook': 1 },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    // Delete file from Cloudinary (fire and forget)
    deleteFromCloudinary(audiobookPublicId, 'video')
      .catch(err => console.error('Error deleting audiobook file from Cloudinary:', err));

    // Transform book for frontend compatibility
    const transformedBook = transformBookForFrontend(updatedBook);

    res.status(200).json({
      success: true,
      data: transformedBook,
      message: 'Audiobook file removed successfully',
      timestamp: new Date().toISOString(),
    });
  });
}

export default new BookController();
