import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * Premium Summary Schema
 * For premium book summaries that require subscription/payment
 */
const premiumSummarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Summary title is required'],
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
      required: [true, 'Summary description is required'],
      trim: true,
      maxLength: [2000, 'Description cannot be more than 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    originalBook: {
      type: String,
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
    pages: {
      type: Number,
      min: [1, 'Pages must be at least 1'],
    },
    readingTime: {
      type: String,
      trim: true,
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
    downloads: {
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
premiumSummarySchema.index({ title: 'text', description: 'text', tags: 'text' });
premiumSummarySchema.index({ category: 1 });
premiumSummarySchema.index({ featured: 1 });
premiumSummarySchema.index({ isActive: 1 });
premiumSummarySchema.index({ createdAt: -1 });
premiumSummarySchema.index({ slug: 1 }, { unique: true, sparse: true });

// Pre-save middleware to generate slug
premiumSummarySchema.pre('save', function (next) {
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
premiumSummarySchema.statics.findActive = function (filter = {}) {
  return this.find({
    ...filter,
    isActive: true,
  });
};

premiumSummarySchema.statics.findFeatured = function (limit = 5) {
  return this.findActive({ featured: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

premiumSummarySchema.statics.findLatest = function (limit = 10) {
  return this.findActive()
    .sort({ createdAt: -1 })
    .limit(limit);
};

const PremiumSummary = mongoose.model('PremiumSummary', premiumSummarySchema);

export default PremiumSummary;
