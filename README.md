# uniqueIIT Research Center - Backend API

Backend API server for uniqueIIT Research Center.

## 🏥 About

This is a Node.js backend API built with Express.js and MongoDB. It provides endpoints for managing books, audiobooks, blogs, banners, settings, and authentication.

## ✨ Features

- ✅ **Express.js REST API** with modular architecture
- ✅ **MongoDB integration** with Mongoose ODM
- ✅ **JWT Authentication** with refresh tokens
- ✅ **Role-based access control** (User, Admin, SuperAdmin)
- ✅ **File upload** with Cloudinary integration
- ✅ **Email notifications** with nodemailer
- ✅ **Rate limiting** and security middleware
- ✅ **Input validation** and sanitization
- ✅ **Error handling** with custom error classes
- ✅ **Logging** with Winston
- ✅ **Health checks** and monitoring
- ✅ **Feature-based folder structure**
- ✅ **Comprehensive testing** setup
- ✅ **API documentation** ready

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn** package manager
- **Cloudinary account** (optional, for file uploads)
- **Gmail account** (optional, for email notifications)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables (minimum required):**
   ```env
   MONGODB_URI=mongodb://localhost:27017/
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **For production:**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/                 # Configuration files
│   ├── modules/               # Feature-based modules
│   │   ├── auth/              # Authentication module
│   │   ├── books/             # Books module
│   │   ├── audiobooks/        # Audiobooks module
│   │   ├── blogs/             # Blogs module
│   │   ├── banners/           # Home/books page banners
│   │   ├── settings/          # Site settings (public + admin)
│   │   └── ...                # Other modules
│   ├── shared/                # Shared utilities
│   ├── routes/                # Route aggregators
│   ├── scripts/               # Utility scripts
│   └── index.js               # Main server file
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔗 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Available Endpoints

#### **General**
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1` - API v1 index
- `GET /api/v1/test` - API v1 test route
- `GET /api/v1/debug` - Debug route

#### **Authentication** (`/api/v1/auth`)
- `GET /auth/test`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/reset-password/:resetToken`
- `GET /auth/verify-email/:token`
- Protected:
  - `GET /auth/me`
  - `PUT /auth/profile`
  - `PUT /auth/change-password`
  - `POST /auth/logout`
  - `POST /auth/logout-all`
  - `POST /auth/resend-verification`
  - Admin only:
    - `POST /auth/register-admin`
    - `GET /auth/users`

#### **Books** (`/api/v1/books`)
- `GET /books`
- `GET /books/featured`
- `GET /books/bestsellers`
- `GET /books/trending`
- `GET /books/categories`
- `GET /books/stats`
- `GET /books/search`
- `GET /books/category/:category`
- `GET /books/:identifier`
- CRUD (currently open for testing):
  - `POST /books` (supports file upload)
  - `PUT /books/:id` (supports file upload)
  - `DELETE /books/:id`
  - File helpers:
    - `POST /books/:id/files/ebook`
    - `POST /books/:id/files/audiobook`
    - `DELETE /books/:id/files/ebook`
    - `DELETE /books/:id/files/audiobook`

#### **Audiobooks** (`/api/v1/audiobooks`)
- `GET /audiobooks`
- `GET /audiobooks/featured`
- `GET /audiobooks/bestsellers`
- `GET /audiobooks/trending`
- `GET /audiobooks/categories`
- `GET /audiobooks/search`
- `GET /audiobooks/:identifier`
- CRUD (supports file upload):
  - `POST /audiobooks`
  - `PUT /audiobooks/:id`
  - `DELETE /audiobooks/:id`
  - File helpers:
    - `POST /audiobooks/:id/files/audiobook`
    - `DELETE /audiobooks/:id/files/audiobook`

#### **Blogs** (`/api/v1/blogs`)
- `GET /blogs`
- `GET /blogs/featured`
- `GET /blogs/latest`
- `GET /blogs/categories`
- `GET /blogs/stats`
- `GET /blogs/search`
- `GET /blogs/category/:category`
- `GET /blogs/author/:author`
- `GET /blogs/:identifier` (id or slug)
- Engagement:
  - `POST /blogs/:identifier/track`
- CRUD + seeding (currently open for testing, includes optional image upload):
  - `POST /blogs`
  - `PUT /blogs/:id`
  - `DELETE /blogs/:id`
  - `POST /blogs/seed`

#### **Categories** (`/api/v1/categories`)
- `GET /categories`
- `GET /categories/stats`
- `GET /categories/:identifier` (id or slug)
- CRUD (currently open for testing):
  - `POST /categories`
  - `PUT /categories/:id`
  - `PUT /categories/reorder`
  - `DELETE /categories/:id`

#### **Banners** (`/api/v1/banners`)
- Public:
  - `GET /banners`
  - `GET /banners/position/:position` (use `any` to return all positions)
  - `GET /banners/:id`
- Admin:
  - `GET /banners/admin/all`
  - `POST /banners`
  - `PUT /banners/:id`
  - `DELETE /banners/:id`

#### **Settings** (`/api/v1/settings`)
- Public:
  - `GET /settings/public`
  - `GET /settings/value/:key`
- Admin:
  - `GET /settings`
  - `GET /settings/:id`
  - `POST /settings`
  - `PUT /settings/:id`
  - `PUT /settings/key/:key`
  - `DELETE /settings/:id`
  - `POST /settings/bulk`

#### **Upload** (`/api/v1/upload`)
- `POST /upload` (protected: `admin`/`superadmin`) - upload a single image file to Cloudinary

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Scripts (verified in this repo)

These scripts exist in the repository:

```bash
node src/scripts/seedBooks.js          # Seed sample books
node src/scripts/seedCategories.js     # Seed categories
node src/scripts/testApiFormat.js      # Verify DB -> API -> frontend field format for Books
node src/modules/auth/scripts/createAdmin.js       # Create an admin user
node src/modules/auth/scripts/createSuperAdmin.js  # Create a superadmin user
node src/modules/blogs/scripts/testBlogAPI.js      # Blog API test runner
node src/modules/blogs/scripts/quickTest.js        # Quick blog API test
```

Some `package.json` scripts reference files that are not present (for example: `src/scripts/seedData.js`, `src/scripts/migrateData.js`, `src/scripts/backup.js`, and some blog/treatment seed scripts). If you want, I can align `package.json` scripts with the actual files in the repo.

### Environment Variables

Only `MONGODB_URI` and `JWT_SECRET` are required (the server will exit on startup if missing).

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | `development` / `production` / `test` | `development` | No |
| `PORT` | Server port | `5000` | No |
| `HOST` | Server host | `localhost` | No |
| `API_VERSION` | API version prefix | `v1` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/uniqueiit-research-center` | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRE` | Access token expiry | `7d` | No |
| `JWT_COOKIE_EXPIRE` | Cookie expiry (days) | `7` | No |
| `REFRESH_TOKEN_SECRET` | Refresh token signing secret | - | No |
| `REFRESH_TOKEN_EXPIRE` | Refresh token expiry | `30d` | No |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:3000` | No |
| `ALLOWED_ORIGINS` | Comma-separated allowlist for CORS | `CLIENT_URL` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit max requests | `5000 (dev) / 100 (prod)` | No |
| `TRUST_PROXY` | Express trust proxy (needed behind proxies) | `1` | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - | No |
| `CLOUDINARY_FOLDER` | Cloudinary base folder | `uniqueiit-research-center` | No |
| `SMTP_HOST` | SMTP host | `smtp.gmail.com` | No |
| `SMTP_PORT` | SMTP port | `587` | No |
| `SMTP_EMAIL` | SMTP username | - | No |
| `SMTP_PASSWORD` | SMTP password/app password | - | No |
| `FROM_EMAIL` | Email “from” address | `SMTP_EMAIL` | No |
| `FROM_NAME` | Email “from” name | `uniqueIIT Research Center` | No |
| `SENDGRID_API_KEY` | SendGrid API key | - | No |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `REDIS_TTL` | Redis default TTL (seconds) | `3600` | No |
| `LOG_LEVEL` | Log level | `info` | No |
| `LOG_FILE` | Log file path | `logs/app.log` | No |
| `ADMIN_EMAIL` | Default admin email for seed scripts | `` | No |
| `ADMIN_PASSWORD` | Default admin password for seed scripts | `` | No |
| `ADMIN_NAME` | Default admin name for seed scripts | `` | No |
| `YOUTUBE_API_KEY` | YouTube API key (optional integration) | - | No |
| `GOOGLE_ANALYTICS_ID` | Analytics ID (optional integration) | - | No |
| `API_URL` | Public API URL (used in config output) | `http://localhost:5000` | No |

### Module Development

Each module follows this structure:
```
module_name/
├── models/           # Database schemas
├── controllers/      # Business logic
├── routes/          # API routes
├── services/        # Business services
├── middleware/      # Module middleware
└── index.js         # Module exports
```

### Adding New Modules

1. Create module folder in `src/modules/`
2. Add models, controllers, routes, services
3. Export routes in module's `index.js`
4. Import and use routes in `src/routes/v1/index.js`

## 🔒 Security Features

- **Rate limiting** (100 requests per 15 minutes)
- **Security headers** with Helmet
- **CORS protection** with configurable origins
- **Input validation** with Joi and express-validator
- **Password hashing** with bcrypt
- **JWT tokens** with secure HTTP-only cookies
- **Request size limits** to prevent DoS attacks
- **Error handling** without exposing stack traces in production

## 📊 Health Monitoring

The API includes comprehensive health checks:

```bash
GET /health
```

Returns:
- Server status and uptime
- Database connection status
- Cloudinary service status
- Environment information

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Test files are organized by module in `src/tests/`:
- `unit/` - Unit tests
- `integration/` - Integration tests
- `e2e/` - End-to-end tests

## 📚 API Documentation

There is no Swagger/OpenAPI bundle committed in this repo yet. If you want a `/docs` route, I can add Swagger UI (without changing the existing API behavior).

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use MongoDB Atlas for database
3. Configure Cloudinary for file uploads
4. Set up email service (Gmail/SendGrid)
5. Configure CORS for your domain

### Vercel

This repo contains `vercel.json` configured to run `src/index.js` via `@vercel/node`.

Notes:
- Ensure all required environment variables are set in Vercel.
- Prefer MongoDB Atlas (Vercel functions are serverless; keep DB connections efficient).

### Recommended Deployment Platforms

- **Heroku** - Easy deployment with MongoDB Atlas
- **Railway** - Modern deployment platform
- **DigitalOcean App Platform** - Scalable hosting
- **AWS/GCP/Azure** - Enterprise solutions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍⚕️ Author

**Md Raziur Rahman**

## 🆘 Support

If you encounter any issues or have questions:

1. Check the repository Issues page
2. Create a new issue with detailed description
3. Contact the development team

---

**Happy Coding!**
