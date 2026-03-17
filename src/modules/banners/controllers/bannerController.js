import Banner from '../models/Banner.js';

const bannerController = {
  // Get all banners (admin)
  getAllBanners: async (req, res) => {
    try {
      const banners = await Banner.find().sort({ position: 1, order: 1 });
      
      res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch banners',
        error: error.message,
      });
    }
  },

  // Get active banners by position (public) - now returns ALL banners
  getActiveBannersByPosition: async (req, res) => {
    try {
      // Return ALL banners, no filter
      const banners = await Banner.find().sort({ order: 1 });
      
      res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch banners',
        error: error.message,
      });
    }
  },

  // Get all active banners (public) - now returns ALL banners
  getActiveBanners: async (req, res) => {
    try {
      // Return ALL banners, no filter
      const banners = await Banner.find().sort({ order: 1 });
      
      res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch banners',
        error: error.message,
      });
    }
  },

  // Get single banner by ID
  getBannerById: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: banner,
      });
    } catch (error) {
      console.error('Error fetching banner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch banner',
        error: error.message,
      });
    }
  },

  // Create new banner
  createBanner: async (req, res) => {
    try {
      const { title, subtitle, image, link, isActive, order, position } = req.body;
      
      // Validate required fields
      if (!title || !image) {
        return res.status(400).json({
          success: false,
          message: 'Title and image are required',
        });
      }
      
      const banner = new Banner({
        title,
        subtitle,
        image,
        link,
        isActive,
        order: order || 0,
        position: position || 'home_hero',
      });
      
      await banner.save();
      
      res.status(201).json({
        success: true,
        message: 'Banner created successfully',
        data: banner,
      });
    } catch (error) {
      console.error('Error creating banner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create banner',
        error: error.message,
      });
    }
  },

  // Update banner
  updateBanner: async (req, res) => {
    try {
      const { title, subtitle, image, link, isActive, order, position } = req.body;
      
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
      }
      
      // Update fields
      if (title !== undefined) banner.title = title;
      if (subtitle !== undefined) banner.subtitle = subtitle;
      if (image !== undefined) banner.image = image;
      if (link !== undefined) banner.link = link;
      if (isActive !== undefined) banner.isActive = isActive;
      if (order !== undefined) banner.order = order;
      if (position !== undefined) banner.position = position;
      
      await banner.save();
      
      res.status(200).json({
        success: true,
        message: 'Banner updated successfully',
        data: banner,
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update banner',
        error: error.message,
      });
    }
  },

  // Delete banner
  deleteBanner: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
      }
      
      await Banner.findByIdAndDelete(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Banner deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete banner',
        error: error.message,
      });
    }
  },
};

export default bannerController;
