import mongoose from 'mongoose';
import slugify from 'slugify';

const audiobookSchema = new mongoose.Schema(
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
    },
    type: {
      type: String,
      default: 'Audiobook',
      immutable: true,
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
      type: String,
      trim: true,
    },
    narrator: {
      type: String,
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
      sparse: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/.test(
            v
          );
        },
        message: 'Please provide a valid ISBN',
      },
    },
    format: [
      {
        type: String,
        enum: ['Hardcover', 'Paperback', 'E-book', 'Audiobook', 'PDF', 'Digital Download'],
      },
    ],
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
    files: {
      ebook: {
        url: String,
        publicId: String,
        originalName: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
      audiobook: {
        url: String,
        publicId: String,
        originalName: String,
        fileSize: Number,
        mimeType: String,
        duration: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
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
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
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
    collection: 'audiobooks',
  }
);

audiobookSchema.index({ title: 'text', description: 'text', tags: 'text', author: 'text' });
audiobookSchema.index({ category: 1 });
audiobookSchema.index({ featured: 1 });
audiobookSchema.index({ bestseller: 1 });
audiobookSchema.index({ rating: -1 });
audiobookSchema.index({ publishDate: -1 });
audiobookSchema.index({ views: -1 });
audiobookSchema.index({ isActive: 1, isPublished: 1 });
audiobookSchema.index({ slug: 1 }, { unique: true, sparse: true });

audiobookSchema.virtual('formattedPrice').get(function () {
  if (!this.price) return null;
  return `$${this.price.toFixed(2)}`;
});

audiobookSchema.virtual('formattedOriginalPrice').get(function () {
  if (!this.originalPrice) return null;
  return `$${this.originalPrice.toFixed(2)}`;
});

audiobookSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  if (!this.seoTitle) {
    this.seoTitle =
      this.title.length > 60 ? this.title.substring(0, 57) + '...' : this.title;
  }

  if (!this.seoDescription && this.description) {
    this.seoDescription =
      this.description.length > 160
        ? this.description.substring(0, 157) + '...'
        : this.description;
  }

  if (Array.isArray(this.format) && !this.format.includes('Audiobook')) {
    this.format = [...this.format, 'Audiobook'];
  }

  next();
});

const Audiobook = mongoose.model('Audiobook', audiobookSchema);

export default Audiobook;
