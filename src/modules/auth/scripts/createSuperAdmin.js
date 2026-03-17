import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

/**
 * Create Super Admin User Script
 * Creates a default superadmin user for the application
 */
const createSuperAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_PASSWORD) {
      throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required in .env');
    }

    const existing = await User.findOne({ email: process.env.SUPERADMIN_EMAIL });

    if (existing) {
      console.log('⚠️  Superadmin user already exists!');
      console.log('📧 Email:', existing.email);
      console.log('👤 Name:', existing.name);
      console.log('🔑 Role:', existing.role);
      console.log('\n💡 To update the superadmin password, delete the existing user first.');
      process.exit(0);
    }

    const superAdminData = {
      name: process.env.SUPERADMIN_NAME || 'TechUniqueIIT Super Admin',
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD,
      role: 'superadmin',
      isEmailVerified: true,
      isActive: true,
    };

    console.log('\n🔨 Creating superadmin user...');
    const superadmin = await User.create(superAdminData);

    console.log('\n✅ Superadmin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superadmin.email);
    console.log('👤 Name:', superadmin.name);
    console.log('🔑 Role:', superadmin.role);
    console.log('🆔 ID:', superadmin._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('🔐 Password:', process.env.SUPERADMIN_PASSWORD);
    console.log('\n💡 You can now login at: /api/v1/auth/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin user:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createSuperAdminUser();
