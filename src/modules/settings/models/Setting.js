import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    value: {
      type: String,
      required: [true, 'Setting value is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'banner', 'subscription', 'analytics', 'email', 'social'],
      default: 'general',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
settingSchema.index({ key: 1 });
settingSchema.index({ category: 1 });

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
