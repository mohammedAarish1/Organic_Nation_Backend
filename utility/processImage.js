const Sharp = require('sharp')
const { s3Client } = require('../config/awsConfig.js');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require('path');


// const processImage = async (file, productId) => {
//     try {
//         const imageBuffer = await file.arrayBuffer();
//         const filename = `${productId}-${file.name.toLowerCase()}`;

//         // Generate sizes
//         const sizes = [
//             { width: 320, prefix: 'sm' },
//             { width: 640, prefix: 'md' },
//             { width: 960, prefix: 'lg' }
//         ];

//         // Generate blur placeholder
//         const blurredBuffer = await Sharp(imageBuffer)
//             .resize(20) // Tiny size for blur placeholder
//             .blur(10)
//             .toBuffer();

//         // Upload blur placeholder
//         await s3Client.send(new PutObjectCommand({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `products/blur/${filename}`,
//             Body: blurredBuffer,
//             ContentType: 'image/webp',
//             CacheControl: 'public, max-age=31536000'
//         }));

//         // Process and upload each size
//         const uploadPromises = sizes.map(async ({ width, prefix }) => {
//             const processedBuffer = await Sharp(imageBuffer)
//                 .resize(width, null, {
//                     withoutEnlargement: true,
//                     fit: 'contain'
//                 })
//                 .webp({ quality: 80 })
//                 .toBuffer();

//             await s3Client.send(new PutObjectCommand({
//                 Bucket: process.env.AWS_BUCKET_NAME,
//                 Key: `products/${prefix}/${filename}`,
//                 Body: processedBuffer,
//                 ContentType: 'image/webp',
//                 CacheControl: 'public, max-age=31536000'
//             }));
//         });

//         await Promise.all(uploadPromises);

//         // Return the image paths
//         return {
//             blur: `products/blur/${filename}`,
//             sm: `products/sm/${filename}`,
//             md: `products/md/${filename}`,
//             lg: `products/lg/${filename}`
//         };
//     } catch (error) {
//         console.error('Error processing image:', error);
//         throw error;
//     }
// };

const processImage = async (file, productId) => {
    try {
        // Use file.buffer instead of file.arrayBuffer since multer provides buffer directly
        const imageBuffer = file.buffer;
        const originalFilename = `${file.originalname.toLowerCase()}`;
        const filename = path.parse(originalFilename).name;
        // Generate sizes
        const sizes = [
            { width: 320, prefix: 'sm' },
            { width: 640, prefix: 'md' },
            { width: 960, prefix: 'lg' }
        ];

        // Generate blur placeholder
        const blurredBuffer = await Sharp(imageBuffer)
            .resize(20) // Tiny size for blur placeholder
            .blur(10)
            .webp({ quality: 20 }) // Lower quality for placeholder
            .toBuffer();

        // Upload blur placeholder
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `products/${productId}/blur/${filename}.webp`, // Add .webp extension
            Body: blurredBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000',
            ACL: 'public-read'

        }));

        // Process and upload each size
        const uploadPromises = sizes.map(async ({ width, prefix }) => {
            const processedBuffer = await Sharp(imageBuffer)
                .resize(width, null, {
                    withoutEnlargement: true,
                    fit: 'contain'
                })
                .webp({ quality: 80 })
                .toBuffer();

            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `products/${productId}/${prefix}/${filename}.webp`, // Add .webp extension
                Body: processedBuffer,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000',
                ACL: 'public-read'

            }));

            return `https://organic-nation-product-images.s3.amazonaws.com/products/${productId}/${prefix}/${filename}.webp`; // Return the path
        });

        const paths = await Promise.all(uploadPromises);

        // Return the image paths 
        return {
            blur: `https://organic-nation-product-images.s3.amazonaws.com/products/${productId}/blur/${filename}.webp`,
            sm: paths[0],
            md: paths[1],
            lg: paths[2]
        };
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
};


module.exports = { processImage };