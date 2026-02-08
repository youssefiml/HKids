# HKids Platform - Backend API

HKids is a safe and distraction-free digital reading platform for young children, providing an immersive reading experience with controlled content.

## Overview

This is the Backend API for the project, built with:
- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** + **Mongoose**
- **JWT** for Authentication
- **Zod** for Data Validation

## Architecture

```
server/
├── src/
│   ├── app.ts                 # Main Express application
│   ├── server.ts              # Server entry point
│   ├── config/                # Database configuration
│   ├── controllers/           # Request handlers
│   ├── middlewares/           # Security and processing middleware
│   ├── modules/               # Data models
│   │   ├── books/
│   │   ├── categories/
│   │   └── users/
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   └── utils/                 # Utility functions
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000
# FRONTEND_URL=http://localhost:3000
```

### Running

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

#### Register (Developers only)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "editor@example.com",
  "password": "password123",
  "name": "Editor Name",
  "role": "editor"
}
```

### Public Routes (No authentication required)

#### Get Books
```http
GET /api/public/books?age=5&lang=ar&category=category_id
```

**Query Parameters:**
- `age` (optional): Filter by age
- `lang` (optional): Filter by language (ar, en, fr)
- `category` (optional): Filter by category ID

#### Get Book by ID
```http
GET /api/public/books/:id
```

### Admin Routes (Authentication required)

**Note:** All routes below require header:
```
Authorization: Bearer <jwt_token>
```

#### Book Management

```http
# Get all books (with filtering)
GET /api/admin/books?status=draft&lang=ar

# Get book by ID
GET /api/admin/books/:id

# Create new book
POST /api/admin/books
Content-Type: application/json

{
  "title": "Book Title",
  "description": "Book description",
  "language": "ar",
  "minAge": 3,
  "maxAge": 6,
  "categories": ["category_id"],
  "coverUrl": "https://example.com/cover.jpg",
  "pages": [
    {
      "pageNumber": 1,
      "imageUrl": "https://example.com/page1.jpg",
      "text": "Page text content"
    }
  ],
  "status": "draft"
}

# Update book
PATCH /api/admin/books/:id
Content-Type: application/json

{
  "title": "Updated title",
  "status": "review"
}

# Publish book
POST /api/admin/books/:id/publish

# Delete book
DELETE /api/admin/books/:id
```

#### Category Management

```http
# Get all categories
GET /api/admin/categories

# Get category by ID
GET /api/admin/categories/:id

# Create new category
POST /api/admin/categories
Content-Type: application/json

{
  "name": "Animal Stories",
  "description": "Stories about animals",
  "icon": "",
  "order": 1,
  "status": "active"
}

# Update category
PATCH /api/admin/categories/:id

# Delete category
DELETE /api/admin/categories/:id
```

## Security

### Security Features Implemented:
- **JWT Authentication**: Authentication using JSON Web Tokens
- **Role-based Access Control**: Different permissions (admin, editor)
- **Rate Limiting**: Protection against attacks (100 requests per 15 minutes)
- **Input Validation**: Data validation using Zod
- **Error Handling**: Unified and secure error handling
- **CORS**: Protection against Cross-Origin requests

### Roles:
- **admin**: Full permissions
- **editor**: Can manage content only

## Data Models

### Book Model
```typescript
{
  title: string;
  description: string;
  language: "ar" | "en" | "fr";
  minAge: number (0-18);
  maxAge: number (0-18);
  categories: ObjectId[];
  coverUrl: string;
  pages: Array<{
    pageNumber: number;
    imageUrl: string;
    text?: string;
  }>;
  status: "draft" | "review" | "published" | "archived";
  publishedAt?: Date;
}
```

### Category Model
```typescript
{
  name: string;
  description?: string;
  icon?: string;
  order: number;
  minAge?: number;
  maxAge?: number;
  status: "active" | "inactive";
}
```

### User Model
```typescript
{
  email: string;
  password: string (hashed);
  name: string;
  role: "admin" | "editor";
  isActive: boolean;
}
```

## Testing

```bash
# Run tests (when added)
npm test
```

## Environment Variables

Create a `.env` file in the `server/` folder:

```env
# Database
MONGO_URI=mongodb://localhost:27017/hkids

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Deployment

### Production Settings:
1. Set `NODE_ENV=production`
2. Use a strong and secure `JWT_SECRET`
3. Set up MongoDB Atlas or a protected database
4. Enable HTTPS
5. Use Redis for Rate Limiting (instead of current in-memory solution)

## Best Practices

1. **Data Validation**: All inputs are validated using Zod
2. **Error Handling**: Use AppError class for unified handling
3. **Security**: All sensitive routes are protected with JWT
4. **Performance**: Use Indexes in MongoDB for fast queries
5. **Clean Code**: Separation of concerns (Controllers, Services, Models)

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is owned by HKids Platform.

## Support

For questions and support, please contact the development team.
