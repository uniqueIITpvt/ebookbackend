# Dr. Syed M Quadri - Backend API

Backend API server for Dr. Syed M Quadri's mental health and medical practice website.

## 🏥 About

This is a comprehensive Node.js backend API built with Express.js and MongoDB, designed to support a mental health and medical practice website. The API provides endpoints for managing books, podcasts, blogs, patient contact forms, user authentication, and more.

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

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Required
   MONGODB_URI=mongodb://localhost:27017/dr-quadri-db
   JWT_SECRET=your-super-secret-jwt-key
   
   # Optional but recommended
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
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
│   │   ├── podcasts/          # Podcasts module
│   │   ├── blogs/             # Blogs module
│   │   ├── contact/           # Contact module
│   │   └── ...                # Other modules
│   ├── shared/                # Shared utilities
│   ├── routes/                # Route aggregators
│   ├── scripts/               # Utility scripts
│   └── index.js               # Main server file
├── docs/                      # API documentation
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

#### **Authentication** (Coming Soon)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

#### **Books** (Coming Soon)
- `GET /books` - Get all books
- `GET /books/featured` - Get featured books
- `GET /books/:id` - Get single book

#### **Podcasts** (Coming Soon)
- `GET /podcasts` - Get all podcast episodes
- `GET /podcasts/featured` - Get featured episodes
- `GET /podcasts/:id` - Get single episode

#### **Blogs** (Coming Soon)
- `GET /blogs` - Get all blog posts
- `GET /blogs/featured` - Get featured blog
- `GET /blogs/:id` - Get single blog post

#### **Contact** (Coming Soon)
- `POST /contact` - Submit contact form
- `GET /contact/info` - Get contact information

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run seed         # Seed database with sample data
npm run migrate      # Run data migrations
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT secret key | - | Yes |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - | No |
| `SMTP_EMAIL` | Email for notifications | - | No |

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

API documentation will be available at:
- Development: `http://localhost:5000/docs`
- Swagger/OpenAPI spec: `docs/swagger.json`

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use MongoDB Atlas for database
3. Configure Cloudinary for file uploads
4. Set up email service (Gmail/SendGrid)
5. Configure CORS for your domain

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

**Dr. Syed M Quadri**
- Mental Health & Medical Practice
- Website: [Your Website]
- Email: [Your Email]

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Contact the development team

---

**Happy Coding! 🚀**
