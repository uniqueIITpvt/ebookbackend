import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * Trending Book Schema
 * For books that are currently trending/popular
 */
const trendingBookSchema = new mongoose.Schema(
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
      unique: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      default: 'UniqueIIT Research Center',
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
    publishDate: {
      type: Date,
      default: Date.now,
    },
    image: {
      type: String,
      trim: true,
    },
    imageCloudinary: {
      publicId: String,
      url: String,
      originalName: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
trendingBookSchema.index({ title: 'text', description: 'text', tags: 'text' });
trendingBookSchema.index({ category: 1 });
trendingBookSchema.index({ featured: 1 });
trendingBookSchema.index({ isActive: 1 });
trendingBookSchema.index({ rating: -1 });
trendingBookSchema.index({ views: -1 });
trendingBookSchema.index({ sales: -1 });
trendingBookSchema.index({ createdAt: -1 });
trendingBookSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Pre-save middleware to generate slug
trendingBookSchema.pre('save', function (next) {
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

// Static methods
trendingBookSchema.statics.findActive = function (filter = {}) {
  return this.find({
    ...filter,
    isActive: true,
  });
};

trendingBookSchema.statics.findFeatured = function (limit = 5) {
  return this.findActive({ featured: true })
    .sort({ rating: -1, views: -1 })
    .limit(limit);
};

trendingBookSchema.statics.findTopTrending = function (limit = 10) {
  return this.findActive()
    .sort({ views: -1, sales: -1, rating: -1 })
    .limit(limit);
};

const TrendingBook = mongoose.model('TrendingBook', trendingBookSchema);

export default TrendingBook;
