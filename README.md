# Social Media Backend API

A complete Node.js/Express backend for a social media application with user authentication, posts, comments, likes, and image upload functionality using MinIO object storage.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- MinIO server (for image uploads)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CORS_ORIGIN=*

# MinIO Configuration (required for image uploads)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=socialmedia
MINIO_USE_SSL=false

# Backend URL (for image proxy)
BACKEND_URL=http://localhost:5000
```

### MinIO Setup
1. Install and run MinIO server locally or use a cloud instance
2. Create a bucket named `socialmedia` (or match your `MINIO_BUCKET_NAME`)
3. Configure access credentials in your `.env` file
4. The application will automatically set up bucket policies on startup

## 📡 API Base URL

**Local Development:** `http://localhost:5000`

All API endpoints are prefixed with `/api` unless otherwise specified.

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid email, user already exists)

---

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

**Error Responses:**
- `400` - Invalid credentials

---

### User Endpoints

#### GET /api/users/:id
Get user profile information (public).

**Parameters:**
- `id` - User ID

**Response (200):**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "avatar_url",
  "bio": "User bio",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "postCount": 5
}
```

**Error Responses:**
- `404` - User not found
- `400` - Invalid user ID

---

#### GET /api/users/:id/posts
Get posts created by a specific user (protected - owner only for profile pages).

**Headers:** `Authorization: Bearer <token>` (required)

**Parameters:**
- `id` - User ID

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 10)

**Response (200):**
```json
{
  "posts": [
    {
      "_id": "post_id",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "avatar": "avatar_url"
      },
      "text": "Post content",
      "image": "http://localhost:5000/api/posts/image/filename.jpg",
      "likes": ["user_id1", "user_id2"],
      "commentsCount": 3,
      "edited": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Access denied (can only view own posts)
- `404` - User not found

---

#### PUT /api/users/:id
Update user profile (protected - owner only).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` - User ID (must match authenticated user)

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatar": "new_avatar_url",
  "bio": "Updated bio"
}
```

**Response (200):**
```json
{
  "id": "user_id",
  "name": "Updated Name",
  "email": "john@example.com",
  "avatar": "new_avatar_url",
  "bio": "Updated bio",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Access denied (not owner)
- `404` - User not found

---

### Post Endpoints

#### POST /api/posts
Create a new post (protected).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "This is my first post!",
  "image": "optional_image_url_or_uploaded_image_url"
}
```

**Response (201):**
```json
{
  "_id": "post_id",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "avatar": "avatar_url"
  },
  "text": "This is my first post!",
  "image": "http://localhost:5000/api/posts/image/filename.jpg",
  "likes": [],
  "commentsCount": 0,
  "edited": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `400` - Text is required or too long (max 500 characters)

---

#### POST /api/posts/upload-image
Upload an image file for posts (protected).

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
- `image` - Image file (jpg, jpeg, png, gif, webp)
- Maximum file size: 5MB

**Response (200):**
```json
{
  "imageUrl": "http://localhost:5000/api/posts/image/1699123456789-filename.jpg",
  "fileName": "1699123456789-filename.jpg"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `400` - No file uploaded, invalid file type, or file too large
- `500` - Upload failed

---

#### GET /api/posts/image/:fileName
Serve uploaded images (public).

**Parameters:**
- `fileName` - Image file name

**Response:** Image file with appropriate content-type header

**Error Responses:**
- `404` - Image not found

---

#### DELETE /api/posts/delete-image/:fileName
Delete an uploaded image (protected).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `fileName` - Image file name to delete

**Response (200):**
```json
{
  "message": "Image deleted successfully"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `404` - Image not found
- `500` - Deletion failed

---

#### GET /api/posts
Get all posts with pagination (public).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 10)
- `userId` - Filter by user ID (optional)

**Example:** `GET /api/posts?page=1&limit=10&userId=user_id`

**Response (200):**
```json
{
  "posts": [
    {
      "_id": "post_id",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "avatar": "avatar_url"
      },
      "text": "Post content",
      "image": "http://localhost:5000/api/posts/image/filename.jpg",
      "likes": ["user_id1", "user_id2"],
      "commentsCount": 3,
      "edited": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

#### GET /api/posts/:id
Get a single post by ID (public).

**Parameters:**
- `id` - Post ID

**Response (200):**
```json
{
  "_id": "post_id",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "avatar": "avatar_url"
  },
  "text": "Post content",
  "image": "http://localhost:5000/api/posts/image/filename.jpg",
  "likes": ["user_id1", "user_id2"],
  "commentsCount": 3,
  "edited": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404` - Post not found
- `400` - Invalid post ID

---

#### PUT /api/posts/:id
Edit a post (protected - owner only).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` - Post ID

**Request Body:**
```json
{
  "text": "Updated post content"
}
```

**Response (200):**
```json
{
  "_id": "post_id",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "avatar": "avatar_url"
  },
  "text": "Updated post content",
  "image": "http://localhost:5000/api/posts/image/filename.jpg",
  "likes": ["user_id1"],
  "commentsCount": 2,
  "edited": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Access denied (not owner)
- `404` - Post not found
- `400` - Text is required or too long

---

#### DELETE /api/posts/:id
Delete a post (protected - owner only).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` - Post ID

**Response (200):**
```json
{
  "msg": "Post removed"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Access denied (not owner)
- `404` - Post not found

---

#### POST /api/posts/:id/like
Toggle like on a post (protected).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` - Post ID

**Response (200):**
```json
{
  "likesCount": 5,
  "liked": true
}
```

**Error Responses:**
- `401` - No token or invalid token
- `404` - Post not found

---

### Comment Endpoints

#### POST /api/posts/:postId/comments
Create a comment on a post (protected).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `postId` - Post ID

**Request Body:**
```json
{
  "text": "Great post!"
}
```

**Response (201):**
```json
{
  "_id": "comment_id",
  "post": "post_id",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "avatar": "avatar_url"
  },
  "text": "Great post!",
  "edited": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `404` - Post not found
- `400` - Text is required or too long (max 300 characters)

---

#### GET /api/posts/:postId/comments
Get all comments for a post (public).

**Parameters:**
- `postId` - Post ID

**Response (200):**
```json
[
  {
    "_id": "comment_id",
    "post": "post_id",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "avatar": "avatar_url"
    },
    "text": "Great post!",
    "edited": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**
- `404` - Post not found

---

#### PUT /api/comments/:id
Edit a comment (protected - owner only).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` - Comment ID

**Request Body:**
```json
{
  "text": "Updated comment text"
}
```

**Response (200):**
```json
{
  "_id": "comment_id",
  "post": "post_id",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "avatar": "avatar_url"
  },
  "text": "Updated comment text",
  "edited": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Access denied (not owner)
- `404` - Comment not found
- `400` - Text is required or too long

---

#### DELETE /api/comments/:id
Delete a comment (protected - owner only).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` - Comment ID

**Response (200):**
```json
{
  "msg": "Comment removed"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `403` - Access denied (not owner)
- `404` - Comment not found

---

### Utility Endpoints

#### GET /api/health
Check server health status.

**Response (200):**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

#### GET /
Root endpoint.

**Response (200):**
```json
{
  "message": "Backend API is running"
}
```

---

#### GET /api/protected
Test protected route (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Access granted to protected route",
  "user": {
    "id": "user_id"
  }
}
```

**Error Responses:**
- `401` - No token or invalid token

---

## 🖼️ Image Upload Features

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limits
- Maximum file size: 5MB per image
- Automatic file validation and error handling

### Image Storage
- Images are stored in MinIO object storage
- Automatic filename generation with timestamps
- Images served through backend proxy for security
- Automatic cleanup of unused images

### Image URLs
All uploaded images are served through the backend proxy:
```
http://localhost:5000/api/posts/image/filename.jpg
```

### Migration Support
The application automatically migrates existing posts with old MinIO URLs to use the new proxy system on startup.

## 🔒 Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Sanitization**: All text inputs are sanitized to prevent XSS attacks
- **Owner-only Access**: Users can only modify their own posts and comments
- **Profile Privacy**: Users can only view their own posts on profile pages
- **File Upload Security**: File type validation, size limits, and secure storage
- **Image Proxy**: Images served through backend to prevent direct access to storage
- **Error Handling**: Consistent error responses without information leakage

## 📝 Data Models

### User
```javascript
{
  _id: ObjectId,
  name: String (required, max 100 chars),
  email: String (required, unique),
  passwordHash: String (required),
  avatar: String (optional),
  bio: String (optional, max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
```

### Post
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  text: String (required, max 500 chars),
  image: String (optional, proxy URL format),
  likes: [ObjectId] (refs: User),
  commentsCount: Number (default: 0),
  edited: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Comment
```javascript
{
  _id: ObjectId,
  post: ObjectId (ref: Post),
  user: ObjectId (ref: User),
  text: String (required, max 300 chars),
  edited: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

## 🚨 Error Response Format

All error responses follow this format:

```json
{
  "msg": "Error message",
  "errors": ["Optional array of validation errors"]
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `413` - Payload Too Large (file size exceeded)
- `500` - Internal Server Error

## 🛠 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Project Structure
```
backend/
├── config/
│   ├── db.js              # Database connection
│   └── minio.js           # MinIO storage configuration
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── usersController.js # User management & profile posts
│   ├── postsController.js # Post management & image uploads
│   └── commentsController.js # Comment management
├── middleware/
│   ├── auth.js           # JWT authentication middleware
│   ├── errorHandler.js   # Centralized error handling
│   └── upload.js         # File upload middleware (Multer)
├── models/
│   ├── User.js           # User schema
│   ├── Post.js           # Post schema
│   └── Comment.js        # Comment schema
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User routes & profile posts
│   ├── posts.js          # Post routes & image uploads
│   └── comments.js       # Comment routes
├── utils/
│   └── sanitizer.js      # Input sanitization utilities
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
├── server.js            # Application entry point
└── README.md            # This file
```

### Key Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.10.0",
  "minio": "^7.1.3",
  "multer": "^1.4.5-lts.1",
  "dompurify": "^3.0.5",
  "jsdom": "^22.1.0"
}
```

## 🚀 Deployment Notes

### Environment Configuration
- Set `BACKEND_URL` to your production domain for image proxy URLs
- Configure MinIO with proper SSL settings for production
- Use strong JWT secrets and secure database connections
- Set appropriate CORS origins for your frontend domain

### MinIO Production Setup
- Use SSL/TLS for MinIO connections (`MINIO_USE_SSL=true`)
- Configure proper bucket policies for security
- Set up CDN for better image delivery performance
- Regular backup of uploaded images

### Database Migration
The application automatically handles migration of existing posts to use the new image proxy system on startup.

## 📞 Support

For questions or issues, please refer to the backend code or contact me.
Email: harshkolte01@gmail.com

---

**Version:** 2.0.0 - Now with image upload support and enhanced profile privacy!
