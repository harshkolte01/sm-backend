const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { sanitizePostText } = require('../utils/sanitizer');
const { AppError } = require('../middleware/errorHandler');
const { minioClient } = require('../config/minio');
const { generateFileName } = require('../middleware/upload');

// Create a new post (protected)
const createPost = async (req, res, next) => {
    try {
        const { text, image } = req.body;

        // Validate required fields
        if (!text || text.trim().length === 0) {
            return next(new AppError('Text is required', 400));
        }

        // Validate text length (max 500 characters)
        if (text.length > 500) {
            return next(new AppError('Text must be 500 characters or less', 400));
        }

        // Sanitize text for XSS protection
        const sanitizedText = sanitizePostText(text);
        if (!sanitizedText) {
            return next(new AppError('Text is required', 400));
        }

        // Create new post
        const post = new Post({
            user: req.user.id,
            text: sanitizedText,
            image: image || undefined
        });

        await post.save();

        // Populate user info and return
        const populatedPost = await Post.findById(post._id)
            .populate('user', 'id name avatar');

        res.status(201).json(populatedPost);

    } catch (error) {
        next(error);
    }
};

// Get all posts (public with pagination and filtering)
const getPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, userId } = req.query;
        
        // Build query
        const query = {};
        if (userId) {
            query.user = userId;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get posts with pagination
        const posts = await Post.find(query)
            .populate('user', 'id name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination info
        const total = await Post.countDocuments(query);

        res.status(200).json({
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get single post by ID (public)
const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate('user', 'id name avatar');

        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        res.status(200).json(post);

    } catch (error) {
        next(error);
    }
};

// Edit post (protected - owner only)
const editPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        // Validate text
        if (!text || text.trim().length === 0) {
            return next(new AppError('Text is required', 400));
        }

        if (text.length > 500) {
            return next(new AppError('Text must be 500 characters or less', 400));
        }

        // Find post
        const post = await Post.findById(id);
        
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Check ownership
        if (post.user.toString() !== req.user.id) {
            return next(new AppError('Access denied. You can only edit your own posts', 403));
        }

        // Sanitize and update post
        const sanitizedText = sanitizePostText(text);
        if (!sanitizedText) {
            return next(new AppError('Text is required', 400));
        }
        
        post.text = sanitizedText;
        post.edited = true;
        await post.save();

        // Return updated post with populated user
        const updatedPost = await Post.findById(post._id)
            .populate('user', 'id name avatar');

        res.status(200).json(updatedPost);

    } catch (error) {
        next(error);
    }
};

// Delete post (protected - owner only)
const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find post
        const post = await Post.findById(id);
        
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Check ownership
        if (post.user.toString() !== req.user.id) {
            return next(new AppError('Access denied. You can only delete your own posts', 403));
        }

        // Delete all comments associated with this post
        await Comment.deleteMany({ post: id });

        // Delete post
        await Post.findByIdAndDelete(id);

        res.status(200).json({ msg: 'Post removed' });

    } catch (error) {
        next(error);
    }
};

// Toggle like on post (protected)
const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find post
        const post = await Post.findById(id);
        
        if (!post) {
            return next(new AppError('Post not found', 404));
        }

        // Check if user already liked the post
        const likeIndex = post.likes.indexOf(userId);
        
        if (likeIndex > -1) {
            // Unlike - remove user from likes array
            post.likes.splice(likeIndex, 1);
        } else {
            // Like - add user to likes array
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            likesCount: post.likes.length,
            liked: likeIndex === -1 // true if we just liked it
        });

    } catch (error) {
        next(error);
    }
};

// Upload image to MinIO (protected)
const uploadImage = (req, res, next) => {
    // Handle multer errors first
    if (req.fileValidationError) {
        console.log('File validation error:', req.fileValidationError);
        return next(new AppError(req.fileValidationError, 400));
    }

    // Async function for the actual upload
    const performUpload = async () => {
        try {
            console.log('Upload request received');
            console.log('Request file:', req.file ? 'File present' : 'No file');
            console.log('Request body:', req.body);
            console.log('Request headers:', req.headers['content-type']);
            
            // Check if file was uploaded
            if (!req.file) {
                console.log('No file in request');
                return next(new AppError('No image file provided', 400));
            }

            console.log('File details:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                buffer: req.file.buffer ? `Buffer size: ${req.file.buffer.length}` : 'No buffer'
            });

            // Generate unique filename
            const fileName = generateFileName(req.file.originalname);
            console.log('Generated filename:', fileName);
            
            // Check MinIO environment variables
            if (!process.env.MINIO_BUCKET_NAME || !process.env.MINIO_ENDPOINT || !process.env.MINIO_PORT) {
                console.error('Missing MinIO environment variables');
                return next(new AppError('MinIO configuration error', 500));
            }

            console.log('MinIO config:', {
                bucket: process.env.MINIO_BUCKET_NAME,
                endpoint: process.env.MINIO_ENDPOINT,
                port: process.env.MINIO_PORT
            });
            
            // Upload to MinIO
            console.log('Uploading to MinIO...');
            await minioClient.putObject(
                process.env.MINIO_BUCKET_NAME,
                fileName,
                req.file.buffer,
                req.file.size,
                {
                    'Content-Type': req.file.mimetype,
                    'Cache-Control': 'max-age=31536000' // 1 year cache
                }
            );

            console.log('Upload successful');

            // Generate public URL using our backend as proxy
            const baseUrl = process.env.BACKEND_URL;
            if (!baseUrl) {
                console.error('BACKEND_URL environment variable not set');
                return next(new AppError('Server configuration error', 500));
            }
            
            const imageUrl = `${baseUrl}/api/posts/image/${fileName}`;

            res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                imageUrl: imageUrl,
                fileName: fileName
            });

        } catch (error) {
            console.error('Image upload error:', error);
            console.error('Error stack:', error.stack);
            next(new AppError(`Failed to upload image: ${error.message}`, 500));
        }
    };

    performUpload();
};

// Delete image from MinIO (protected)
const deleteImage = async (req, res, next) => {
    try {
        const { fileName } = req.params;

        if (!fileName) {
            return next(new AppError('File name is required', 400));
        }

        // Delete from MinIO
        await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, fileName);

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Image deletion error:', error);
        next(new AppError('Failed to delete image', 500));
    }
};

// Serve image from MinIO (proxy endpoint)
const serveImage = async (req, res, next) => {
    try {
        const { fileName } = req.params;
        
        if (!fileName) {
            return next(new AppError('File name is required', 400));
        }

        console.log('Serving image:', fileName);

        // Get image from MinIO
        const imageStream = await minioClient.getObject(process.env.MINIO_BUCKET_NAME, fileName);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'image/jpeg'); // Default, will be overridden by actual type
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
        
        // Pipe the image stream to response
        imageStream.pipe(res);

    } catch (error) {
        console.error('Image serve error:', error);
        if (error.code === 'NoSuchKey') {
            return next(new AppError('Image not found', 404));
        }
        next(new AppError('Failed to serve image', 500));
    }
};

// Migrate existing MinIO URLs to proxy URLs
const migrateImageUrls = async () => {
    try {
        console.log('🔄 Checking for posts with old MinIO URLs...');
        
        const oldUrlPattern = new RegExp(`^http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET_NAME}/`);
        const postsToUpdate = await Post.find({
            image: { $regex: oldUrlPattern }
        });

        if (postsToUpdate.length === 0) {
            console.log('✅ No posts need URL migration');
            return;
        }

        console.log(`🔄 Migrating ${postsToUpdate.length} posts with old MinIO URLs...`);

        const baseUrl = process.env.BACKEND_URL;
        if (!baseUrl) {
            console.error('❌ BACKEND_URL environment variable not set - cannot migrate URLs');
            return;
        }

        for (const post of postsToUpdate) {
            // Extract filename from old URL
            const fileName = post.image.split('/').pop();
            // Generate new proxy URL
            const newUrl = `${baseUrl}/api/posts/image/${fileName}`;
            
            await Post.findByIdAndUpdate(post._id, { image: newUrl });
            console.log(`✅ Updated post ${post._id}: ${fileName}`);
        }

        console.log(`✅ Successfully migrated ${postsToUpdate.length} posts to use proxy URLs`);
    } catch (error) {
        console.error('❌ Error migrating image URLs:', error);
    }
};

module.exports = {
    createPost,
    getPosts,
    getPost,
    editPost,
    deletePost,
    toggleLike,
    uploadImage,
    deleteImage,
    serveImage,
    migrateImageUrls
};