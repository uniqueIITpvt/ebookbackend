import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * Blog Schema
 * Based on the frontend blogs.json structure
 */
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxLength: [200, 'Title cannot be more than 200 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Blog excerpt is required'],
      // Note: Length validation (plain text) is handled in middleware
      // HTML content can be longer than plain text limit
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      // Note: Length validation (plain text) is handled in middleware
      // HTML content can be longer than plain text limit
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      default: 'Dr. Syed M Quadri',
      trim: true,
    },
    authorBio: {
      type: String,
      trim: true,
      maxLength: [1000, 'Author bio cannot be more than 1000 characters'],
    },
    authorAvatar: {
      type: String,
      trim: true,
      default: '/sayyed-quadri.png',
    },
    publishDate: {
      type: Date,
      required: [true, 'Publish date is required'],
      default: Date.now,
    },
    readTime: {
      type: String,
      trim: true,
      default: '5 min read',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      validate: {
        validator: function(v) {
          const allowedCategories = [
            'General Health',
            'Mental Health',
            'Cardiovascular Health',
            'Preventive Care',
            'Lifestyle Medicine',
            'Diabetes Care',
            'Nutrition',
            'Wellness',
            'Medical Research',
            'Patient Education'
          ];
          
          return allowedCategories.includes(v) || 
                 (v.length >= 2 && v.length <= 50 && /^[a-zA-Z\s&-]+$/.test(v));
        },
        message: 'Category must be a valid category name'
      }
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    image: {
      type: String,
      trim: true,
    },
    // Image file information from Cloudinary
    imageCloudinary: {
      publicId: String,
      url: String,
      originalName: String,
      fileSize: Number,
      mimeType: String,
      width: Number,
      height: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
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
    seoKeywords: [{
      type: String,
      trim: true,
    }],
    // Content metadata
    wordCount: {
      type: Number,
      default: 0,
    },
    estimatedReadTime: {
      type: Number, // in minutes
      default: 0,
    },
    // Table of contents (auto-generated from headings)
    tableOfContents: [{
      level: Number,
      title: String,
      anchor: String,
    }],
    // Related content
    relatedBlogs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    }],
    // Engagement metrics
    averageReadTime: {
      type: Number, // in seconds
      default: 0,
      min: 0,
    },
    completionRate: {
      type: Number, // percentage (0-100)
      default: 0,
      min: 0,
      max: 100,
    },
    shares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
    },
    // Comments (if enabled)
    commentsEnabled: {
      type: Boolean,
      default: true,
    },
    commentsCount: {
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
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ featured: 1 });
blogSchema.index({ publishDate: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ likes: -1 });
blogSchema.index({ isActive: 1, isPublished: 1 });
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1 });

// Virtual for engagement score
blogSchema.virtual('engagementScore').get(function () {
  const viewsWeight = 0.4;
  const likesWeight = 0.3;
  const sharesWeight = 0.2;
  const completionWeight = 0.1;
  
  const totalShares = Object.values(this.shares || {}).reduce((sum, val) => sum + val, 0);
  
  return Math.round(
    (this.views * viewsWeight) +
    (this.likes * likesWeight) +
    (totalShares * sharesWeight) +
    (this.completionRate * completionWeight)
  );
});

// Pre-save middleware to generate slug and metadata
blogSchema.pre('save', function (next) {
  // Generate slug
  if (!this.slug || this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  
  // Calculate word count
  if (this.isModified('content')) {
    this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate estimated read time (average 200 words per minute)
    this.estimatedReadTime = Math.ceil(this.wordCount / 200);
    this.readTime = `${this.estimatedReadTime} min read`;
    
    // Generate table of contents from markdown headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const toc = [];
    let match;
    
    while ((match = headingRegex.exec(this.content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const anchor = slugify(title, { lower: true, strict: true });
      
      toc.push({ level, title, anchor });
    }
    
    this.tableOfContents = toc;
  }
  
  // Generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = this.title.length > 60 ? this.title.substring(0, 57) + '...' : this.title;
  }
  
  if (!this.seoDescription && this.excerpt) {
    this.seoDescription = this.excerpt.length > 160 ? this.excerpt.substring(0, 157) + '...' : this.excerpt;
  }
  
  // Sync status with isPublished
  if (this.isModified('isPublished')) {
    this.status = this.isPublished ? 'published' : 'draft';
  }
  
  next();
});

// Static methods for common queries
blogSchema.statics.findPublished = function (filter = {}) {
  return this.find({
    ...filter,
    isActive: true,
    isPublished: true,
    status: 'published',
  });
};

blogSchema.statics.findFeatured = function (limit = 1) {
  return this.findPublished({ featured: true })
    .sort({ publishDate: -1, views: -1 })
    .limit(limit);
};

blogSchema.statics.findLatest = function (limit = 10) {
  return this.findPublished()
    .sort({ publishDate: -1 })
    .limit(limit);
};

blogSchema.statics.findByCategory = function (category, limit = 20) {
  return this.findPublished({ category: new RegExp(category, 'i') })
    .sort({ publishDate: -1 })
    .limit(limit);
};

blogSchema.statics.findByAuthor = function (author, limit = 20) {
  return this.findPublished({ author: new RegExp(author, 'i') })
    .sort({ publishDate: -1 })
    .limit(limit);
};

blogSchema.statics.searchBlogs = function (query, options = {}) {
  const {
    category,
    author,
    tags,
    limit = 20,
    skip = 0,
    sortBy = 'relevance'
  } = options;

  let searchFilter = {
    isActive: true,
    isPublished: true,
    status: 'published',
  };

  // Text search
  if (query) {
    searchFilter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    searchFilter.category = new RegExp(category, 'i');
  }

  // Author filter
  if (author) {
    searchFilter.author = new RegExp(author, 'i');
  }

  // Tags filter
  if (tags && tags.length > 0) {
    searchFilter.tags = { $in: tags };
  }

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
    case 'relevance':
    default:
      if (query) {
        sortOptions = { score: { $meta: 'textScore' } };
      } else {
        sortOptions = { publishDate: -1, views: -1 };
      }
      break;
  }

  return this.find(searchFilter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Instance methods
blogSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

blogSchema.methods.incrementLikes = function () {
  this.likes += 1;
  return this.save();
};

blogSchema.methods.incrementShare = function (platform) {
  if (this.shares && this.shares[platform] !== undefined) {
    this.shares[platform] += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

blogSchema.methods.updateEngagement = function (readTime, completed = false) {
  // Update average read time
  const currentTotal = this.averageReadTime * this.views;
  this.averageReadTime = (currentTotal + readTime) / (this.views + 1);
  
  // Update completion rate
  if (completed) {
    const currentCompletions = Math.round((this.completionRate / 100) * this.views);
    this.completionRate = ((currentCompletions + 1) / (this.views + 1)) * 100;
  }
  
  return this.save();
};

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
