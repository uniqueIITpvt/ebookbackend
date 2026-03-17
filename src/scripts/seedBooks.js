import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import database from '../config/database.js';
import Book from '../modules/books/models/Book.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed Books Data
 * Migrates books from frontend JSON to MongoDB
 */

// Books data matching frontend books.json exactly
const sampleBooksData = {
  "featuredBooks": [
    {
      "title": "Learn Faster: A Practical Guide to Better Reading & Listening",
      "subtitle": "Systems for Knowledge, Focus, and Consistency",
      "author": "uniqueIIT Research Center",
      "description": "A practical guide to learning effectively with books and audiobooks. Covers focus systems, note-taking, review routines, and how to build a consistent reading/listening habit.",
      "category": "Productivity",
      "type": "Books",
      "contentKind": "book",
      "accessLevel": "premium",
      "isTrending": true,
      "price": "$24.99",
      "originalPrice": "$34.99",
      "rating": 4.8,
      "reviews": 156,
      "pages": 320,
      "publishDate": "2024-01-15",
      "isbn": "978-0-123456-78-9",
      "format": ["Hardcover", "Paperback", "E-book"],
      "image": "/books/Black and White Modern Psychology Book Cover.jpg",
      "featured": true,
      "bestseller": true,
      "tags": ["learning", "productivity", "reading", "audiobooks"]
    },
    {
      "title": "Deep Work for Students",
      "subtitle": "Study Routines That Actually Stick",
      "author": "uniqueIIT Research Center",
      "description": "Build a repeatable study routine using simple systems. Learn how to plan sessions, avoid distractions, and retain information with review techniques.",
      "category": "Students",
      "type": "Books",
      "contentKind": "summary",
      "accessLevel": "free",
      "price": "$19.99",
      "originalPrice": "$29.99",
      "rating": 4.7,
      "reviews": 89,
      "duration": "6h 45m",
      "narrator": "uniqueIIT Research Center",
      "publishDate": "2023-11-20",
      "isbn": "978-0-123456-79-6",
      "format": ["Audiobook", "Digital Download"],
      "image": "/books/Navy and Pink Illustrated Mind Matters Book Cover.jpg",
      "featured": true,
      "bestseller": false,
      "tags": ["students", "study", "deep-work", "focus"]
    }
  ],
  "otherBooks": [
    {
      "title": "Communication Skills",
      "subtitle": "Speak Clearly, Write Better, Negotiate Smarter",
      "author": "uniqueIIT Research Center",
      "description": "A practical guide to improving communication: public speaking, writing, negotiation, and confident conversations.",
      "category": "Communication Skills",
      "type": "Books",
      "contentKind": "book",
      "accessLevel": "premium",
      "isTrending": true,
      "price": "$16.99",
      "originalPrice": "$24.99",
      "rating": 4.6,
      "reviews": 124,
      "pages": 240,
      "publishDate": "2023-09-10",
      "isbn": "978-0-123456-80-2",
      "format": ["Paperback", "E-book"],
      "image": "/books/Blue & Orange Playful Illustrative Public Speaking Book Cover.jpg",
      "featured": false,
      "bestseller": false,
      "tags": ["communication", "writing", "speaking", "confidence"]
    },
    {
      "title": "Business Basics",
      "subtitle": "Build a Strong Foundation in Strategy and Marketing",
      "author": "uniqueIIT Research Center",
      "description": "A beginner-friendly resource to understand business fundamentals: strategy, marketing, execution, and decision-making.",
      "category": "Business",
      "type": "Audiobook",
      "contentKind": "summary",
      "accessLevel": "premium",
      "premiumPublishedAt": "2025-02-10",
      "price": "$18.99",
      "originalPrice": "$26.99",
      "rating": 4.5,
      "reviews": 67,
      "duration": "4h 30m",
      "narrator": "uniqueIIT Research Center",
      "publishDate": "2023-07-15",
      "isbn": "978-0-123456-81-9",
      "format": ["Audiobook", "Digital Download"],
      "image": "/books/Red Simple Food Journal Book Cover.jpg",
      "featured": false,
      "bestseller": false,
      "tags": ["business", "strategy", "marketing", "startup"]
    },
    {
      "title": "Daily Learning Journal",
      "subtitle": "Track Reading, Notes, and Key Takeaways",
      "author": "uniqueIIT Research Center",
      "description": "A simple journal template to track what you read/listen to, key takeaways, and next actions.",
      "category": "Book Summaries",
      "type": "Books",
      "contentKind": "summary",
      "accessLevel": "free",
      "price": "$12.99",
      "originalPrice": "$19.99",
      "rating": 4.4,
      "reviews": 45,
      "pages": 180,
      "publishDate": "2023-06-01",
      "isbn": "978-0-123456-82-6",
      "format": ["Paperback"],
      "image": "/books/Red and Green Seamless Pattern Printable Daily Food Journal Cover.jpg",
      "featured": false,
      "bestseller": false,
      "tags": ["journal", "notes", "learning", "review"]
    },
    {
      "title": "Biographies That Teach",
      "subtitle": "Lessons from Founders and Innovators",
      "author": "uniqueIIT Research Center",
      "description": "A curated biography-style audiobook that highlights lessons from builders, innovators, and leaders.",
      "category": "Biographies",
      "type": "Audiobook",
      "contentKind": "summary",
      "accessLevel": "premium",
      "premiumPublishedAt": "2025-03-01",
      "price": "$21.99",
      "originalPrice": "$31.99",
      "rating": 4.9,
      "reviews": 78,
      "duration": "8h 15m",
      "narrator": "uniqueIIT Research Center",
      "publishDate": "2023-05-12",
      "isbn": "978-0-123456-83-3",
      "format": ["Audiobook", "Digital Download", "E-book"],
      "image": "/books/Romantic Doctor Love Story Ebook Cover.png",
      "featured": false,
      "bestseller": true,
      "tags": ["biographies", "leadership", "career", "inspiration"]
    }
  ]
};

/**
 * Transform book data to match our schema
 */
function transformBookData(book, index) {
  // Generate a unique slug
  const baseSlug = book.title ? book.title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-') : `book-${index}`;
  
  const slug = `${baseSlug}-${Date.now()}-${index}`; // Ensure uniqueness
  
  // Parse price values to numbers
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    // Remove currency symbols and parse as float
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  return {
    title: book.title,
    subtitle: book.subtitle,
    slug: slug,
    author: book.author,
    description: book.description,
    category: book.category,
    type: book.type,
    contentKind: book.contentKind,
    accessLevel: book.accessLevel,
    isTrending: book.isTrending,
    premiumPublishedAt: book.premiumPublishedAt ? new Date(book.premiumPublishedAt) : undefined,
    price: parsePrice(book.price),
    originalPrice: parsePrice(book.originalPrice),
    rating: book.rating || 0,
    reviews: book.reviews || 0,
    pages: book.pages,
    duration: book.duration,
    narrator: book.narrator,
    publishDate: book.publishDate ? new Date(book.publishDate) : new Date(),
    isbn: book.isbn,
    format: book.format || [],
    image: book.image,
    featured: book.featured || false,
    bestseller: book.bestseller || false,
    tags: book.tags || [],
    status: 'published',
    isActive: true,
    isPublished: true,
    views: Math.floor(Math.random() * 1000) + 100, // Random views for demo
    downloads: Math.floor(Math.random() * 500) + 50, // Random downloads for demo
  };
}

/**
 * Seed books from JSON data
 */
async function seedBooks() {
  try {
    console.log('🌱 Starting books seeding process...');

    // Connect to database
    await database.connect();

    // Clear existing books (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing books...');
    await Book.deleteMany({});

    // Prepare books data
    const allBooks = [
      ...sampleBooksData.featuredBooks,
      ...sampleBooksData.otherBooks
    ];

    console.log(`📚 Preparing to seed ${allBooks.length} books...`);

    // Transform and insert books
    const transformedBooks = allBooks.map((book, index) => transformBookData(book, index));
    
    const insertedBooks = await Book.insertMany(transformedBooks);
    
    console.log(`✅ Successfully seeded ${insertedBooks.length} books!`);

    // Display summary
    const stats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          featuredBooks: { $sum: { $cond: ['$featured', 1, 0] } },
          bestsellerBooks: { $sum: { $cond: ['$bestseller', 1, 0] } },
          avgRating: { $avg: '$rating' },
          categories: { $addToSet: '$category' }
        }
      }
    ]);

    if (stats.length > 0) {
      const summary = stats[0];
      console.log('\n📊 Seeding Summary:');
      console.log(`   Total Books: ${summary.totalBooks}`);
      console.log(`   Featured Books: ${summary.featuredBooks}`);
      console.log(`   Bestseller Books: ${summary.bestsellerBooks}`);
      console.log(`   Average Rating: ${summary.avgRating.toFixed(2)}`);
      console.log(`   Categories: ${summary.categories.join(', ')}`);
    }

    console.log('\n🎉 Books seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding books:', error);
    throw error;
  }
}

/**
 * Load books from external JSON file (if exists)
 */
async function loadBooksFromFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`📖 Loading books from ${filePath}...`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const booksData = JSON.parse(fileContent);
      
      // Handle different JSON structures
      let allBooks = [];
      
      if (booksData.featuredBooks && booksData.otherBooks) {
        allBooks = [...booksData.featuredBooks, ...booksData.otherBooks];
      } else if (booksData.featuredBooks && booksData.regularBooks) {
        allBooks = [...booksData.featuredBooks, ...booksData.regularBooks];
      } else if (booksData.featuredBooks) {
        allBooks = booksData.featuredBooks;
      } else if (Array.isArray(booksData)) {
        allBooks = booksData;
      } else {
        console.warn('⚠️  Unknown JSON structure, using sample data');
        return sampleBooksData;
      }
      
      return { books: allBooks };
    } else {
      console.log('📝 External books file not found, using sample data');
      return sampleBooksData;
    }
  } catch (error) {
    console.error('❌ Error loading books from file:', error);
    return sampleBooksData;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Books Seeder...');
  
  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, '../../.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found. Please create one from .env.example');
      process.exit(1);
    }
    
    console.log('✅ Environment file found');
    
    // Try to load from frontend books.json file
    const frontendBooksPath = path.join(__dirname, '../../../client/src/data/books.json');
    console.log(`📂 Looking for books data at: ${frontendBooksPath}`);
    
    const booksData = await loadBooksFromFile(frontendBooksPath);
    
    // Update sample data if external file was loaded
    if (booksData.books) {
      console.log(`📚 Loaded ${booksData.books.length} books from external file`);
      sampleBooksData.featuredBooks = booksData.books.filter(book => book.featured);
      sampleBooksData.otherBooks = booksData.books.filter(book => !book.featured);
    } else {
      console.log('📝 Using built-in sample data');
    }
    
    await seedBooks();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the seeder
main();

export { seedBooks, transformBookData };
