import mongoose from 'mongoose';

/**
 * Category Schema
 * For managing book categories dynamically
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxLength: [50, 'Category name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [200, 'Description cannot be more than 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    color: {
      type: String,
      default: '#1976d2', // Default blue color
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    },
    icon: {
      type: String,
      trim: true,
      default: 'book',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    bookCount: {
      type: Number,
      default: 0,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = this.name.length > 60 ? this.name.substring(0, 57) + '...' : this.name;
  }
  
  if (!this.seoDescription && this.description) {
    this.seoDescription = this.description.length > 160 ? this.description.substring(0, 157) + '...' : this.description;
  }
  
  next();
});

// Static methods for common queries
categorySchema.statics.findActive = function (sortBy = 'sortOrder') {
  const sortOptions = {};
  sortOptions[sortBy] = 1;
  
  return this.find({ isActive: true }).sort(sortOptions);
};

categorySchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isActive: true });
};

// Instance methods
categorySchema.methods.updateBookCount = async function () {
  const Book = mongoose.model('Book');
  this.bookCount = await Book.countDocuments({ 
    category: this.name,
    isActive: true,
    isPublished: true 
  });
  return this.save();
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
