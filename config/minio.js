const Minio = require('minio');
const { AppError } = require('../middleware/errorHandler');

// Create MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false, // Set to true if using HTTPS
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

// Initialize bucket if it doesn't exist
const initializeBucket = async () => {
    try {
        const bucketName = process.env.MINIO_BUCKET_NAME;
        const bucketExists = await minioClient.bucketExists(bucketName);
        
        if (!bucketExists) {
            await minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(`✅ MinIO bucket '${bucketName}' created successfully`);
        } else {
            console.log(`✅ MinIO bucket '${bucketName}' already exists`);
        }

        // Always set/update bucket policy to ensure public read access
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                }
            ]
        };
        
        try {
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
            console.log(`✅ MinIO bucket policy set for public read access`);
        } catch (policyError) {
            console.warn('⚠️ Failed to set bucket policy:', policyError.message);
            console.log('Images may not be publicly accessible');
        }

        // Test image URL accessibility
        const testUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/`;
        console.log(`📷 MinIO images will be accessible at: ${testUrl}[filename]`);
        
    } catch (error) {
        console.error('❌ MinIO bucket initialization failed:', error.message);
        throw new AppError('MinIO configuration error', 500);
    }
};

// Test MinIO connection
const testConnection = async () => {
    try {
        await minioClient.listBuckets();
        console.log('✅ MinIO connection successful');
        return true;
    } catch (error) {
        console.error('❌ MinIO connection failed:', error.message);
        return false;
    }
};

module.exports = {
    minioClient,
    initializeBucket,
    testConnection
};