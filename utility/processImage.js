const Sharp = require('sharp')
const { s3Client } = require('../config/awsConfig.js');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require('path');



// for product images
// const processImage2 = async (file, productId) => {
//     try {
//         // Use file.buffer instead of file.arrayBuffer since multer provides buffer directly
//         const imageBuffer = file.buffer;
//         const originalFilename = `${file.originalname.toLowerCase()}`;
//         const filename = path.parse(originalFilename).name;
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
//             .webp({ quality: 20 }) // Lower quality for placeholder
//             .toBuffer();

//         // Upload blur placeholder
//         await s3Client.send(new PutObjectCommand({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `products/${productId}/blur/${filename}.webp`, // Add .webp extension
//             Body: blurredBuffer,
//             ContentType: 'image/webp',
//             CacheControl: 'public, max-age=31536000',
//             ACL: 'public-read'

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
//                 Key: `products/${productId}/${prefix}/${filename}.webp`, // Add .webp extension
//                 Body: processedBuffer,
//                 ContentType: 'image/webp',
//                 CacheControl: 'public, max-age=31536000',
//                 ACL: 'public-read'

//             }));

//             return `https://organic-nation-product-images.s3.amazonaws.com/products/${productId}/${prefix}/${filename}.webp`; // Return the path
//         });

//         const paths = await Promise.all(uploadPromises);

//         // Return the image paths 
//         return {
//             blur: `https://organic-nation-product-images.s3.amazonaws.com/products/${productId}/blur/${filename}.webp`,
//             sm: paths[0],
//             md: paths[1],
//             lg: paths[2]
//         };
//     } catch (error) {
//         console.error('Error processing image:', error);
//         throw error;
//     }
// };

// for banner images


const processImage = async (sizes, bucket, key, file) => {
    try {
        // Use file.buffer instead of file.arrayBuffer since multer provides buffer directly
        const imageBuffer = file.buffer;
        const originalFilename = `${file.originalname.toLowerCase()}`;
        const filename = path.parse(originalFilename).name;

        // Generate sizes for banner images (you can adjust these sizes based on your requirements)
        // const sizes = [
        //     { width: 640, prefix: 'sm' },  // Small size for mobile view
        //     { width: 1024, prefix: 'md' }, // Medium size for tablet or smaller laptop view
        //     { width: 1519, prefix: 'lg' }, // Original size for desktop/laptop view
        // ];

        // Generate blur placeholder for the banner image
        const blurredBuffer = await Sharp(imageBuffer)
            .resize(20) // Tiny size for blur placeholder
            .blur(10)
            .webp({ quality: 20 }) // Lower quality for placeholder
            .toBuffer();

        // Upload blur placeholder to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `${key}/blur/${filename}.webp`, // Add .webp extension
            Body: blurredBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000',
            ACL: 'public-read',
        }));

        // Process and upload each size (small, medium, large)
        const uploadPromises = sizes.map(async ({ width, prefix }) => {
            const processedBuffer = await Sharp(imageBuffer)
                .resize(width, null, {
                    withoutEnlargement: true,
                    fit: 'contain'
                })
                .webp({ quality: 100 }) // 100% quality for the main images
                .toBuffer();

            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: `${key}/${prefix}/${filename}.webp`, // Add .webp extension
                Body: processedBuffer,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000',
                ACL: 'public-read',
            }));

            return `https://${bucket}.s3.amazonaws.com/${key}/${prefix}/${filename}.webp`; // Return the path
        });

        const paths = await Promise.all(uploadPromises);

        // Return the image paths for the banner (blur, sm, md, lg)
        return {
            blur: `https://${bucket}.s3.amazonaws.com/${key}/blur/${filename}.webp`,
            sm: paths[0],
            md: paths[1],
            lg: paths[2],
        };
    } catch (error) {
        throw error;
    }
};




const uploadImgOnAWS = async (bucket, key, file) => {
    try {
        const imageBuffer = file.buffer;

        const originalFilename = `${file.originalname.toLowerCase()}`;
        const filename = path.parse(originalFilename).name;


        const processedBuffer = await Sharp(imageBuffer)
            // .resize(width, null, {
            //     withoutEnlargement: true,
            //     fit: 'contain'
            // })
            .webp({ quality: 100 }) // 100% quality for the main images
            .toBuffer();

        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `${key}/${filename}.webp`, // Add .webp extension
            Body: processedBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000',
            ACL: 'public-read',
        }));

        return `https://${bucket}.s3.amazonaws.com/${key}/${filename}.webp`; // Return the path

    } catch (error) {
        throw error
    }
}

module.exports = { processImage, uploadImgOnAWS };