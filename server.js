require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initializeBucket, testConnection } = require('./config/minio');

// Import models to register them with Mongoose
require('./models/User');
require('./models/Post');
require('./models/Comment');

// Import middleware
const auth = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');

const app = express();

// Initialize connections
const initializeServices = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Test MinIO connection and initialize bucket
        const minioConnected = await testConnection();
        if (minioConnected) {
            await initializeBucket();
            
            // Migrate existing image URLs to use proxy
            const { migrateImageUrls } = require('./controllers/postsController');
            await migrateImageUrls();
        } else {
            console.warn('⚠️  MinIO connection failed. Image upload will not work.');
        }
    } catch (error) {
        console.error('❌ Service initialization failed:', error.message);
        process.exit(1);
    }
};

initializeServices();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));

// Health endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend API is running' });
});

// Protected test route
app.get('/api/protected', auth, (req, res) => {
    res.status(200).json({
        message: 'Access granted to protected route',
        user: req.user
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api', commentsRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});