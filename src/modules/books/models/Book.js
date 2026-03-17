import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * Book Schema
 * Based on the frontend books.json structure
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxLength: [200, 'Title cannot be more than 200 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxLength: [300, 'Subtitle cannot be more than 300 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      default: 'uniqueIIT Research Center',
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Book description is required'],
      trim: true,
      maxLength: [2000, 'Description cannot be more than 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // Validation removed - category no longer needs to exist in Category collection
    },
    type: {
      type: String,
      required: [true, 'Book type is required'],
      enum: ['Books', 'Audiobook'],
      default: 'Books',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews count cannot be negative'],
    },
    pages: {
      type: Number,
      min: [1, 'Pages must be at least 1'],
    },
    duration: {
      type: String, // For audiobooks
      trim: true,
    },
    narrator: {
      type: String, // For audiobooks
      trim: true,
    },
    publishDate: {
      type: Date,
      required: [true, 'Publish date is required'],
      default: Date.now,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty ISBN
          // Basic ISBN validation (10 or 13 digits with possible hyphens)
          return /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/.test(v);
        },
        message: 'Please provide a valid ISBN'
      }
    },
    format: [{
      type: String,
      enum: ['Hardcover', 'Paperback', 'E-book', 'Audiobook', 'PDF', 'Digital Download'],
    }],
    contentKind: {
      type: String,
      enum: ['book', 'summary'],
      default: 'book',
      index: true,
    },
    accessLevel: {
      type: String,
      enum: ['free', 'premium'],
      default: 'premium',
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    premiumPublishedAt: {
      type: Date,
      index: true,
    },
    image: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    imageCloudinary: {
      publicId: String,
      url: String,
      originalName: String,
    },
    // File storage for e-books and audiobooks
    files: {
      ebook: {
        url: String,
        publicId: String,
        originalName: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      },
      audiobook: {
        url: String,
        publicId: String,
        originalName: String,
        fileSize: Number,
        mimeType: String,
        duration: String, // Audio duration in format "HH:MM:SS"
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    },
    featured: {
      type: Boolean,
      default: false,
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'published', 'archived'],
      default: 'draft',
    },
    sales: {
      type: Number,
      default: 0,
      min: [0, 'Sales cannot be negative'],
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    // SEO fields
    seoTitle: {
      type: String,
      trim: true,
      maxLength: [60, 'SEO title cannot be more than 60 characters'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxLength: [160, 'SEO description cannot be more than 160 characters'],
    },
    // Additional metadata
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    edition: {
      type: String,
      trim: true,
    },
    // Availability and inventory
    inStock: {
      type: Boolean,
      default: true,
    },
    stockCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
bookSchema.index({ title: 'text', description: 'text', tags: 'text', author: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ type: 1 });
bookSchema.index({ featured: 1 });
bookSchema.index({ bestseller: 1 });
bookSchema.index({ rating: -1 });
bookSchema.index({ publishDate: -1 });
bookSchema.index({ views: -1 });
bookSchema.index({ isActive: 1, isPublished: 1 });
bookSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Virtual for formatted price display (frontend expects string format)
bookSchema.virtual('formattedPrice').get(function () {
  if (!this.price) return null;
  return `$${this.price.toFixed(2)}`;
});

// Virtual for formatted original price
bookSchema.virtual('formattedOriginalPrice').get(function () {
  if (!this.originalPrice) return null;
  return `$${this.originalPrice.toFixed(2)}`;
});

// Virtual for discount percentage
bookSchema.virtual('discountPercentage').get(function () {
  if (!this.originalPrice || !this.price) return 0;
  
  let original, current;
  
  // Handle originalPrice (could be number or string)
  if (typeof this.originalPrice === 'number') {
    original = this.originalPrice;
  } else {
    original = parseFloat(this.originalPrice.replace(/[^0-9.]/g, ''));
  }
  
  // Handle price (could be number or string)
  if (typeof this.price === 'number') {
    current = this.price;
  } else {
    current = parseFloat(this.price.replace(/[^0-9.]/g, ''));
  }
  
  if (isNaN(original) || isNaN(current) || original <= current) return 0;
  
  return Math.round(((original - current) / original) * 100);
});

// Virtual for reading time estimate (assuming 250 words per page, 200 words per minute)
bookSchema.virtual('estimatedReadingTime').get(function () {
  if (!this.pages) return null;
  const wordsPerPage = 250;
  const wordsPerMinute = 200;
  const totalWords = this.pages * wordsPerPage;
  const minutes = Math.ceil(totalWords / wordsPerMinute);
  
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
});

// Pre-save middleware to generate slug
bookSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  
  // Generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = this.title.length > 60 ? this.title.substring(0, 57) + '...' : this.title;
  }
  
  if (!this.seoDescription && this.description) {
    this.seoDescription = this.description.length > 160 ? this.description.substring(0, 157) + '...' : this.description;
  }
  
  next();
});

// Static methods for common queries
bookSchema.statics.findPublished = function (filter = {}) {
  return this.find({
    ...filter,
    isActive: true,
    isPublished: true,
  });
};

bookSchema.statics.findFeatured = function (limit = 5) {
  return this.findPublished({ featured: true })
    .sort({ rating: -1, views: -1, createdAt: -1 })
    .limit(limit);
};

bookSchema.statics.findBestsellers = function (limit = 10) {
  return this.findPublished({ bestseller: true })
    .sort({ rating: -1, reviews: -1, views: -1 })
    .limit(limit);
};

bookSchema.statics.findByCategory = function (category, limit = 20) {
  return this.findPublished({ category: new RegExp(category, 'i') })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);
};

bookSchema.statics.searchBooks = function (query, options = {}) {
  const {
    category,
    type,
    minRating,
    maxPrice,
    tags,
    limit = 20,
    skip = 0,
    sortBy = 'relevance'
  } = options;

  let searchFilter = {
    isActive: true,
    isPublished: true,
  };

  // Text search
  if (query) {
    searchFilter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    searchFilter.category = new RegExp(category, 'i');
  }

  // Type filter
  if (type) {
    searchFilter.type = type;
  }

  // Rating filter
  if (minRating) {
    searchFilter.rating = { $gte: minRating };
  }

  // Price filter
  if (maxPrice) {
    // This is a simplified price filter - in production, you'd want to store numeric prices
    searchFilter.price = { $regex: new RegExp(`\\$([0-9]+\\.?[0-9]*)`, 'i') };
  }

  // Tags filter
  if (tags && tags.length > 0) {
    searchFilter.tags = { $in: tags };
  }

  let sortOptions = {};
  switch (sortBy) {
    case 'rating':
      sortOptions = { rating: -1, reviews: -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'oldest':
      sortOptions = { createdAt: 1 };
      break;
    case 'popular':
      sortOptions = { views: -1, rating: -1 };
      break;
    case 'relevance':
    default:
      if (query) {
        sortOptions = { score: { $meta: 'textScore' } };
      } else {
        sortOptions = { rating: -1, views: -1 };
      }
      break;
  }

  return this.find(searchFilter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Instance methods
bookSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

bookSchema.methods.updateRating = function (newRating, reviewCount) {
  this.rating = newRating;
  this.reviews = reviewCount;
  return this.save();
};

const Book = mongoose.model('Book', bookSchema);

export default Book;
