/**
 * Quick Test Script for Blog API
 * Run this to verify the blog API is working
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/blogs';

async function quickTest() {
  console.log('🚀 Quick Blog API Test\n');

  try {
    // Test 1: Check if API is accessible
    console.log('1️⃣  Testing API connection...');
    const response = await axios.get(`${BASE_URL}?limit=1`);
    console.log(`   ✅ API is accessible (Status: ${response.status})`);
    console.log(`   📊 Total blogs: ${response.data.pagination.totalBlogs}`);

    // Test 2: Get statistics
    console.log('\n2️⃣  Getting blog statistics...');
    const stats = await axios.get(`${BASE_URL}/stats`);
    console.log(`   ✅ Statistics retrieved`);
    console.log(`   📝 Total Blogs: ${stats.data.data.totalBlogs}`);
    console.log(`   ⭐ Featured: ${stats.data.data.featuredBlogs}`);
    console.log(`   👁️  Total Views: ${stats.data.data.totalViews}`);
    console.log(`   ❤️  Total Likes: ${stats.data.data.totalLikes}`);

    // Test 3: Get categories
    console.log('\n3️⃣  Getting categories...');
    const categories = await axios.get(`${BASE_URL}/categories`);
    console.log(`   ✅ Found ${categories.data.count} categories`);
    categories.data.data.forEach(cat => {
      console.log(`   📂 ${cat.category}: ${cat.count} blogs`);
    });

    // Test 4: Get featured blog
    console.log('\n4️⃣  Getting featured blog...');
    const featured = await axios.get(`${BASE_URL}/featured`);
    if (featured.data.data) {
      console.log(`   ✅ Featured: "${featured.data.data.title}"`);
      console.log(`   📅 Published: ${new Date(featured.data.data.publishDate).toLocaleDateString()}`);
      console.log(`   👁️  Views: ${featured.data.data.views}`);
    } else {
      console.log('   ℹ️  No featured blog found');
    }

    console.log('\n✅ All quick tests passed!');
    console.log('💡 Run full tests with: node testBlogAPI.js');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Cannot connect to server. Is it running on port 5000?');
    }
    process.exit(1);
  }
}

quickTest();
