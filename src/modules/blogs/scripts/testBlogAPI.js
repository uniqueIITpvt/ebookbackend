import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/blogs';

/**
 * Test Blog API Endpoints
 */
async function testBlogAPI() {
  console.log('🧪 Testing Blog API Endpoints\n');
  console.log('=' .repeat(60));

  let testBlogId = null;

  try {
    // Test 1: Get all blogs
    console.log('\n📋 Test 1: Get all blogs');
    const allBlogs = await axios.get(`${BASE_URL}?limit=5`);
    console.log(`✅ Status: ${allBlogs.status}`);
    console.log(`   Found ${allBlogs.data.data.length} blogs`);
    console.log(`   Total: ${allBlogs.data.pagination.totalBlogs}`);
    if (allBlogs.data.data.length > 0) {
      testBlogId = allBlogs.data.data[0]._id;
      console.log(`   Using blog ID for tests: ${testBlogId}`);
    }

    // Test 2: Get all blogs with adminView
    console.log('\n📋 Test 2: Get all blogs (Admin View)');
    const adminBlogs = await axios.get(`${BASE_URL}?limit=50&adminView=true`);
    console.log(`✅ Status: ${adminBlogs.status}`);
    console.log(`   Found ${adminBlogs.data.data.length} blogs (including drafts)`);
    console.log(`   Total: ${adminBlogs.data.pagination.totalBlogs}`);

    // Test 3: Get featured blog
    console.log('\n⭐ Test 3: Get featured blog');
    const featuredBlog = await axios.get(`${BASE_URL}/featured`);
    console.log(`✅ Status: ${featuredBlog.status}`);
    if (featuredBlog.data.data) {
      console.log(`   Featured: "${featuredBlog.data.data.title}"`);
      console.log(`   Category: ${featuredBlog.data.data.category}`);
    } else {
      console.log('   No featured blog found');
    }

    // Test 4: Get latest blogs
    console.log('\n🆕 Test 4: Get latest blogs');
    const latestBlogs = await axios.get(`${BASE_URL}/latest?limit=5`);
    console.log(`✅ Status: ${latestBlogs.status}`);
    console.log(`   Found ${latestBlogs.data.count} latest blogs`);

    // Test 5: Get blog statistics
    console.log('\n📊 Test 5: Get blog statistics');
    const stats = await axios.get(`${BASE_URL}/stats`);
    console.log(`✅ Status: ${stats.status}`);
    console.log(`   Total Blogs: ${stats.data.data.totalBlogs}`);
    console.log(`   Featured Blogs: ${stats.data.data.featuredBlogs}`);
    console.log(`   Total Views: ${stats.data.data.totalViews}`);
    console.log(`   Total Likes: ${stats.data.data.totalLikes}`);
    console.log(`   Categories: ${stats.data.data.categoriesCount}`);

    // Test 6: Get categories
    console.log('\n📂 Test 6: Get categories');
    const categories = await axios.get(`${BASE_URL}/categories`);
    console.log(`✅ Status: ${categories.status}`);
    console.log(`   Found ${categories.data.count} categories`);
    categories.data.data.slice(0, 3).forEach(cat => {
      console.log(`   - ${cat.category}: ${cat.count} blogs`);
    });

    // Test 7: Get blogs by category
    if (categories.data.data.length > 0) {
      const testCategory = categories.data.data[0].category;
      console.log(`\n📂 Test 7: Get blogs by category "${testCategory}"`);
      const categoryBlogs = await axios.get(`${BASE_URL}/category/${encodeURIComponent(testCategory)}`);
      console.log(`✅ Status: ${categoryBlogs.status}`);
      console.log(`   Found ${categoryBlogs.data.data.length} blogs`);
    }

    // Test 8: Search blogs
    console.log('\n🔍 Test 8: Search blogs');
    const searchResults = await axios.get(`${BASE_URL}/search?q=health&limit=5`);
    console.log(`✅ Status: ${searchResults.status}`);
    console.log(`   Found ${searchResults.data.pagination.totalBlogs} results for "health"`);

    // Test 9: Get single blog by ID
    if (testBlogId) {
      console.log(`\n📄 Test 9: Get single blog by ID`);
      const singleBlog = await axios.get(`${BASE_URL}/${testBlogId}`);
      console.log(`✅ Status: ${singleBlog.status}`);
      console.log(`   Title: "${singleBlog.data.data.title}"`);
      console.log(`   Author: ${singleBlog.data.data.author}`);
      console.log(`   Views: ${singleBlog.data.data.views}`);
      console.log(`   Likes: ${singleBlog.data.data.likes}`);
    }

    // Test 10: Get single blog by slug
    if (allBlogs.data.data.length > 0 && allBlogs.data.data[0].slug) {
      const testSlug = allBlogs.data.data[0].slug;
      console.log(`\n📄 Test 10: Get single blog by slug "${testSlug}"`);
      const blogBySlug = await axios.get(`${BASE_URL}/${testSlug}`);
      console.log(`✅ Status: ${blogBySlug.status}`);
      console.log(`   Title: "${blogBySlug.data.data.title}"`);
    }

    // Test 11: Track engagement - like
    if (testBlogId) {
      console.log('\n❤️  Test 11: Track engagement (like)');
      const trackLike = await axios.post(`${BASE_URL}/${testBlogId}/track`, {
        action: 'like'
      });
      console.log(`✅ Status: ${trackLike.status}`);
      console.log(`   Message: ${trackLike.data.message}`);
    }

    // Test 12: Track engagement - view
    if (testBlogId) {
      console.log('\n👁️  Test 12: Track engagement (view)');
      const trackView = await axios.post(`${BASE_URL}/${testBlogId}/track`, {
        action: 'view'
      });
      console.log(`✅ Status: ${trackView.status}`);
      console.log(`   Message: ${trackView.data.message}`);
    }

    // Test 13: Create new blog (without image)
    console.log('\n➕ Test 13: Create new blog');
    const newBlogData = {
      title: 'Test Blog - API Testing',
      excerpt: 'This is a test blog created via API for testing purposes.',
      content: 'This is the full content of the test blog. It contains enough text to pass validation requirements and demonstrate the blog creation functionality.',
      category: 'General Health',
      author: 'Dr. Syed M Quadri',
      tags: ['test', 'api', 'automation'],
      featured: false,
      isPublished: true,
      status: 'published'
    };
    
    const createBlog = await axios.post(BASE_URL, newBlogData);
    console.log(`✅ Status: ${createBlog.status}`);
    console.log(`   Created blog: "${createBlog.data.data.title}"`);
    console.log(`   Blog ID: ${createBlog.data.data._id}`);
    console.log(`   Slug: ${createBlog.data.data.slug}`);
    const createdBlogId = createBlog.data.data._id;

    // Test 14: Update blog
    if (createdBlogId) {
      console.log('\n✏️  Test 14: Update blog');
      const updateData = {
        title: 'Test Blog - Updated Title',
        excerpt: 'This excerpt has been updated via API.',
        featured: true
      };
      
      const updateBlog = await axios.put(`${BASE_URL}/${createdBlogId}`, updateData);
      console.log(`✅ Status: ${updateBlog.status}`);
      console.log(`   Updated blog: "${updateBlog.data.data.title}"`);
      console.log(`   Featured: ${updateBlog.data.data.featured}`);
    }

    // Test 15: Delete blog
    if (createdBlogId) {
      console.log('\n🗑️  Test 15: Delete blog');
      const deleteBlog = await axios.delete(`${BASE_URL}/${createdBlogId}`);
      console.log(`✅ Status: ${deleteBlog.status}`);
      console.log(`   Message: ${deleteBlog.data.message}`);
    }

    // Test 16: Get blogs by author
    console.log('\n👤 Test 16: Get blogs by author');
    const authorBlogs = await axios.get(`${BASE_URL}/author/Dr. Syed M Quadri?limit=5`);
    console.log(`✅ Status: ${authorBlogs.status}`);
    console.log(`   Found ${authorBlogs.data.data.length} blogs by Dr. Syed M Quadri`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Starting Blog API Tests...');
console.log('📍 Base URL:', BASE_URL);
console.log('⏰ Timestamp:', new Date().toISOString());

testBlogAPI().then(() => {
  console.log('\n✨ Test suite completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
