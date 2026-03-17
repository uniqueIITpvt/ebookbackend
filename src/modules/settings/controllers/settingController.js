import Setting from '../models/Setting.js';

const settingController = {
  // Get all settings (admin)
  getAllSettings: async (req, res) => {
    try {
      const { category } = req.query;
      const query = category ? { category } : {};
      
      const settings = await Setting.find(query).sort({ category: 1, key: 1 });
      
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message,
      });
    }
  },

  // Get public settings (for frontend)
  getPublicSettings: async (req, res) => {
    try {
      const settings = await Setting.find({ isPublic: true });
      
      // Convert to key-value object
      const settingsObj = {};
      settings.forEach((setting) => {
        settingsObj[setting.key] = setting.value;
      });
      
      res.status(200).json({
        success: true,
        data: settingsObj,
      });
    } catch (error) {
      console.error('Error fetching public settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message,
      });
    }
  },

  // Get single setting by key
  getSettingByKey: async (req, res) => {
    try {
      const { key } = req.params;
      
      const setting = await Setting.findOne({ key: key.toLowerCase() });
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: setting,
      });
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch setting',
        error: error.message,
      });
    }
  },

  // Get setting value by key (simple response)
  getSettingValue: async (req, res) => {
    try {
      const { key } = req.params;
      
      const setting = await Setting.findOne({ key: key.toLowerCase() });
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found',
        });
      }
      
      res.status(200).json({
        success: true,
        value: setting.value,
      });
    } catch (error) {
      console.error('Error fetching setting value:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch setting value',
        error: error.message,
      });
    }
  },

  // Create new setting
  createSetting: async (req, res) => {
    try {
      const { key, value, description, category, isPublic } = req.body;
      
      // Validate required fields
      if (!key || !value) {
        return res.status(400).json({
          success: false,
          message: 'Key and value are required',
        });
      }
      
      // Check if setting already exists
      const existingSetting = await Setting.findOne({ key: key.toLowerCase() });
      if (existingSetting) {
        return res.status(409).json({
          success: false,
          message: 'Setting with this key already exists',
        });
      }
      
      const setting = new Setting({
        key: key.toLowerCase().trim(),
        value: value.trim(),
        description,
        category: category || 'general',
        isPublic: isPublic || false,
      });
      
      await setting.save();
      
      res.status(201).json({
        success: true,
        message: 'Setting created successfully',
        data: setting,
      });
    } catch (error) {
      console.error('Error creating setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create setting',
        error: error.message,
      });
    }
  },

  // Update setting
  updateSetting: async (req, res) => {
    try {
      const { id } = req.params;
      const { value, description, category, isPublic } = req.body;
      
      const setting = await Setting.findById(id);
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found',
        });
      }
      
      // Update fields
      if (value !== undefined) setting.value = value.trim();
      if (description !== undefined) setting.description = description;
      if (category !== undefined) setting.category = category;
      if (isPublic !== undefined) setting.isPublic = isPublic;
      
      await setting.save();
      
      res.status(200).json({
        success: true,
        message: 'Setting updated successfully',
        data: setting,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update setting',
        error: error.message,
      });
    }
  },

  // Update setting by key
  updateSettingByKey: async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description, category, isPublic } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Value is required',
        });
      }

      const updateDoc = {
        value: typeof value === 'string' ? value.trim() : value,
      };

      if (description !== undefined) updateDoc.description = description;
      if (category !== undefined) updateDoc.category = category;
      if (isPublic !== undefined) updateDoc.isPublic = isPublic;

      const setting = await Setting.findOneAndUpdate(
        { key: key.toLowerCase() },
        { $set: updateDoc, $setOnInsert: { key: key.toLowerCase().trim() } },
        { new: true, upsert: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Setting updated successfully',
        data: setting,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update setting',
        error: error.message,
      });
    }
  },

  // Delete setting
  deleteSetting: async (req, res) => {
    try {
      const { id } = req.params;
      
      const setting = await Setting.findById(id);
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found',
        });
      }
      
      await Setting.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete setting',
        error: error.message,
      });
    }
  },

  // Bulk update settings
  bulkUpdateSettings: async (req, res) => {
    try {
      const { settings } = req.body;
      
      if (!Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          message: 'Settings array is required',
        });
      }
      
      const results = await Promise.all(
        settings.map(async (item) => {
          const { key, value } = item;
          if (!key || value === undefined) return null;
          
          return await Setting.findOneAndUpdate(
            { key: key.toLowerCase() },
            { value: value.toString().trim() },
            { new: true, upsert: true }
          );
        })
      );
      
      const updated = results.filter((r) => r !== null);
      
      res.status(200).json({
        success: true,
        message: `${updated.length} settings updated successfully`,
        data: updated,
      });
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message,
      });
    }
  },
};

export default settingController;
