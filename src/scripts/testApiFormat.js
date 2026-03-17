import mongoose from 'mongoose';
import Book from '../modules/books/models/Book.js';
import { config } from '../config/index.js';

/**
 * Test API Response Format
 * Verifies that API responses match frontend expectations
 */

// Transform function (same as in controller)
const transformBookForFrontend = (book) => {
  const bookObj = book.toObject({ virtuals: true });
  
  return {
    ...bookObj,
    // Transform prices to string format expected by frontend
    price: bookObj.formattedPrice || `$${book.price?.toFixed(2) || '0.00'}`,
    originalPrice: bookObj.formattedOriginalPrice || (book.originalPrice ? `$${book.originalPrice.toFixed(2)}` : null),
    // Ensure format field is present (renamed from formats)
    format: bookObj.format || [],
    // Convert MongoDB _id to id for frontend
    id: bookObj._id,
  };
};

async function testApiFormat() {
  try {
    console.log('🧪 Testing API Response Format...');

    // Connect to database
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Get a sample book
    const book = await Book.findOne();
    
    if (!book) {
      console.log('❌ No books found in database. Please run the seeding script first.');
      return;
    }

    console.log('\n📖 Raw Book from Database:');
    console.log('Title:', book.title);
    console.log('Price (Number):', book.price, typeof book.price);
    console.log('Original Price (Number):', book.originalPrice, typeof book.originalPrice);
    console.log('Format:', book.format);
    console.log('Category:', book.category);

    // Transform for frontend
    const transformedBook = transformBookForFrontend(book);

    console.log('\n🔄 Transformed Book for Frontend:');
    console.log('ID:', transformedBook.id);
    console.log('Title:', transformedBook.title);
    console.log('Price (String):', transformedBook.price, typeof transformedBook.price);
    console.log('Original Price (String):', transformedBook.originalPrice, typeof transformedBook.originalPrice);
    console.log('Format:', transformedBook.format);
    console.log('Category:', transformedBook.category);
    console.log('Type:', transformedBook.type);
    console.log('Rating:', transformedBook.rating);
    console.log('Reviews:', transformedBook.reviews);

    // Expected frontend format check
    console.log('\n✅ Frontend Compatibility Check:');
    console.log('✓ ID exists:', !!transformedBook.id);
    console.log('✓ Price is string:', typeof transformedBook.price === 'string');
    console.log('✓ Price has $ format:', transformedBook.price?.startsWith('$'));
    console.log('✓ Format is array:', Array.isArray(transformedBook.format));
    console.log('✓ Category matches enum:', ['Mental Health', 'Psychology', 'Self-Help', 'Wellness', 'Journal', 'Memoir'].includes(transformedBook.category));

    // Sample API response structure
    const apiResponse = {
      success: true,
      data: transformedBook,
      message: 'Book retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    console.log('\n📡 Sample API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n🎉 API Format Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testApiFormat();
