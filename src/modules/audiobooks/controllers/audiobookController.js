import Audiobook from '../models/Audiobook.js';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler.js';
import { config } from '../../../config/index.js';
import { deleteFromCloudinary } from '../../../shared/middleware/fileUpload.js';

const transform = (doc) => {
  const obj = doc.toObject({ virtuals: true });
  return {
    ...obj,
    price: obj.formattedPrice || `$${doc.price?.toFixed(2) || '0.00'}`,
    originalPrice:
      obj.formattedOriginalPrice || (doc.originalPrice ? `$${doc.originalPrice.toFixed(2)}` : null),
    format: obj.format || [],
    id: obj._id,
    slug: obj.slug,
    files: {
      ebook: obj.files?.ebook
        ? {
            url: obj.files.ebook.url,
            originalName: obj.files.ebook.originalName,
            fileSize: obj.files.ebook.fileSize,
            mimeType: obj.files.ebook.mimeType,
            uploadedAt: obj.files.ebook.uploadedAt,
          }
        : null,
      audiobook: obj.files?.audiobook
        ? {
            url: obj.files.audiobook.url,
            originalName: obj.files.audiobook.originalName,
            fileSize: obj.files.audiobook.fileSize,
            mimeType: obj.files.audiobook.mimeType,
            duration: obj.files.audiobook.duration,
            uploadedAt: obj.files.audiobook.uploadedAt,
          }
        : null,
    },
  };
};

class AudiobookController {
  getAll = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = config.pagination.defaultLimit,
      category,
      featured,
      bestseller,
      search,
      sortBy = 'newest',
      status,
      isActive = true,
      isPublished = true,
    } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === true || isActive === 'true';
    if (isPublished !== undefined) filter.isPublished = isPublished === true || isPublished === 'true';
    if (category) filter.category = new RegExp(category, 'i');
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === true || featured === 'true';
    if (bestseller !== undefined) filter.bestseller = bestseller === true || bestseller === 'true';
    if (search) filter.$text = { $search: search };

    let sortOptions = {};
    switch (sortBy) {
      case 'rating':
        sortOptions = { rating: -1, reviews: -1 };
        break;
      case 'popular':
        sortOptions = { views: -1, rating: -1 };
        break;
      case 'oldest':
        sortOptions = { publishDate: 1 };
        break;
      case 'newest':
      default:
        sortOptions = search ? { score: { $meta: 'textScore' } } : { publishDate: -1, createdAt: -1 };
        break;
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Audiobook.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Audiobook.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: items.map(transform),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBooks: total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
      },
      timestamp: new Date().toISOString(),
    });
  });

  getFeatured = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;

    const items = await Audiobook.find({
      featured: true,
      isActive: true,
      isPublished: true,
    })
      .sort({ rating: -1, views: -1, createdAt: -1 })
      .limit(Math.min(parseInt(limit), 50));

    res.status(200).json({
      success: true,
      data: items.map(transform),
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  });

  getBestsellers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const items = await Audiobook.find({
      bestseller: true,
      isActive: true,
      isPublished: true,
    })
      .sort({ rating: -1, reviews: -1, views: -1, createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100));

    res.status(200).json({
      success: true,
      data: items.map(transform),
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  });

  getTrending = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit), config.pagination.maxLimit);

    const items = await Audiobook.find({
      isTrending: true,
      isActive: true,
      isPublished: true,
    })
      .sort({ publishDate: -1, views: -1, rating: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: items.map(transform),
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  });

  getCategories = asyncHandler(async (req, res) => {
    const categories = await Audiobook.distinct('category', {
      isActive: true,
      isPublished: true,
    });

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
      timestamp: new Date().toISOString(),
    });
  });

  search = asyncHandler(async (req, res) => {
    const { q = '', limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);

    const items = await Audiobook.find({
      $text: { $search: q },
      isActive: true,
      isPublished: true,
    })
      .sort({ score: { $meta: 'textScore' }, publishDate: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: items.map(transform),
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  });

  getOne = asyncHandler(async (req, res) => {
    const { identifier } = req.params;

    const doc =
      (await Audiobook.findById(identifier).catch(() => null)) ||
      (await Audiobook.findOne({ slug: identifier })) ||
      (await Audiobook.findOne({ title: new RegExp(`^${identifier}$`, 'i') }));

    if (!doc) throw new AppError('Audiobook not found', 404);

    res.status(200).json({ success: true, data: transform(doc), timestamp: new Date().toISOString() });
  });

  create = asyncHandler(async (req, res) => {
    const data = req.body;
    const uploadedFiles = req.uploadedFiles || {};

    const processed = {
      ...data,
      type: 'Audiobook',
      status: data.status || 'draft',
      sales: data.sales || 0,
      rating: data.rating || 0,
      reviews: data.reviews || 0,
      featured: data.featured || false,
      bestseller: data.bestseller || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      files: {},
    };

    if (uploadedFiles.coverImage?.url) {
      processed.image = uploadedFiles.coverImage.url;
      processed.coverImage = uploadedFiles.coverImage.url;
      processed.imageCloudinary = {
        publicId: uploadedFiles.coverImage.publicId,
        url: uploadedFiles.coverImage.url,
        originalName: uploadedFiles.coverImage.originalName,
      };
    } else if (data.image && data.image.startsWith('data:image')) {
      processed.image = data.image;
      processed.coverImage = data.image;
      processed.imageCloudinary = null;
    }

    if (uploadedFiles.audiobookFile) {
      processed.files.audiobook = {
        url: uploadedFiles.audiobookFile.url,
        publicId: uploadedFiles.audiobookFile.publicId,
        originalName: uploadedFiles.audiobookFile.originalName,
        fileSize: uploadedFiles.audiobookFile.fileSize,
        mimeType: uploadedFiles.audiobookFile.mimeType,
        duration: uploadedFiles.audiobookFile.duration,
        uploadedAt: new Date(),
      };
    }

    const created = await Audiobook.create(processed);

    res.status(201).json({
      success: true,
      data: transform(created),
      message: 'Audiobook created successfully',
      timestamp: new Date().toISOString(),
    });
  });

  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const uploadedFiles = req.uploadedFiles || {};

    const doc = await Audiobook.findById(id);
    if (!doc) throw new AppError('Audiobook not found', 404);

    const old = {
      coverImage: doc.imageCloudinary?.publicId,
      audiobook: doc.files?.audiobook?.publicId,
    };

    const processed = { ...updateData, type: 'Audiobook' };

    if (!uploadedFiles.coverImage?.url && !(updateData.image && updateData.image.startsWith('data:image'))) {
      delete processed.image;
      delete processed.coverImage;
    }

    if (uploadedFiles.coverImage?.url) {
      processed.image = uploadedFiles.coverImage.url;
      processed.coverImage = uploadedFiles.coverImage.url;
      processed.imageCloudinary = {
        publicId: uploadedFiles.coverImage.publicId,
        url: uploadedFiles.coverImage.url,
        originalName: uploadedFiles.coverImage.originalName,
      };
    } else if (updateData.image && updateData.image.startsWith('data:image')) {
      processed.image = updateData.image;
      processed.coverImage = updateData.image;
      processed.imageCloudinary = null;
    }

    if (uploadedFiles.audiobookFile) {
      processed.files = doc.files || {};
      processed.files.audiobook = {
        url: uploadedFiles.audiobookFile.url,
        publicId: uploadedFiles.audiobookFile.publicId,
        originalName: uploadedFiles.audiobookFile.originalName,
        fileSize: uploadedFiles.audiobookFile.fileSize,
        mimeType: uploadedFiles.audiobookFile.mimeType,
        duration: uploadedFiles.audiobookFile.duration,
        uploadedAt: new Date(),
      };
    }

    const updated = await Audiobook.findByIdAndUpdate(id, { ...processed, updatedAt: new Date() }, { new: true, runValidators: true });

    const cleanupPromises = [];
    if (uploadedFiles.coverImage && old.coverImage) cleanupPromises.push(deleteFromCloudinary(old.coverImage, 'image').catch(() => null));
    if (uploadedFiles.audiobookFile && old.audiobook) cleanupPromises.push(deleteFromCloudinary(old.audiobook, 'video').catch(() => null));
    await Promise.allSettled(cleanupPromises);

    res.status(200).json({
      success: true,
      data: transform(updated),
      message: 'Audiobook updated successfully',
      timestamp: new Date().toISOString(),
    });
  });

  removeAudiobookFile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const doc = await Audiobook.findById(id);
    if (!doc) throw new AppError('Audiobook not found', 404);

    const publicId = doc.files?.audiobook?.publicId;

    doc.files = doc.files || {};
    doc.files.audiobook = undefined;
    await doc.save();

    if (publicId) {
      await deleteFromCloudinary(publicId, 'video').catch(() => null);
    }

    res.status(200).json({
      success: true,
      data: transform(doc),
      message: 'Audiobook file removed successfully',
      timestamp: new Date().toISOString(),
    });
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const doc = await Audiobook.findById(id);
    if (!doc) throw new AppError('Audiobook not found', 404);

    const cleanupPromises = [];
    if (doc.imageCloudinary?.publicId) cleanupPromises.push(deleteFromCloudinary(doc.imageCloudinary.publicId, 'image').catch(() => null));
    if (doc.files?.audiobook?.publicId) cleanupPromises.push(deleteFromCloudinary(doc.files.audiobook.publicId, 'video').catch(() => null));
    await Promise.allSettled(cleanupPromises);

    await Audiobook.findByIdAndDelete(id);

    res.status(200).json({ success: true, data: { message: 'Audiobook deleted successfully' }, timestamp: new Date().toISOString() });
  });
}

export default new AudiobookController();
