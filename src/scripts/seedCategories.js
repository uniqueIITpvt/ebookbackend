import mongoose from 'mongoose';
import { config } from '../config/index.js';
import Category from '../modules/books/models/Category.js';

const categories = [
  {
    name: 'Audiobooks',
    description: 'Curated audio-first learning resources for listening on the go',
    color: '#4F46E5',
    icon: 'headphones',
    sortOrder: 1
  },
  {
    name: 'Book Summaries',
    description: 'Premium and free summaries to learn key ideas faster',
    color: '#0EA5E9',
    icon: 'summarize',
    sortOrder: 2
  },
  {
    name: 'Self Improvement',
    description: 'Personal development, habits, mindset, and skill building',
    color: '#F59E0B',
    icon: 'self_improvement',
    sortOrder: 3
  },
  {
    name: 'Business',
    description: 'Entrepreneurship, marketing, leadership, and management',
    color: '#10B981',
    icon: 'business',
    sortOrder: 4
  },
  {
    name: 'Productivity',
    description: 'Time management, focus systems, and practical routines',
    color: '#8B5CF6',
    icon: 'productivity',
    sortOrder: 5
  },
  {
    name: 'Biographies',
    description: 'Life stories of founders, creators, and leaders',
    color: '#64748B',
    icon: 'person',
    sortOrder: 6
  },
  {
    name: 'Students',
    description: 'Study skills, exams, and learning support resources',
    color: '#06B6D4',
    icon: 'school',
    sortOrder: 7
  },
  {
    name: 'Science',
    description: 'Popular science, research insights, and curiosity-driven learning',
    color: '#EF4444',
    icon: 'science',
    sortOrder: 8
  },
  {
    name: 'Communication Skills',
    description: 'Speaking, writing, negotiation, and interpersonal skills',
    color: '#14B8A6',
    icon: 'communication',
    sortOrder: 9
  },
  {
    name: 'Motivation & Inspiration',
    description: 'Mindset boosters, stories, and motivational learning',
    color: '#F97316',
    icon: 'bolt',
    sortOrder: 10
  },
];

async function seedCategories() {
  try {
    console.log('🌱 Starting category seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories (optional - comment out if you want to keep existing)
    // await Category.deleteMany({});
    // console.log('🗑️ Cleared existing categories');

    // Insert categories
    for (const categoryData of categories) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findOne({ name: categoryData.name });
        
        if (existingCategory) {
          console.log(`⏭️ Category "${categoryData.name}" already exists, skipping...`);
          continue;
        }

        const category = await Category.create(categoryData);
        console.log(`✅ Created category: ${category.name} (${category.slug})`);
      } catch (error) {
        console.error(`❌ Error creating category "${categoryData.name}":`, error.message);
      }
    }

    console.log('🎉 Category seeding completed!');
    
    // Display final count
    const totalCategories = await Category.countDocuments();
    console.log(`📊 Total categories in database: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
seedCategories();
